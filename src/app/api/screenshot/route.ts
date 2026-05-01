/**
 * /api/screenshot
 *   POST — take a Puppeteer screenshot of a given URL, upload to Supabase storage,
 *          and return the public URL. Requires authentication.
 *
 * Uses @sparticuz/chromium + puppeteer-core for Vercel compatibility.
 */

import { NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { isValidUrl } from '@/lib/validation';

export interface ScreenshotResponse {
  screenshotUrl: string;
}

export const maxDuration = 60; // seconds — Puppeteer can be slow on cold start

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { user } = auth.session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  const { url } = (body ?? {}) as { url?: unknown };
  if (!isValidUrl(url)) {
    return errorResponse(400, 'INVALID_URL', 'url must be a valid http(s) URL.');
  }

  let browser;
  try {
    const puppeteer = (await import('puppeteer-core')).default;

    // @sparticuz/chromium ships a Linux-only binary — unusable on Windows/macOS
    // local dev. In development we locate the system Chrome instead.
    let launchOptions: Parameters<typeof puppeteer.launch>[0];

    if (process.env.NODE_ENV === 'development') {
      const { existsSync } = await import('fs');
      const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ];
      const executablePath = candidates.find((p) => existsSync(p));
      if (!executablePath) {
        return errorResponse(
          500,
          'CHROME_NOT_FOUND',
          'No Chrome installation found for local dev. Install Google Chrome and retry.',
        );
      }
      launchOptions = {
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: { width: 1200, height: 630 },
        headless: true,
      };
    } else {
      const chromium = (await import('@sparticuz/chromium')).default;
      launchOptions = {
        args: chromium.args,
        defaultViewport: { width: 1200, height: 630 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless as unknown as boolean,
      };
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    // Give the page up to 20 s to load; fall back gracefully on network errors
    await page.goto(url as string, { waitUntil: 'networkidle2', timeout: 20_000 });
    const screenshotBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
    browser = undefined;

    // Upload to Supabase storage
    const supabaseAdmin = createAdminSupabaseClient();
    const timestamp = Date.now();
    const storagePath = `screenshots/${user.id}/${timestamp}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('project-screenshots')
      .upload(storagePath, screenshotBuffer, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      return errorResponse(500, 'UPLOAD_ERROR', 'Failed to upload screenshot.', {
        message: uploadError.message,
      });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from('project-screenshots')
      .getPublicUrl(storagePath);

    const result: ScreenshotResponse = { screenshotUrl: publicData.publicUrl };
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    return errorResponse(500, 'SCREENSHOT_ERROR', 'Failed to capture screenshot.', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

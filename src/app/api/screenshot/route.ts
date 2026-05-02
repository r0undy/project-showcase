/**
 * /api/screenshot
 *   POST — take a Puppeteer screenshot of a given URL, upload to Supabase storage,
 *          and return the public URL. Requires authentication.
 *
 * Dev:  full `puppeteer` package (bundled Chromium, resolved via createRequire
 *       to bypass Turbopack's module interception).
 * Prod: puppeteer-core + @sparticuz/chromium (Vercel-compatible Lambda binary).
 */

import { createRequire } from 'module';
import { NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { isValidUrl } from '@/lib/validation';

// Force Node.js require() — dynamic import('puppeteer') gets intercepted by
// Turbopack even when listed in serverExternalPackages.
const _require = createRequire(import.meta.url);

export interface ScreenshotResponse {
  screenshotUrl: string;
}

export const maxDuration = 10;

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
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const puppeteer = _require('puppeteer') as any;
      browser = await puppeteer.launch({
        defaultViewport: { width: 1200, height: 630 },
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const puppeteer = _require('puppeteer-core') as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chromium = _require('@sparticuz/chromium') as any;
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1200, height: 630 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless as unknown as boolean,
      });
    }

    const page = await browser.newPage();

    // Block heavy resources to stay within the 10s Vercel Hobby limit
    await page.setRequestInterception(true);
    page.on('request', (req: { resourceType: () => string; abort: () => void; continue: () => void }) => {
      const type = req.resourceType();
      if (type === 'image' || type === 'media' || type === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    try {
      await page.goto(url as string, { waitUntil: 'domcontentloaded', timeout: 7_000 });
    } catch (navErr) {
      const msg = navErr instanceof Error ? navErr.message : String(navErr);
      // ERR_BLOCKED_BY_CLIENT means Chrome killed the page session — no screenshot possible.
      // Return a 422 so the form can fall back to manual upload gracefully.
      if (msg.includes('ERR_BLOCKED_BY_CLIENT') || msg.includes('ERR_ABORTED')) {
        await browser.close();
        browser = undefined;
        return errorResponse(
          422,
          'URL_BLOCKED',
          'Chrome blocked this URL (likely HTTP or security filter). Upload a screenshot manually instead.',
        );
      }
      // For other navigation errors (slow redirects, partial loads) continue and screenshot what loaded.
      console.warn('[/api/screenshot] navigation warning:', msg);
    }

    const screenshotBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
    browser = undefined;

    const supabaseAdmin = createAdminSupabaseClient();
    const storagePath = `screenshots/${user.id}/${Date.now()}.png`;

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

    return NextResponse.json({ screenshotUrl: publicData.publicUrl } satisfies ScreenshotResponse);
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/screenshot]', message);
    return errorResponse(500, 'SCREENSHOT_ERROR', 'Failed to capture screenshot.', { message });
  }
}

/**
 * Shared helpers for property + integration tests that talk to the live
 * Supabase project (`bkffopfnejyotqmhhgzu`).
 *
 * - `adminClient()` / `adminTestClient()` use the service role key. Bypasses RLS.
 *    Use for setup/teardown of test fixtures.
 * - `signedInClient()` performs a real anonymous sign-in and returns the
 *    user-scoped Supabase client + access token. Use for tests that need
 *    `auth.uid()` to be populated.
 *
 * NOTE: tests run against the real linked database. Always clean up created
 * rows in a `finally` block. The `users` row uses `auth.uid()` so cascade-delete
 * removes dependent rows (projects, reactions, onboarding_progress).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL || !ANON || !SERVICE) {
  throw new Error('Missing Supabase test env vars (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY).');
}

export function adminTestClient(): SupabaseClient<Database> {
  return createClient<Database>(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Sign in anonymously and return a user-scoped client + the access token.
 *
 * Retries with exponential backoff on rate-limit errors. Supabase default
 * rate limit on `/auth/v1/signup` is 30 per 5 minutes per IP, and a property-
 * test suite that creates fresh users each iteration will eventually trip it.
 */
export async function signedInClient(): Promise<{
  client: SupabaseClient<Database>;
  accessToken: string;
  authUserId: string;
}> {
  const ephemeral = createClient<Database>(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  let lastErr: Error | null = null;
  const delays = [1000, 3000, 7000, 15_000, 30_000]; // total ~56s of backoff
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const { data, error } = await ephemeral.auth.signInAnonymously();
    if (!error && data.session) {
      const accessToken = data.session.access_token;
      const authUserId = data.session.user.id;
      const client = createClient<Database>(URL, ANON, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
      return { client, accessToken, authUserId };
    }
    lastErr = new Error(`signInAnonymously failed: ${error?.message ?? 'no session'}`);
    const isRateLimit = (error?.message ?? '').toLowerCase().includes('rate limit');
    if (!isRateLimit || attempt >= delays.length) break;
    await new Promise((r) => setTimeout(r, delays[attempt]));
  }
  throw lastErr!;
}

/**
 * Generate a unique-enough username for parallel-safe tests.
 * Format: test_<timestamp>_<random> — short enough for the 64-char cap.
 */
export function uniqueUsername(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a `public.users` row tied to a fresh anonymous auth user.
 * Returns the access token + the public.users id (= auth.uid()).
 *
 * Cleanup: deleting the auth.users row via service role cascades to public.users
 * (FK ON DELETE CASCADE), but the simplest route is just to delete the public.users
 * row directly — its FKs cascade to projects/reactions/onboarding_progress.
 */
export async function createTestUserViaAuth(opts?: {
  username?: string;
  awsccId?: string;
}): Promise<{ accessToken: string; userId: string; username: string; client: SupabaseClient<Database> }> {
  const { client, accessToken, authUserId } = await signedInClient();
  const username = opts?.username ?? uniqueUsername();
  const awsccId = opts?.awsccId ?? `AWSCC-${authUserId.slice(0, 8)}`;
  const { error } = await client
    .from('users')
    .insert({ id: authUserId, username, awscc_id: awsccId });
  if (error) throw new Error(`createTestUserViaAuth insert failed: ${error.message}`);
  return { accessToken, userId: authUserId, username, client };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = adminTestClient();
  await admin.from('users').delete().eq('id', userId);
  // Also delete the auth.users entry so anonymous accounts don't pile up.
  await admin.auth.admin.deleteUser(userId).catch(() => undefined);
}

/** Build a Web Request suitable for handing to a Route Handler in tests. */
export function buildRequest(
  url: string,
  init: { method: string; body?: unknown; accessToken?: string; headers?: Record<string, string> }
): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init.headers ?? {}),
  };
  if (init.accessToken) headers['authorization'] = `Bearer ${init.accessToken}`;
  return new Request(url, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

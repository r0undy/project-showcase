/**
 * Auth helpers for Route Handlers.
 *
 * Strategy: clients sign in anonymously on the browser (`signInAnonymously()`),
 * receive an access token, and send it as `Authorization: Bearer <token>` on
 * every authenticated request to our API. These helpers parse + validate that
 * token on the server and produce a Supabase client that carries it forward,
 * so RLS sees the right `auth.uid()`.
 *
 * Failure responses follow the consistent ErrorResponse shape (Req 10.7/10.8).
 */

import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import type { ErrorResponse } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Extract a bearer token from `Authorization: Bearer <token>`, or null if missing/malformed. */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

export type Session = {
  user: User;
  accessToken: string;
  /** Per-request Supabase client carrying the bearer token. RLS-aware. */
  supabase: SupabaseClient<Database>;
};

/**
 * Validate the request's session.
 *
 * @returns the validated session, or `null` if no/invalid token.
 *
 * Validation hits Supabase Auth (`getUser`), so an expired/forged token is rejected.
 */
export async function getSession(request: Request): Promise<Session | null> {
  const accessToken = getBearerToken(request);
  if (!accessToken) return null;

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return { user: data.user, accessToken, supabase };
}

/**
 * Require a valid session. Returns `{ session }` on success, or
 * `{ response }` containing a 401 NextResponse on failure.
 *
 * Usage in a Route Handler:
 *
 *   const auth = await requireAuth(request);
 *   if ('response' in auth) return auth.response;
 *   const { user, supabase } = auth.session;
 */
export async function requireAuth(
  request: Request
): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await getSession(request);
  if (!session) {
    const body: ErrorResponse = {
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Sign in anonymously and retry with a Bearer token.',
    };
    return { response: NextResponse.json(body, { status: 401 }) };
  }
  return { session };
}

/**
 * Build a JSON error response matching the `ErrorResponse` interface.
 * Helper to keep error shape consistent across handlers (Req 10.8 / Property 13).
 */
export function errorResponse(
  status: number,
  error: string,
  message: string,
  details?: unknown
): NextResponse {
  const body: ErrorResponse = { error, message, ...(details !== undefined ? { details } : {}) };
  return NextResponse.json(body, { status });
}

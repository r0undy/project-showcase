/**
 * Supabase Client Configuration
 *
 * Three flavors:
 *   - Browser:        `getBrowserSupabaseClient()`        — singleton for Client Components.
 *                                                           Persists the anonymous session in localStorage.
 *   - Per-request server: `createServerSupabaseClient(token)` — for Route Handlers / Server Components.
 *                                                           Carries the caller's bearer token so RLS
 *                                                           sees the right `auth.uid()`.
 *   - Admin:          `createAdminSupabaseClient()`       — service-role client for admin tasks
 *                                                           that bypass RLS. NEVER expose to the browser.
 *
 * Auth strategy: anonymous Supabase sign-in. See aws-community-showcase/design.md.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Env validation (URL + anon key are public; service role is server-only)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// ---------------------------------------------------------------------------
// Browser client (singleton)
// ---------------------------------------------------------------------------
let browserClient: SupabaseClient<Database> | null = null;

export function getBrowserSupabaseClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  browserClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return browserClient;
}

/**
 * Backwards-compatible singleton export. Prefer `getBrowserSupabaseClient()`
 * in new code so Server Components don't accidentally pull a browser client.
 */
export const supabase = getBrowserSupabaseClient();

// ---------------------------------------------------------------------------
// Per-request server client
// ---------------------------------------------------------------------------
/**
 * Create a Supabase client for a single Route Handler / Server Component request.
 *
 * @param accessToken - The bearer token from the request's Authorization header.
 *                      When omitted, the client is unauthenticated (anonymous role).
 *
 * The token is forwarded as `Authorization: Bearer <token>` on every PostgREST
 * call, so RLS policies see the correct `auth.uid()`.
 */
export function createServerSupabaseClient(
  accessToken?: string
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

// ---------------------------------------------------------------------------
// Admin client (service role, bypasses RLS)
// ---------------------------------------------------------------------------
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This is required for server-side admin operations.'
    );
  }
  return createClient<Database>(supabaseUrl!, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Backwards-compatible alias. */
export const supabaseAdmin = createAdminSupabaseClient;

// ---------------------------------------------------------------------------
// Database schema types
// ---------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          awscc_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          awscc_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          awscc_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          media_url: string | null;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          media_url?: string | null;
          author_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          media_url?: string | null;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          reaction_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          reaction_type?: string;
          created_at?: string;
        };
      };
      onboarding_progress: {
        Row: {
          id: string;
          user_id: string;
          step_number: number;
          is_completed: boolean;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          step_number: number;
          is_completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          step_number?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};

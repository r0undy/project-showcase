/**
 * Supabase Client Configuration
 * 
 * This file provides Supabase client instances for both server-side and client-side usage.
 * - Server-side: Use for API routes and Server Components
 * - Client-side: Use for Client Components
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Client-side Supabase client
 * Use this in Client Components
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Server-side Supabase client with service role key
 * Use this in API routes for admin operations
 * WARNING: Never expose this client to the browser
 */
export const supabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This is required for server-side operations.'
    );
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Type-safe database types
 * These will be generated from your Supabase schema
 */
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

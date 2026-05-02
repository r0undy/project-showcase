'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/lib/supabase';

/**
 * Subscribes to `global_config` changes and refreshes the server component
 * tree the moment the workshop admin flips `part4_revealed`. No page refresh
 * required — the new Part 4 link/page appears live.
 */
export function RevealListener() {
  const router = useRouter();
  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    const channel = supabase
      .channel('global-config-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'global_config' },
        () => router.refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);
  return null;
}

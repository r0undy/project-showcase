import { cache } from 'react';
import { createServerSupabaseClient } from './supabase';

export interface GlobalConfig {
  part4_revealed: boolean;
}

/**
 * Read the workshop-wide config flags. Cached per request via React's `cache()`,
 * so calling this multiple times in the same render tree only hits the DB once.
 */
export const getGlobalConfig = cache(async (): Promise<GlobalConfig> => {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('global_config')
    .select('part4_revealed')
    .eq('id', 1)
    .single();
  return { part4_revealed: data?.part4_revealed ?? false };
});

'use client';

import { useEffect, useState, useRef } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase';

const CHANNEL_NAME = 'deploy-presence';

export interface PresenceViewer {
  username: string;
  userId?: string;
  avatarUrl?: string;
  ref: string; // stable per tab — used as React key
}

/**
 * Live attendee presence per deploy-guide part, powered by Supabase Realtime
 * Presence (in-memory — no DB rows). Every browser tab joins the same
 * `deploy-presence` channel; if `currentPart` is provided, the tab tracks
 * itself with `{ part, username, userId }`. Returns a map keyed by part slug
 * to the list of viewers — consumers can use `.length` for a count or render
 * the full list (e.g. an expandable presence card).
 */
export function useDeployPresence(
  currentPart?: string,
  currentUsername?: string,
  currentUserId?: string,
  currentAvatarUrl?: string,
): Record<string, PresenceViewer[]> {
  const [viewers, setViewers] = useState<Record<string, PresenceViewer[]>>({});
  const keyRef = useRef<string | null>(null);
  if (keyRef.current === null) {
    keyRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  }

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: keyRef.current! } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<
        string,
        Array<{ part?: string; username?: string; userId?: string; avatarUrl?: string }>
      >;
      const next: Record<string, PresenceViewer[]> = {};
      // Dedupe per (part, userId) so the same authenticated person opening
      // multiple tabs / refreshing during a navigation race only appears
      // once per part. Anonymous viewers fall back to their presence ref
      // since we can't tell them apart.
      const seen = new Set<string>();
      for (const [ref, presences] of Object.entries(state)) {
        // A presence key may have multiple tracked entries if track() was
        // called more than once on the same connection. Collapse to the
        // most recent so each tab appears exactly once.
        const p = presences[presences.length - 1];
        if (!p?.part) continue;
        const dedupeKey = p.userId ? `${p.part}:${p.userId}` : `${p.part}:${ref}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        if (!next[p.part]) next[p.part] = [];
        next[p.part].push({
          username: p.username ?? 'Anonymous',
          userId: p.userId,
          avatarUrl: p.avatarUrl,
          ref,
        });
      }
      setViewers(next);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && currentPart) {
        await channel.track({
          part: currentPart,
          username: currentUsername ?? 'Anonymous',
          userId: currentUserId,
          avatarUrl: currentAvatarUrl,
        });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [currentPart, currentUsername, currentUserId, currentAvatarUrl]);

  return viewers;
}

'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase';
import { useDeployPresence } from './useDeployPresence';

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

/**
 * Floating top-right pill showing how many people are currently viewing
 * this part of the deploy guide. Click it to expand a dropdown listing
 * the actual viewers (powered by Supabase Realtime Presence).
 */
export function PartPresenceCard({ part }: { part: string }) {
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.username) setUsername(data.username);
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const viewers = useDeployPresence(
    part,
    username ?? undefined,
    userId ?? undefined,
    avatarUrl ?? undefined,
  );
  const list = viewers[part] ?? [];
  const n = list.length;

  if (n === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: '5.25rem',
        right: '1.25rem',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '999px',
          background: 'oklch(11% 0.04 285 / 0.85)',
          border: '1px solid oklch(35% 0.08 285 / 0.5)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px oklch(0% 0 0 / 0.4)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--foreground)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
        }}
        className="hover:border-pink-400/40!"
        aria-expanded={open}
        aria-label={`${n} ${n === 1 ? 'person' : 'people'} on this part — click to ${open ? 'hide' : 'see'} the list`}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'oklch(75% 0.2 145)',
            boxShadow: '0 0 10px oklch(75% 0.2 145 / 0.7)',
            animation: 'presence-pulse 1.6s ease-in-out infinite',
          }}
        />
        <span>
          {n} {n === 1 ? 'person' : 'people'} on this part
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s',
            opacity: 0.7,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            minWidth: '240px',
            maxWidth: '280px',
            maxHeight: '60vh',
            overflowY: 'auto',
            background: 'oklch(11% 0.04 285 / 0.95)',
            border: '1px solid oklch(35% 0.08 285 / 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 12px 32px oklch(0% 0 0 / 0.55)',
            animation: 'presence-dropdown-in 0.16s ease-out both',
          }}
          className="hide-scrollbar"
        >
          <p
            style={{
              margin: '4px 8px 8px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}
          >
            Currently viewing
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {list.map((v) => {
              const isMe = userId !== null && v.userId === userId;
              return (
                <li
                  key={v.ref}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: isMe ? 'oklch(20% 0.06 285 / 0.6)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      flexShrink: 0,
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, oklch(45% 0.18 300), oklch(55% 0.22 340))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'white',
                      position: 'relative',
                    }}
                  >
                    {v.avatarUrl ? (
                      <Image
                        src={v.avatarUrl}
                        alt={v.username}
                        width={26}
                        height={26}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        unoptimized
                      />
                    ) : (
                      getInitials(v.username)
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        right: -1,
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: 'oklch(75% 0.2 145)',
                        border: '2px solid oklch(11% 0.04 285)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{v.username}
                  </span>
                  {isMe && (
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                      YOU
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <style>{`
        @keyframes presence-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes presence-dropdown-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

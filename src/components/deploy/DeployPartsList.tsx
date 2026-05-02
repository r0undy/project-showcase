'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useDeployPresence, type PresenceViewer } from './useDeployPresence';

const MAX_AVATARS = 3;

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function ViewerStack({ viewers }: { viewers: PresenceViewer[] }) {
  if (viewers.length === 0) return null;
  const visible = viewers.slice(0, MAX_AVATARS);
  const overflow = viewers.length - visible.length;

  return (
    <div
      title={viewers.map((v) => `@${v.username}`).join(', ')}
      style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: 4 }}
    >
      {visible.map((v) => (
        <div
          key={v.ref}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            marginLeft: -6,
            background: 'linear-gradient(135deg, oklch(45% 0.18 300), oklch(55% 0.22 340))',
            border: '2px solid oklch(11% 0.04 285)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 700,
            color: 'white',
          }}
        >
          {v.avatarUrl ? (
            <Image
              src={v.avatarUrl}
              alt={v.username}
              width={24}
              height={24}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              unoptimized
            />
          ) : (
            getInitials(v.username)
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            flexShrink: 0,
            marginLeft: -6,
            background: 'oklch(20% 0.08 145 / 0.6)',
            border: '2px solid oklch(11% 0.04 285)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            color: 'oklch(85% 0.18 145)',
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

interface Props {
  sections: Array<{ part: number; slug: string; title: string }>;
  partSummaries: Record<number, string>;
}

/**
 * Index-page parts list with a per-card "N viewing" badge sourced from
 * Supabase Realtime Presence. The list is fully client-rendered (was
 * inline JSX in the server page); the page still fetches the section
 * data server-side and passes it in.
 */
export function DeployPartsList({ sections, partSummaries }: Props) {
  const viewers = useDeployPresence();

  return (
    <div className="mt-3 flex flex-col" style={{ gap: '0.5rem' }}>
      {sections.map((section) => {
        const partViewers = viewers[section.slug] ?? [];
        return (
          <Link
            key={section.slug}
            href={`/deploy-to-aws/${section.slug}`}
            className="group flex items-center justify-between rounded-xl border border-border/50 bg-card transition hover:border-accent/60"
            style={{ padding: '0.85rem 1rem' }}
          >
            <div className="flex items-center" style={{ gap: '0.75rem' }}>
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full border border-border/70"
              />
              <div className="flex flex-col" style={{ gap: '0.2rem' }}>
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Part {section.part}
                </span>
                <span className="text-sm font-semibold text-foreground sm:text-base">
                  {section.title}
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {partSummaries[section.part] ?? 'Follow the guided steps.'}
                </span>
              </div>
            </div>

            <div className="flex items-center" style={{ gap: '0.85rem' }}>
              <ViewerStack viewers={partViewers} />
              <span
                aria-label="Open guide"
                className="text-accent transition group-hover:text-foreground group-hover:translate-x-0.5"
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

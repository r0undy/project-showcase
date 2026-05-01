'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProjectWithAuthor } from '@/types';

interface ProjectCardProps {
  project: ProjectWithAuthor;
  onReact: (projectId: string, emoji: string) => Promise<void>;
  reactPending?: boolean;
  currentUserId?: string | null;
  onEdit?: (project: ProjectWithAuthor) => void;
  onClick?: () => void;
}

function getDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export function ProjectCard({ project, onReact, reactPending = false, currentUserId, onEdit, onClick }: ProjectCardProps) {
  const { title, description, mediaUrl, url, author, reactionCount, hasReacted } = project;
  const domain = getDomain(url);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <article
      onClick={onClick}
      style={{
        background: 'oklch(12% 0.04 285 / 0.85)',
        border: '1px solid oklch(38% 0.08 285 / 0.35)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        breakInside: 'avoid',
        marginBottom: '20px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      className="group hover:border-pink-500/50 hover:shadow-[0_0_28px_oklch(60%_0.25_340/0.12)]"
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'linear-gradient(135deg, oklch(45% 0.18 300), oklch(55% 0.22 340))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            {author.avatarUrl && !avatarError ? (
              <Image
                src={author.avatarUrl}
                alt={author.username}
                width={30}
                height={30}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                unoptimized
                onError={() => setAvatarError(true)}
              />
            ) : (
              getInitials(author.username)
            )}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>
            @{author.username}
          </span>
        </div>

        {/* Edit button — owner only */}
        {currentUserId === project.authorId && onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            aria-label="Edit project"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              color: 'oklch(55% 0.08 285)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
            className="hover:text-pink-400 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Link preview embed */}
      <div style={{ margin: '0 12px 14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid oklch(35% 0.07 285 / 0.4)' }}>
        {/* Preview image */}
        {mediaUrl ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1200/630', background: 'oklch(8% 0.03 285)' }}>
            <Image
              src={mediaUrl}
              alt={`Preview of ${title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 380px"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1200/630',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, oklch(14% 0.06 285), oklch(18% 0.1 320))',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="oklch(40% 0.1 285)" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Preview content */}
        <div style={{ padding: '12px 14px', background: 'oklch(9% 0.035 285)' }}>
          {/* Top row: domain + View Project button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {domain && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}
              >
                {domain}
              </span>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  background: 'linear-gradient(135deg, oklch(22% 0.07 285), oklch(26% 0.1 310))',
                  border: '1px solid oklch(40% 0.08 285 / 0.4)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'opacity 0.15s',
                  flexShrink: 0,
                }}
                className="hover:opacity-75"
              >
                View Project
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--foreground)',
              lineHeight: 1.35,
              margin: '0 0 6px',
            }}
          >
            {title}
          </h3>

          {/* Description with fade on overflow */}
          {description && (
            <div
              style={{
                position: 'relative',
                maxHeight: '3.6em',
                overflow: 'hidden',
                marginBottom: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {description}
              </p>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2em',
                  background: 'linear-gradient(to bottom, transparent, oklch(9% 0.035 285))',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}

          {/* Bottom row: emoji reaction pills */}
          {project.reactions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {project.reactions.slice(0, 4).map((r) => (
                <button
                  key={r.emoji}
                  onClick={(e) => { e.stopPropagation(); onReact(project.id, r.emoji); }}
                  disabled={reactPending}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: r.hasReacted ? 'oklch(28% 0.1 340 / 0.4)' : 'oklch(16% 0.04 285)',
                    border: '1px solid',
                    borderColor: r.hasReacted ? 'oklch(65% 0.25 340 / 0.5)' : 'oklch(35% 0.06 285 / 0.4)',
                    borderRadius: '20px',
                    padding: '2px 8px',
                    cursor: reactPending ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    color: r.hasReacted ? 'oklch(70% 0.25 340)' : 'oklch(65% 0.08 285)',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                    opacity: reactPending ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: '13px', lineHeight: 1 }}>{r.emoji}</span>
                  {r.count}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

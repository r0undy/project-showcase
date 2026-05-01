'use client';

import Image from 'next/image';
import type { ProjectWithAuthor } from '@/types';

interface ProjectCardProps {
  project: ProjectWithAuthor;
  onReact: (projectId: string) => Promise<void>;
  reactPending?: boolean;
}

export function ProjectCard({ project, onReact, reactPending = false }: ProjectCardProps) {
  const { title, description, mediaUrl, url, author, reactionCount, hasReacted } = project;

  return (
    <article
      style={{
        background: 'oklch(12% 0.04 285 / 0.8)',
        border: '1px solid oklch(40% 0.08 285 / 0.4)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      className="group hover:border-pink-500/60 hover:shadow-[0_0_20px_oklch(60%_0.25_340_/_0.15)]"
    >
      {/* Screenshot preview */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'oklch(8% 0.03 285)' }}>
        {mediaUrl ? (
          <Image
            src={mediaUrl}
            alt={`Screenshot of ${title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, oklch(15% 0.06 285), oklch(20% 0.1 320))',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="oklch(50% 0.1 285)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {/* Title + external link */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--foreground)',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {title}
          </h3>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open project"
              style={{ color: 'oklch(65% 0.2 340)', flexShrink: 0, marginTop: '2px' }}
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: '13px',
            color: 'var(--muted-foreground)',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {description}
        </p>

        {/* Footer: author + reactions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'oklch(55% 0.08 285)' }}>
            @{author.username}
          </span>

          <button
            onClick={() => onReact(project.id)}
            disabled={reactPending}
            aria-label={hasReacted ? 'Remove reaction' : 'React to project'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: '1px solid',
              borderColor: hasReacted ? 'oklch(65% 0.25 340 / 0.6)' : 'oklch(40% 0.05 285 / 0.5)',
              borderRadius: '20px',
              padding: '3px 10px',
              cursor: reactPending ? 'not-allowed' : 'pointer',
              color: hasReacted ? 'oklch(70% 0.25 340)' : 'oklch(55% 0.08 285)',
              fontSize: '12px',
              transition: 'all 0.15s',
              opacity: reactPending ? 0.6 : 1,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={hasReacted ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {reactionCount}
          </button>
        </div>
      </div>
    </article>
  );
}

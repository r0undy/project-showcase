'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import type { EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import type { ProjectWithAuthor } from '@/types';

interface ProjectSidebarProps {
  project: ProjectWithAuthor | null;
  currentUserId: string | null;
  onClose: () => void;
  onReact: (projectId: string, emoji: string) => Promise<void>;
  reactPending?: boolean;
  onEdit?: (project: ProjectWithAuthor) => void;
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

export function ProjectSidebar({
  project,
  currentUserId,
  onClose,
  onReact,
  reactPending = false,
  onEdit,
}: ProjectSidebarProps) {
  const isOpen = project !== null;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close picker when sidebar closes
  useEffect(() => {
    if (!isOpen) setPickerOpen(false);
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (pickerOpen) { setPickerOpen(false); return; }
        onClose();
      }
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, pickerOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const domain = getDomain(project?.url);
  const { title, description, mediaUrl, url, author, reactionCount, hasReacted } = project ?? {
    title: '', description: '', mediaUrl: undefined, url: undefined,
    author: { username: '' }, reactionCount: 0, hasReacted: false,
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'oklch(5% 0.04 285 / 0.6)',
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Sidebar panel */}
      <aside
        aria-label="Project details"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 201,
          width: 'min(440px, 100vw)',
          background: 'oklch(10% 0.04 285)',
          borderLeft: '1px solid oklch(38% 0.08 285 / 0.35)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0, 0.15, 1)',
          boxShadow: '-20px 0 60px oklch(5% 0.04 285 / 0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid oklch(30% 0.06 285 / 0.35)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Project
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'oklch(55% 0.08 285)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
            }}
            className="hover:text-foreground transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Preview image */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1200/630', background: 'oklch(8% 0.03 285)', flexShrink: 0 }}>
            {mediaUrl ? (
              <Image
                src={mediaUrl}
                alt={`Preview of ${title}`}
                fill
                sizes="440px"
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
                  background: 'linear-gradient(135deg, oklch(14% 0.06 285), oklch(18% 0.1 320))',
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="oklch(35% 0.1 285)" strokeWidth="1.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '20px' }}>
            {/* Author row + edit button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, oklch(45% 0.18 300), oklch(55% 0.22 340))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {author.avatarUrl ? (
                    <Image
                      src={author.avatarUrl}
                      alt={author.username}
                      width={34}
                      height={34}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      unoptimized
                    />
                  ) : (
                    getInitials(author.username)
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                    @{author.username}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-foreground)' }}>Author</p>
                </div>
              </div>

              {project && currentUserId === project.authorId && onEdit && (
                <button
                  onClick={() => { onEdit(project); onClose(); }}
                  aria-label="Edit project"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'oklch(16% 0.05 285)',
                    border: '1px solid oklch(38% 0.06 285 / 0.4)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                  className="hover:text-foreground hover:border-pink-500/40 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>

            {/* Domain + View Project */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {domain && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
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
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    background: 'linear-gradient(135deg, oklch(22% 0.07 285), oklch(26% 0.1 310))',
                    border: '1px solid oklch(40% 0.08 285 / 0.4)',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    transition: 'opacity 0.15s',
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
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--foreground)',
                lineHeight: 1.3,
                margin: '0 0 10px',
              }}
            >
              {title}
            </h2>

            {/* Description */}
            {description && (
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.65,
                  margin: '0 0 20px',
                }}
              >
                {description}
              </p>
            )}

            {/* Reactions section */}
            <div>
              {/* Existing emoji pills */}
              {project && project.reactions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {project.reactions.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => project && onReact(project.id, r.emoji)}
                      disabled={reactPending}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: r.hasReacted ? 'oklch(28% 0.1 340 / 0.4)' : 'oklch(16% 0.05 285)',
                        border: '1px solid',
                        borderColor: r.hasReacted ? 'oklch(65% 0.25 340 / 0.5)' : 'oklch(38% 0.06 285 / 0.4)',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        cursor: reactPending ? 'not-allowed' : 'pointer',
                        color: r.hasReacted ? 'oklch(70% 0.25 340)' : 'var(--muted-foreground)',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.15s',
                        opacity: reactPending ? 0.6 : 1,
                      }}
                    >
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>{r.emoji}</span>
                      {r.count}
                    </button>
                  ))}
                </div>
              )}

              {/* Add reaction button + picker */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setPickerOpen((o) => !o)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'oklch(16% 0.05 285)',
                    border: '1px solid oklch(38% 0.06 285 / 0.4)',
                    borderRadius: '20px',
                    padding: '5px 14px',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  className="hover:text-foreground transition-colors"
                  aria-label="Add reaction"
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
                  Add reaction
                </button>

                {pickerOpen && (
                  <div
                    style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 10 }}
                  >
                    <EmojiPicker
                      theme={'dark' as EmojiTheme}
                      onEmojiClick={(data: EmojiClickData) => {
                        if (project) onReact(project.id, data.emoji);
                        setPickerOpen(false);
                      }}
                      width={320}
                      height={380}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>,
    document.body,
  );
}

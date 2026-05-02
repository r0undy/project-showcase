'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import type { ProjectWithAuthor } from '@/types';
import { ReactionPill } from './ReactionPill';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👎', '😡'];
const QUICK_BAR_W = 352;

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
  const { title, description, mediaUrl, url, author } = project;
  const domain = getDomain(url);
  const [avatarError, setAvatarError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [quickBarOpen, setQuickBarOpen] = useState(false);
  const [quickBarPos, setQuickBarPos] = useState({ top: 0, left: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const quickBarRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  // Close full picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (pickerRef.current?.contains(e.target as Node)) return;
      if (quickBarRef.current?.contains(e.target as Node)) return;
      setPickerOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [pickerOpen]);

  function scheduleClose() {
    closeTimer.current = setTimeout(() => {
      setQuickBarOpen(false);
      setPickerOpen(false);
    }, 120);
  }

  function keepOpen() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const openQuickBar = useCallback(() => {
    keepOpen();
    const rect = addBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(
      rect.left + rect.width / 2 - QUICK_BAR_W / 2,
      window.innerWidth - QUICK_BAR_W - 8
    ));
    setQuickBarPos({ top: rect.top - 58, left });
    setQuickBarOpen(true);
  }, []);

  function openFullPicker() {
    const top = quickBarPos.top - 420 - 8;
    const left = Math.max(8, Math.min(quickBarPos.left, window.innerWidth - 320 - 8));
    setPickerPos({ top: top < 8 ? quickBarPos.top + 58 + 8 : top, left });
    setPickerOpen((v) => !v);
  }

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); scheduleClose(); }}
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
      <div style={{ margin: '0 12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid oklch(35% 0.07 285 / 0.4)' }}>
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

        <div style={{ padding: '12px 14px', background: 'oklch(9% 0.035 285)' }}>
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

          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.35, margin: '0 0 6px' }}>
            {title}
          </h3>

          {description && <ClampedDescription text={description} />}
        </div>
      </div>

      {/* Top comments preview */}
      {project.topComments.length > 0 && (
        <div style={{ padding: '8px 14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {project.topComments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, oklch(45% 0.18 300), oklch(55% 0.22 340))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {c.author.avatarUrl ? (
                  <Image
                    src={c.author.avatarUrl}
                    alt={c.author.username}
                    width={22}
                    height={22}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    unoptimized
                  />
                ) : (
                  getInitials(c.author.username)
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--muted-foreground)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>@{c.author.username}</span>{' '}
                {c.content}
              </p>
            </div>
          ))}
          {project.commentCount > project.topComments.length && (
            <p
              style={{
                margin: 0,
                paddingLeft: '30px',
                fontSize: '11px',
                color: 'oklch(50% 0.06 285)',
                fontWeight: 500,
              }}
            >
              View {project.commentCount - project.topComments.length} more comment{project.commentCount - project.topComments.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Reaction bar */}
      <div style={{ padding: '10px 14px 14px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {project.reactions.map((r) => (
            <ReactionPill
              key={r.emoji}
              reaction={r}
              onClick={() => onReact(project.id, r.emoji)}
              disabled={reactPending}
              currentUserId={currentUserId}
            />
          ))}

          {/* Add reaction button — visible on card hover. Hidden for
           * unauthenticated visitors since reacting requires a session. */}
          {currentUserId && (
          <button
            ref={addBtnRef}
            onMouseEnter={(e) => { e.stopPropagation(); openQuickBar(); }}
            onMouseLeave={scheduleClose}
            onClick={(e) => { e.stopPropagation(); openQuickBar(); }}
            title="Add reaction"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              background: quickBarOpen ? 'oklch(24% 0.06 285)' : 'oklch(16% 0.04 285)',
              border: '1px solid',
              borderColor: quickBarOpen ? 'oklch(55% 0.15 285 / 0.5)' : 'oklch(35% 0.06 285 / 0.4)',
              borderRadius: '20px',
              padding: '4px 10px',
              cursor: 'pointer',
              color: 'oklch(55% 0.08 285)',
              fontWeight: 600,
              transition: 'all 0.18s',
              opacity: isHovered || quickBarOpen || pickerOpen ? 1 : 0,
              pointerEvents: isHovered || quickBarOpen || pickerOpen ? 'auto' : 'none',
              transform: isHovered || quickBarOpen || pickerOpen ? 'scale(1)' : 'scale(0.85)',
            }}
            className="hover:text-pink-400! hover:border-pink-400/40!"
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>😊</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          )}

          {/* Comment count badge — rightmost */}
          {project.commentCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'oklch(55% 0.08 285)',
                padding: '4px 8px',
                marginLeft: 'auto',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {project.commentCount}
            </span>
          )}
        </div>
      </div>

      {/* Quick reaction bar portal */}
      {mounted && quickBarOpen && createPortal(
        <div
          ref={quickBarRef}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: quickBarPos.top,
            left: quickBarPos.left,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'oklch(16% 0.05 285)',
            border: '1px solid oklch(35% 0.08 285 / 0.5)',
            borderRadius: '999px',
            padding: '5px 8px',
            boxShadow: '0 8px 32px oklch(0% 0 0 / 0.45), 0 0 0 1px oklch(100% 0 0 / 0.04)',
            animation: 'quickbar-in 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {QUICK_EMOJIS.map((emoji) => {
            const alreadyReacted = project.reactedEmojis.includes(emoji);
            return (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(project.id, emoji);
                  setQuickBarOpen(false);
                }}
                title={emoji}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: alreadyReacted ? 'oklch(28% 0.1 340 / 0.5)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '22px',
                  lineHeight: 1,
                  transition: 'transform 0.12s, background 0.12s',
                  outline: alreadyReacted ? '1.5px solid oklch(65% 0.25 340 / 0.6)' : 'none',
                }}
                className="hover:scale-125 hover:bg-white/10!"
              >
                {emoji}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: '1px', height: '22px', background: 'oklch(40% 0.06 285 / 0.5)', margin: '0 4px' }} />

          {/* More / full picker */}
          <button
            onClick={(e) => { e.stopPropagation(); openFullPicker(); }}
            title="More reactions"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: pickerOpen ? 'oklch(28% 0.1 285 / 0.5)' : 'transparent',
              cursor: 'pointer',
              color: 'oklch(60% 0.08 285)',
              transition: 'transform 0.12s, background 0.12s, color 0.12s',
            }}
            className="hover:scale-110! hover:bg-white/10! hover:text-pink-400!"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>,
        document.body
      )}

      {/* Full emoji picker portal */}
      {mounted && pickerOpen && createPortal(
        <div
          ref={pickerRef}
          style={{
            position: 'fixed',
            top: pickerPos.top,
            left: pickerPos.left,
            zIndex: 9999,
            filter: 'drop-shadow(0 8px 32px oklch(0% 0 0 / 0.5))',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
        >
          <EmojiPicker
            onEmojiClick={(data) => {
              onReact(project.id, data.emoji);
              setPickerOpen(false);
              setQuickBarOpen(false);
            }}
            width={320}
            height={400}
            lazyLoadEmojis
          />
        </div>,
        document.body
      )}
    </article>
  );
}

function ClampedDescription({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight - el.clientHeight > 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div style={{ position: 'relative' }}>
      <p
        ref={ref}
        style={{
          fontSize: '13px',
          color: 'var(--muted-foreground)',
          lineHeight: 1.55,
          margin: 0,
          maxHeight: '3.6em',
          overflow: 'hidden',
        }}
      >
        {text}
      </p>
      {overflowing && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '2em',
            background: 'linear-gradient(to bottom, transparent, oklch(9% 0.035 285))',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

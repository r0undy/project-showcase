'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import Image from 'next/image';
import { getBrowserSupabaseClient } from '@/lib/supabase';
import type { CommentWithAuthor } from '@/types';

interface CommentsSectionProps {
  projectId: string;
  currentUserId: string | null;
}

export interface CommentsSectionHandle {
  addComment: (comment: CommentWithAuthor) => void;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - +new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export const CommentsSection = forwardRef<CommentsSectionHandle, CommentsSectionProps>(
  function CommentsSection({ projectId, currentUserId }, ref) {
    const [comments, setComments] = useState<CommentWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    useImperativeHandle(ref, () => ({
      addComment(comment: CommentWithAuthor) {
        setComments((prev) => prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]);
      },
    }));

    const fetchComments = useCallback(async () => {
      const res = await fetch(`/api/comments?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
      setLoading(false);
    }, [projectId]);

    useEffect(() => {
      setLoading(true);
      setComments([]);
      fetchComments();

      const supabase = getBrowserSupabaseClient();
      const channel = supabase
        .channel(`comments:${projectId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'comments', filter: `project_id=eq.${projectId}` },
          async (payload) => {
            const { data } = await supabase
              .from('comments')
              .select('*, author:users!comments_user_id_fkey(username, avatar_url)')
              .eq('id', (payload.new as { id: string }).id)
              .single();
            if (!data) return;
            const authorObj = Array.isArray(data.author) ? data.author[0] : data.author;
            const incoming: CommentWithAuthor = {
              id: data.id,
              userId: data.user_id,
              projectId: data.project_id,
              content: data.content,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              author: { username: authorObj?.username ?? 'unknown', avatarUrl: authorObj?.avatar_url ?? undefined },
            };
            setComments((prev) => prev.some((c) => c.id === incoming.id) ? prev : [...prev, incoming]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'comments', filter: `project_id=eq.${projectId}` },
          (payload) => {
            setComments((prev) => prev.filter((c) => c.id !== (payload.old as { id: string }).id));
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }, [projectId, fetchComments]);

    async function handleDelete(commentId: string, snapshot: CommentWithAuthor) {
      setDeletingIds((s) => new Set(s).add(commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));

      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setComments((prev) => [...prev, snapshot].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        setDeletingIds((s) => { const next = new Set(s); next.delete(commentId); return next; });
        return;
      }

      const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        setComments((prev) => [...prev, snapshot].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      }
      setDeletingIds((s) => { const next = new Set(s); next.delete(commentId); return next; });
    }

    return (
      <div style={{ padding: '20px 20px 12px' }}>
        <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Comments {!loading && `(${comments.length})`}
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'oklch(20% 0.04 285)', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ height: 10, width: '40%', borderRadius: 4, background: 'oklch(20% 0.04 285)' }} />
                  <div style={{ height: 10, width: '80%', borderRadius: 4, background: 'oklch(18% 0.04 285)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'oklch(40% 0.06 285)', textAlign: 'center', padding: '20px 0' }}>
            No comments yet. Be the first!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {comments.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  padding: '10px 0',
                  borderTop: i > 0 ? '1px solid oklch(25% 0.05 285 / 0.4)' : 'none',
                  opacity: deletingIds.has(c.id) ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: 'linear-gradient(135deg, oklch(45% 0.18 300), oklch(55% 0.22 340))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: 'white',
                  }}
                >
                  {c.author.avatarUrl ? (
                    <Image src={c.author.avatarUrl} alt={c.author.username} width={28} height={28}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
                  ) : getInitials(c.author.username)}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                      @{c.author.username}
                    </span>
                    <span style={{ fontSize: '11px', color: 'oklch(42% 0.06 285)' }}>
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.55, wordBreak: 'break-word' }}>
                    {c.content}
                  </p>
                </div>

                {/* Delete — own only */}
                {c.userId === currentUserId && (
                  <button
                    onClick={() => handleDelete(c.id, c)}
                    disabled={deletingIds.has(c.id)}
                    aria-label="Delete comment"
                    style={{
                      display: 'flex', alignItems: 'center', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'oklch(38% 0.06 285)', padding: '2px',
                      borderRadius: '4px', flexShrink: 0, transition: 'color 0.12s',
                    }}
                    className="hover:text-red-400!"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

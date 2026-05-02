'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase';
import type { ProjectWithAuthor } from '@/types';
import { ProjectCard } from './ProjectCard';
import { ProjectSidebar } from './ProjectSidebar';
import { SubmitProjectModal } from './SubmitProjectModal';

interface ShowcaseGridProps {
  initialProjects: ProjectWithAuthor[];
}

export function ShowcaseGrid({ initialProjects }: ShowcaseGridProps) {
  const [projects, setProjects] = useState<ProjectWithAuthor[]>(initialProjects);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithAuthor | null>(null);
  const [reactingIds, setReactingIds] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<ProjectWithAuthor | null>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const currentUserIdRef = useRef<string | null>(null);

  // Dynamic tab title: reflects open project + unseen activity badge while hidden.
  useEffect(() => {
    const base = 'Community Showcase · From Vibe to Live';
    const focused = selectedProject ? `${selectedProject.title} · Community Showcase` : base;
    document.title = unseenCount > 0 ? `(${unseenCount}) ${focused}` : focused;
  }, [selectedProject, unseenCount]);

  // Reset the unseen badge as soon as the tab becomes visible again.
  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) setUnseenCount(0);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const refreshProjects = useCallback(async () => {
    const supabase = getBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch('/api/projects', { headers });
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects ?? []);
    }
  }, []);

  function handleEditProject(project: ProjectWithAuthor) {
    setEditingProject(project);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setTimeout(() => setEditingProject(null), 200);
  }

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUserId(session.user.id);
        // Re-fetch with auth so reactedEmojis are correct (server render has no token)
        refreshProjects();
        supabase
          .from('users')
          .select('id, username')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setIsAuthenticated(!!data);
            if (data?.username) setCurrentUsername(data.username);
          });
      }
    });
  }, [refreshProjects]);

  // Realtime: keep the project list in sync across all sessions.
  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    // Debounced refresh — coalesces rapid bursts (e.g. multiple comments).
    let pending: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => { refreshProjects(); pending = null; }, 300);
    };

    const bumpIfHidden = () => {
      if (document.hidden) setUnseenCount((n) => n + 1);
    };

    const channel = supabase
      .channel('projects-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, () => {
        bumpIfHidden();
        scheduleRefresh();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, scheduleRefresh)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'projects' }, (payload) => {
        const deletedId = (payload.old as { id: string }).id;
        setProjects((prev) => prev.filter((p) => p.id !== deletedId));
        setSelectedProject((prev) => prev?.id === deletedId ? null : prev);
      })
      // Comments affect each card's top-comments preview + count
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
        bumpIfHidden();
        scheduleRefresh();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, scheduleRefresh)
      .subscribe();

    return () => {
      if (pending) clearTimeout(pending);
      supabase.removeChannel(channel);
    };
  }, [refreshProjects]);

  // Realtime: keep reactions in sync across all sessions.
  // Own reactions are skipped — the optimistic update already handled them.
  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    const channel = supabase
      .channel('reactions-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        async (payload) => {
          const { project_id, user_id, reaction_type } = payload.new as {
            project_id: string; user_id: string; reaction_type: string;
          };
          if (user_id === currentUserIdRef.current) return;
          // Look up the reactor's username so the tooltip can show them
          const { data: userData } = await supabase
            .from('users').select('username').eq('id', user_id).single();
          const username = userData?.username ?? 'unknown';
          const newReactor = { userId: user_id, username };
          setProjects((prev) =>
            prev.map((p) => {
              if (p.id !== project_id) return p;
              const existing = p.reactions.find((r) => r.emoji === reaction_type);
              return {
                ...p,
                reactions: existing
                  ? p.reactions.map((r) => r.emoji === reaction_type
                      ? { ...r, count: r.count + 1, reactors: [...r.reactors, newReactor] }
                      : r)
                  : [...p.reactions, { emoji: reaction_type, count: 1, hasReacted: false, reactors: [newReactor] }],
                reactionCount: p.reactionCount + 1,
              };
            })
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reactions' },
        (payload) => {
          const { project_id, user_id, reaction_type } = payload.old as {
            project_id: string; user_id: string; reaction_type: string;
          };
          if (user_id === currentUserIdRef.current) return;
          setProjects((prev) =>
            prev.map((p) => {
              if (p.id !== project_id) return p;
              return {
                ...p,
                reactions: p.reactions
                  .map((r) => r.emoji === reaction_type
                    ? { ...r, count: r.count - 1, reactors: r.reactors.filter((x) => x.userId !== user_id) }
                    : r)
                  .filter((r) => r.count > 0),
                reactionCount: Math.max(0, p.reactionCount - 1),
              };
            })
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleReact(projectId: string, emoji: string) {
    if (reactingIds.has(projectId)) return;
    const supabase = getBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const isToggleOff = project.reactedEmojis.includes(emoji);

    // Optimistic update
    setReactingIds((s) => new Set(s).add(projectId));
    const myReactor = currentUserId
      ? { userId: currentUserId, username: currentUsername ?? 'you' }
      : null;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        if (isToggleOff) {
          const updatedEmojis = p.reactedEmojis.filter((e) => e !== emoji);
          return {
            ...p,
            reactions: p.reactions
              .map((r) => r.emoji === emoji
                ? { ...r, count: r.count - 1, hasReacted: false, reactors: r.reactors.filter((x) => x.userId !== currentUserId) }
                : r)
              .filter((r) => r.count > 0),
            reactionCount: p.reactionCount - 1,
            hasReacted: updatedEmojis.length > 0,
            reactedEmojis: updatedEmojis,
          };
        }
        // Add new emoji reaction
        const existing = p.reactions.find((r) => r.emoji === emoji);
        return {
          ...p,
          reactions: existing
            ? p.reactions.map((r) => r.emoji === emoji
                ? { ...r, count: r.count + 1, hasReacted: true, reactors: myReactor ? [...r.reactors, myReactor] : r.reactors }
                : r)
            : [...p.reactions, { emoji, count: 1, hasReacted: true, reactors: myReactor ? [myReactor] : [] }],
          reactionCount: p.reactionCount + 1,
          hasReacted: true,
          reactedEmojis: [...p.reactedEmojis, emoji],
        };
      })
    );

    try {
      let res: Response;
      if (isToggleOff) {
        res = await fetch(`/api/reactions?projectId=${encodeURIComponent(projectId)}&emoji=${encodeURIComponent(emoji)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ projectId, reactionType: emoji }),
        });
      }
      if (!res.ok) {
        // Revert on API error (e.g. 409 duplicate)
        setProjects((prev) => prev.map((p) => p.id === projectId ? project : p));
      }
    } catch {
      // Revert on network failure
      setProjects((prev) => prev.map((p) => p.id === projectId ? project : p));
    } finally {
      setReactingIds((s) => { const next = new Set(s); next.delete(projectId); return next; });
    }
  }

  return (
    <>
      {/* Page hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '12px',
          }}
        >
          AWS Cloud Club PUP Manila
        </p>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--foreground)',
            margin: '0 0 16px',
            lineHeight: 1.1,
          }}
        >
          Workshop Showcase
        </h1>
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: '15px',
            maxWidth: '480px',
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}
        >
          {projects.length > 0
            ? `${projects.length} project${projects.length !== 1 ? 's' : ''} built by the community`
            : 'Share what you built. Inspire the community.'}
        </p>
        {currentUserId && (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '10px',
              border: '1px solid color-mix(in oklab, var(--accent) 50%, transparent)',
              background: 'linear-gradient(135deg, color-mix(in oklab, var(--secondary) 90%, transparent), color-mix(in oklab, var(--primary) 18%, transparent))',
              color: 'var(--foreground)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 12px 26px -16px color-mix(in oklab, var(--glow-magenta) 70%, transparent)',
              transition: 'box-shadow 0.2s, opacity 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Share Your Project
          </button>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
          marginBottom: '40px',
        }}
      />

      {/* Grid or empty state */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              border: '1px solid oklch(35% 0.08 285 / 0.5)',
              background: 'oklch(12% 0.04 285)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(55% 0.12 285)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="m9 9 6 6M15 9l-6 6" />
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
            No projects yet
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
            Be the first to share your project with the community.
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={currentUserId ? project : { ...project, hasReacted: false, reactedEmojis: [] }}
              onReact={handleReact}
              reactPending={reactingIds.has(project.id)}
              currentUserId={currentUserId}
              onEdit={handleEditProject}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      )}

      <ProjectSidebar
        project={selectedProject ? (projects.find((p) => p.id === selectedProject.id) ?? selectedProject) : null}
        currentUserId={currentUserId}
        onClose={() => setSelectedProject(null)}
        onReact={handleReact}
        reactPending={selectedProject ? reactingIds.has(selectedProject.id) : false}
        onEdit={handleEditProject}
      />

      <SubmitProjectModal
        isOpen={modalOpen}
        isAuthenticated={isAuthenticated}
        onClose={handleCloseModal}
        onSuccess={refreshProjects}
        initialData={editingProject}
      />
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase';
import type { ProjectWithAuthor } from '@/types';
import { ProjectCard } from './ProjectCard';
import { SubmitProjectModal } from './SubmitProjectModal';

interface ShowcaseGridProps {
  initialProjects: ProjectWithAuthor[];
}

export function ShowcaseGrid({ initialProjects }: ShowcaseGridProps) {
  const [projects, setProjects] = useState<ProjectWithAuthor[]>(initialProjects);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reactingIds, setReactingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUserId(session.user.id);
        supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setIsAuthenticated(!!data));
      }
    });
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

  async function handleReact(projectId: string) {
    if (reactingIds.has(projectId)) return;
    const supabase = getBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setReactingIds((s) => new Set(s).add(projectId));
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, reactionCount: p.hasReacted ? p.reactionCount - 1 : p.reactionCount + 1, hasReacted: !p.hasReacted }
          : p
      )
    );

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok && res.status !== 409) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, reactionCount: p.hasReacted ? p.reactionCount - 1 : p.reactionCount + 1, hasReacted: !p.hasReacted }
              : p
          )
        );
      }
    } catch {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, reactionCount: p.hasReacted ? p.reactionCount - 1 : p.reactionCount + 1, hasReacted: !p.hasReacted }
            : p
        )
      );
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
          Community Showcase
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={currentUserId ? project : { ...project, hasReacted: false }}
              onReact={handleReact}
              reactPending={reactingIds.has(project.id)}
            />
          ))}
        </div>
      )}

      <SubmitProjectModal
        isOpen={modalOpen}
        isAuthenticated={isAuthenticated}
        onClose={() => setModalOpen(false)}
        onSuccess={refreshProjects}
      />
    </>
  );
}

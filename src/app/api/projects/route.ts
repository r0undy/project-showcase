/**
 * /api/projects
 *   POST — create a new project for the authenticated user. (Req 8.3, 8.4, 10.3.)
 *   GET  — list projects with author username, reaction count, and the
 *          authenticated user's `hasReacted` flag. (Req 7.1–7.4, 9.3, 9.5, 10.4.)
 */

import { NextResponse } from 'next/server';
import { requireAuth, getSession, errorResponse } from '@/lib/auth';
import { validateProjectForm } from '@/lib/validation';
import {
  createServerSupabaseClient,
  type Database,
} from '@/lib/supabase';
import type {
  CreateProjectResponse,
  GetProjectsResponse,
  Project,
  ProjectWithAuthor,
} from '@/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

// ---------------------------------------------------------------------------
// POST /api/projects
// ---------------------------------------------------------------------------
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { user, supabase } = auth.session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
  if (!body || typeof body !== 'object') {
    return errorResponse(400, 'INVALID_BODY', 'Request body must be an object.');
  }
  const { title, description, url, mediaUrl } = body as {
    title?: unknown;
    description?: unknown;
    url?: unknown;
    mediaUrl?: unknown;
  };

  const errors = validateProjectForm({ title, description, url, mediaUrl });
  if (Object.keys(errors).length > 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid input.', errors);
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: title as string,
      description: description as string,
      url: typeof url === 'string' && url.length > 0 ? url : null,
      media_url: typeof mediaUrl === 'string' && mediaUrl.length > 0 ? (mediaUrl as string) : null,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) {
    // 23503 = foreign_key_violation — the caller signed in but never created a public.users row.
    if (error.code === '23503') {
      return errorResponse(
        409,
        'NO_USER_PROFILE',
        'Create your user profile first via POST /api/users.'
      );
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create project.', { code: error.code });
  }

  const responseBody: CreateProjectResponse = { project: rowToProject(data) };
  return NextResponse.json(responseBody, { status: 201 });
}

// ---------------------------------------------------------------------------
// GET /api/projects
// ---------------------------------------------------------------------------
export async function GET(request: Request): Promise<NextResponse> {
  // Public endpoint: auth is optional. If present, we compute hasReacted per project.
  const session = await getSession(request);
  // Use either the per-request auth client or an unauthenticated client.
  // Both can read projects/reactions/users (RLS allows public SELECT on those).
  const supabase = session?.supabase ?? createServerSupabaseClient();
  const currentUserId = session?.user.id ?? null;

  // Fetch projects with author username via the foreign-key embed.
  const { data: projectsData, error: projectsErr } = await supabase
    .from('projects')
    .select('*, author:users!projects_author_id_fkey(username, avatar_url)')
    .order('created_at', { ascending: true });

  if (projectsErr) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch projects.', {
      code: projectsErr.code,
    });
  }

  const projects = projectsData ?? [];
  if (projects.length === 0) {
    const empty: GetProjectsResponse = { projects: [] };
    return NextResponse.json(empty, { status: 200 });
  }

  const projectIds = projects.map((p) => p.id);

  // Count all reactions per project (a single fetch, then group locally).
  // For our scale (one event), pulling all reaction rows is fine; if traffic
  // grows we'd switch to a Postgres view or RPC that returns COUNT(*) directly.
  const { data: reactionsData, error: reactionsErr } = await supabase
    .from('reactions')
    .select('project_id, user_id, reaction_type, created_at, user:users!reactions_user_id_fkey(username)')
    .in('project_id', projectIds)
    .order('created_at', { ascending: true });

  if (reactionsErr) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch reactions.', {
      code: reactionsErr.code,
    });
  }

  // Group: projectId → (emoji → reactors[])
  const emojiReactors = new Map<string, Map<string, Array<{ userId: string; username: string }>>>();
  const userReacted = new Map<string, Set<string>>();
  for (const r of reactionsData ?? []) {
    const userObj = Array.isArray(r.user) ? r.user[0] : r.user;
    const username = userObj?.username ?? 'unknown';
    if (!emojiReactors.has(r.project_id)) emojiReactors.set(r.project_id, new Map());
    const group = emojiReactors.get(r.project_id)!;
    if (!group.has(r.reaction_type)) group.set(r.reaction_type, []);
    group.get(r.reaction_type)!.push({ userId: r.user_id, username });
    if (currentUserId && r.user_id === currentUserId) {
      if (!userReacted.has(r.project_id)) userReacted.set(r.project_id, new Set());
      userReacted.get(r.project_id)!.add(r.reaction_type);
    }
  }

  // Fetch all comments with authors (most recent first); group locally to derive
  // per-project counts and the top 2 most recent comments for the card preview.
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, author:users!comments_user_id_fkey(username, avatar_url)')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  const commentCounts = new Map<string, number>();
  const topCommentsByProject = new Map<string, import('@/types').CommentWithAuthor[]>();
  for (const c of commentsData ?? []) {
    commentCounts.set(c.project_id, (commentCounts.get(c.project_id) ?? 0) + 1);
    const list = topCommentsByProject.get(c.project_id) ?? [];
    if (list.length < 2) {
      const authorObj = Array.isArray(c.author) ? c.author[0] : c.author;
      list.push({
        id: c.id,
        userId: c.user_id,
        projectId: c.project_id,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        author: {
          username: authorObj?.username ?? 'unknown',
          avatarUrl: authorObj?.avatar_url ?? undefined,
        },
      });
      topCommentsByProject.set(c.project_id, list);
    }
  }

  const enriched: ProjectWithAuthor[] = projects.map((p) => {
    const authorObj = Array.isArray(p.author) ? p.author[0] : p.author;
    const group = emojiReactors.get(p.id) ?? new Map<string, Array<{ userId: string; username: string }>>();
    const reactedSet = userReacted.get(p.id) ?? new Set<string>();
    const reactions = Array.from(group.entries()).map(([emoji, reactors]) => ({
      emoji,
      count: reactors.length,
      hasReacted: reactedSet.has(emoji),
      reactors,
    }));
    const reactionCount = reactions.reduce((sum, r) => sum + r.count, 0);
    return {
      ...rowToProject(p),
      author: {
        username: authorObj?.username ?? 'unknown',
        avatarUrl: authorObj?.avatar_url ?? undefined,
      },
      reactions,
      reactionCount,
      hasReacted: reactedSet.size > 0,
      reactedEmojis: Array.from(reactedSet),
      commentCount: commentCounts.get(p.id) ?? 0,
      topComments: topCommentsByProject.get(p.id) ?? [],
    };
  });

  const body: GetProjectsResponse = { projects: enriched };
  return NextResponse.json(body, { status: 200 });
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

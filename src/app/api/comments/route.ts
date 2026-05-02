/**
 * GET  /api/comments?projectId=xxx — list comments with author for a project (public).
 * POST /api/comments               — create a comment (authenticated).
 */

import { NextResponse } from 'next/server';
import { requireAuth, getSession, errorResponse } from '@/lib/auth';
import { isNonEmptyString } from '@/lib/validation';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { GetCommentsResponse, CreateCommentResponse, CommentWithAuthor } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/comments?projectId=xxx
// ---------------------------------------------------------------------------
export async function GET(request: Request): Promise<NextResponse> {
  const projectId = new URL(request.url).searchParams.get('projectId');
  if (!isNonEmptyString(projectId)) {
    return errorResponse(400, 'VALIDATION_ERROR', 'projectId query param is required.');
  }

  const session = await getSession(request);
  const supabase = session?.supabase ?? createServerSupabaseClient();

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:users!comments_user_id_fkey(username, avatar_url)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch comments.', { code: error.code });
  }

  const comments: CommentWithAuthor[] = (data ?? []).map(rowToComment);
  const body: GetCommentsResponse = { comments };
  return NextResponse.json(body, { status: 200 });
}

// ---------------------------------------------------------------------------
// POST /api/comments
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

  const { projectId, content } = body as { projectId?: unknown; content?: unknown };

  if (!isNonEmptyString(projectId)) {
    return errorResponse(400, 'VALIDATION_ERROR', 'projectId is required.');
  }
  if (typeof content !== 'string' || content.trim().length === 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'content is required.');
  }
  if (content.trim().length > 500) {
    return errorResponse(400, 'VALIDATION_ERROR', 'content must be 500 characters or fewer.');
  }

  const { data: inserted, error: insertError } = await supabase
    .from('comments')
    .insert({ user_id: user.id, project_id: projectId, content: content.trim() })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23503') {
      return errorResponse(404, 'NOT_FOUND', 'Project not found.');
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create comment.', { code: insertError.code });
  }

  // Fetch with author join for the response
  const { data, error: fetchError } = await supabase
    .from('comments')
    .select('*, author:users!comments_user_id_fkey(username, avatar_url)')
    .eq('id', inserted.id)
    .single();

  if (fetchError || !data) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve created comment.');
  }

  const responseBody: CreateCommentResponse = { comment: rowToComment(data) };
  return NextResponse.json(responseBody, { status: 201 });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rowToComment(row: {
  id: string;
  user_id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null;
}): CommentWithAuthor {
  const authorObj = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      username: authorObj?.username ?? 'unknown',
      avatarUrl: authorObj?.avatar_url ?? undefined,
    },
  };
}

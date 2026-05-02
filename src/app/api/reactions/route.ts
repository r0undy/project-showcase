/**
 * POST /api/reactions — add an emoji reaction for the current user on a project.
 * DELETE /api/reactions?projectId=xxx&emoji=❤️ — remove one specific emoji reaction.
 *
 * Multiple reactions per user per project are allowed (Discord-style).
 * The unique constraint is now on (user_id, project_id, reaction_type).
 *
 * Implements: Req 9.2, 9.4, 10.5, 10.7, 10.8.
 */

import { NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth';
import { isNonEmptyString } from '@/lib/validation';
import type { CreateReactionResponse, Reaction } from '@/types';

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

  const { projectId, reactionType } = body as {
    projectId?: unknown;
    reactionType?: unknown;
  };

  if (!isNonEmptyString(projectId)) {
    return errorResponse(400, 'VALIDATION_ERROR', 'projectId is required.');
  }
  const type =
    typeof reactionType === 'string' && reactionType.length > 0 ? reactionType : '❤️';

  const { data, error } = await supabase
    .from('reactions')
    .insert({ user_id: user.id, project_id: projectId, reaction_type: type })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse(409, 'CONFLICT', 'You have already reacted with this emoji.');
    }
    if (error.code === '23503') {
      return errorResponse(404, 'NOT_FOUND', 'Project not found.');
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create reaction.', {
      code: error.code,
    });
  }

  const responseBody: CreateReactionResponse = { reaction: rowToReaction(data) };
  return NextResponse.json(responseBody, { status: 201 });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { user, supabase } = auth.session;

  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');
  const emoji = params.get('emoji');

  if (!projectId) {
    return errorResponse(400, 'VALIDATION_ERROR', 'projectId query param is required.');
  }
  if (!emoji) {
    return errorResponse(400, 'VALIDATION_ERROR', 'emoji query param is required.');
  }

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .eq('reaction_type', emoji);

  if (error) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to delete reaction.', {
      code: error.code,
    });
  }

  return new NextResponse(null, { status: 204 });
}

function rowToReaction(row: {
  id: string;
  user_id: string;
  project_id: string;
  reaction_type: string;
  created_at: string;
}): Reaction {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    reactionType: row.reaction_type,
    createdAt: row.created_at,
  };
}

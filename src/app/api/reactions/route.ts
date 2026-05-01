/**
 * POST /api/reactions
 *
 * Creates a reaction on a project for the authenticated user. Duplicates
 * (same user_id + project_id) are rejected with 409 by the unique
 * constraint defined in 003_create_reactions_table.sql.
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
    typeof reactionType === 'string' && reactionType.length > 0 ? reactionType : 'like';

  const { data, error } = await supabase
    .from('reactions')
    .insert({
      user_id: user.id,
      project_id: projectId,
      reaction_type: type,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse(409, 'CONFLICT', 'You have already reacted to this project.');
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

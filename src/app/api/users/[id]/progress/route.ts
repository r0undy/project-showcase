/**
 * PATCH /api/users/[id]/progress
 *
 * Upserts an onboarding progress record. The `set_completed_at` Postgres
 * trigger handles the timestamp automatically when `is_completed` flips
 * from false to true (Property 14, Req 14.5).
 *
 * Auth: required. The route also enforces that the path `[id]` matches the
 * caller's `auth.uid()` — RLS would block cross-user writes, but we 403
 * earlier so the response is clear.
 *
 * Implements: Req 5.3, 10.6, 10.7, 10.8, 19.5.
 */

import { NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth';
import { isValidStepNumber } from '@/lib/validation';
import type { OnboardingProgress, UpdateProgressResponse } from '@/types';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { user, supabase } = auth.session;

  const { id } = await context.params;
  if (id !== user.id) {
    return errorResponse(403, 'FORBIDDEN', 'You can only update your own progress.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
  if (!body || typeof body !== 'object') {
    return errorResponse(400, 'INVALID_BODY', 'Request body must be an object.');
  }
  const { stepNumber, isCompleted } = body as { stepNumber?: unknown; isCompleted?: unknown };

  if (!isValidStepNumber(stepNumber)) {
    return errorResponse(400, 'VALIDATION_ERROR', 'stepNumber must be an integer in [1, 7].');
  }
  if (typeof isCompleted !== 'boolean') {
    return errorResponse(400, 'VALIDATION_ERROR', 'isCompleted must be a boolean.');
  }

  // Upsert on (user_id, step_number) — the unique constraint is the natural key.
  const { data, error } = await supabase
    .from('onboarding_progress')
    .upsert(
      { user_id: user.id, step_number: stepNumber, is_completed: isCompleted },
      { onConflict: 'user_id,step_number' }
    )
    .select()
    .single();

  if (error) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update progress.', { code: error.code });
  }

  const responseBody: UpdateProgressResponse = { progress: rowToProgress(data) };
  return NextResponse.json(responseBody, { status: 200 });
}

function rowToProgress(row: {
  id: string;
  user_id: string;
  step_number: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string;
}): OnboardingProgress {
  return {
    id: row.id,
    userId: row.user_id,
    stepNumber: row.step_number,
    isCompleted: row.is_completed,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

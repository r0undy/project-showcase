/**
 * GET /api/users/[id]
 *
 * Returns the user record + their onboarding progress array.
 *
 * Implements: Req 10.2, 10.7, 10.8.
 *
 * Auth: requires a valid bearer token. Note that `users` is publicly readable
 * (RLS allows SELECT for everyone), but `onboarding_progress` is restricted to
 * the owner. We require auth here so we can return the progress in the same
 * call without confusing partial responses for unauthenticated callers.
 */

import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/auth";
import type { GetUserResponse, OnboardingProgress, User } from "@/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const { supabase } = auth.session;

  const { id } = await context.params;

  const [
    { data: userRow, error: userErr },
    { data: progressRows, error: progErr },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).maybeSingle(),
    supabase.from("onboarding_progress").select("*").eq("user_id", id),
  ]);

  if (userErr) {
    return errorResponse(500, "INTERNAL_ERROR", "Failed to fetch user.", {
      code: userErr.code,
    });
  }
  if (!userRow) {
    return errorResponse(404, "NOT_FOUND", `User ${id} not found.`);
  }
  if (progErr) {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Failed to fetch onboarding progress.",
      {
        code: progErr.code,
      },
    );
  }

  const body: GetUserResponse = {
    user: rowToUser(userRow),
    onboardingProgress: (progressRows ?? []).map(rowToProgress),
  };
  return NextResponse.json(body, { status: 200 });
}

function rowToUser(row: {
  id: string;
  username: string;
  awscc_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}): User {
  return {
    id: row.id,
    username: row.username,
    awsccId: row.awscc_id ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

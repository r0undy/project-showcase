/**
 * POST /api/users
 *
 * Creates a `public.users` row for the caller.
 *
 * Precondition: client must already have an anonymous Supabase session
 * (via `supabase.auth.signInAnonymously()`) and pass the access token in
 * `Authorization: Bearer <token>`. We insert the row with `id = auth.uid()`
 * to satisfy the RLS policy `WITH CHECK (auth.uid() = id)`.
 *
 * Implements: Req 4.1–4.6, 10.1, 10.7, 10.8 (see aws-community-showcase/requirements.md).
 */

import { NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/auth";
import { validateUserForm } from "@/lib/validation";
import type { CreateUserResponse, User } from "@/types";

export async function POST(request: Request): Promise<NextResponse> {
  // 1. AuthN: must have a valid anonymous session.
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const { user: authUser, supabase } = auth.session;

  // 2. Parse + validate body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }
  if (!body || typeof body !== "object") {
    return errorResponse(
      400,
      "INVALID_BODY",
      "Request body must be an object.",
    );
  }

  const { username, awsccId, avatarUrl } = body as {
    username?: unknown;
    awsccId?: unknown;
    avatarUrl?: unknown;
  };
  const normalizedAwsccId =
    typeof awsccId === "string" ? awsccId.trim() : awsccId;
  const errors = validateUserForm({
    username,
    awsccId: normalizedAwsccId,
    avatarUrl,
  });
  if (Object.keys(errors).length > 0) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid input.", errors);
  }

  // 3. Insert with id = auth.uid() so RLS allows the write.
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: authUser.id,
      username: username as string,
      awscc_id:
        typeof normalizedAwsccId === "string" && normalizedAwsccId.length > 0
          ? normalizedAwsccId
          : null,
      avatar_url: avatarUrl ? (avatarUrl as string) : null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation. Could be the username UNIQUE index or the
    // primary-key (id) collision (which means this auth user already has a row).
    if (error.code === "23505") {
      if (error.message.toLowerCase().includes("username")) {
        return errorResponse(409, "CONFLICT", "Username already taken.");
      }
      return errorResponse(
        409,
        "CONFLICT",
        "A user record already exists for this session.",
      );
    }
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Failed to create user record.",
      { code: error.code },
    );
  }

  const responseBody: CreateUserResponse = {
    user: rowToUser(data),
  };
  return NextResponse.json(responseBody, { status: 201 });
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

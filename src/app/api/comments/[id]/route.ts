/**
 * DELETE /api/comments/[id] — delete own comment.
 */

import { NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { user, supabase } = auth.session;

  const { id } = await params;

  const { error, count } = await supabase
    .from('comments')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to delete comment.', { code: error.code });
  }
  if (count === 0) {
    return errorResponse(404, 'NOT_FOUND', 'Comment not found or you do not own it.');
  }

  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth';
import { validateProjectForm } from '@/lib/validation';
import type { Project } from '@/types';
import type { Database } from '@/lib/supabase';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  const { user, supabase } = auth.session;
  
  const { id } = await params;

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
    .update({
      title: title as string,
      description: description as string,
      url: typeof url === 'string' && url.length > 0 ? url : null,
      media_url: typeof mediaUrl === 'string' && mediaUrl.length > 0 ? (mediaUrl as string) : null,
    })
    .eq('id', id)
    .eq('author_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse(403, 'FORBIDDEN', 'Project not found or you do not have permission to edit it.');
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update project.', { code: error.code });
  }

  return NextResponse.json({ project: rowToProject(data) }, { status: 200 });
}

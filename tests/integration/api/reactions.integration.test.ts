/**
 * Integration tests — POST /api/reactions
 * Feature: aws-community-showcase (Task 11.4)
 */

import { POST as POST_REACTION } from '@/app/api/reactions/route';
import { POST as POST_PROJECT } from '@/app/api/projects/route';
import {
  createTestUserViaAuth,
  buildRequest,
  deleteTestUser,
} from '../../helpers/supabase-test';
import type { CreateReactionResponse, ErrorResponse } from '@/types';

const TT = 30_000;

async function setupProject() {
  const author = await createTestUserViaAuth();
  const res = await POST_PROJECT(
    buildRequest('http://test.local/api/projects', {
      method: 'POST',
      accessToken: author.accessToken,
      body: { title: 'reactable', description: 'd' },
    })
  );
  const body = await res.json();
  return { author, projectId: body.project.id as string };
}

describe('POST /api/reactions — integration', () => {
  it(
    'creates a reaction (defaults to type "like")',
    async () => {
      const { author, projectId } = await setupProject();
      const reactor = await createTestUserViaAuth();
      try {
        const res = await POST_REACTION(
          buildRequest('http://test.local/api/reactions', {
            method: 'POST',
            accessToken: reactor.accessToken,
            body: { projectId },
          })
        );
        expect(res.status).toBe(201);
        const body = (await res.json()) as CreateReactionResponse;
        expect(body.reaction.userId).toBe(reactor.userId);
        expect(body.reaction.projectId).toBe(projectId);
        expect(body.reaction.reactionType).toBe('like');
      } finally {
        await deleteTestUser(reactor.userId);
        await deleteTestUser(author.userId);
      }
    },
    TT
  );

  it(
    'returns 401 without auth',
    async () => {
      const res = await POST_REACTION(
        buildRequest('http://test.local/api/reactions', {
          method: 'POST',
          body: { projectId: 'whatever' },
        })
      );
      expect(res.status).toBe(401);
    },
    TT
  );

  it(
    'returns 400 when projectId is missing',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const res = await POST_REACTION(
          buildRequest('http://test.local/api/reactions', {
            method: 'POST',
            accessToken: u.accessToken,
            body: {},
          })
        );
        expect(res.status).toBe(400);
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 404 when projectId does not exist',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const ghost = '00000000-0000-4000-8000-000000000000';
        const res = await POST_REACTION(
          buildRequest('http://test.local/api/reactions', {
            method: 'POST',
            accessToken: u.accessToken,
            body: { projectId: ghost },
          })
        );
        expect(res.status).toBe(404);
        const body = (await res.json()) as ErrorResponse;
        expect(body.error).toBe('NOT_FOUND');
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 409 when the same user reacts twice on the same project',
    async () => {
      const { author, projectId } = await setupProject();
      const reactor = await createTestUserViaAuth();
      try {
        const r1 = await POST_REACTION(
          buildRequest('http://test.local/api/reactions', {
            method: 'POST',
            accessToken: reactor.accessToken,
            body: { projectId },
          })
        );
        expect(r1.status).toBe(201);
        const r2 = await POST_REACTION(
          buildRequest('http://test.local/api/reactions', {
            method: 'POST',
            accessToken: reactor.accessToken,
            body: { projectId },
          })
        );
        expect(r2.status).toBe(409);
        const body = (await r2.json()) as ErrorResponse;
        expect(body.error).toBe('CONFLICT');
      } finally {
        await deleteTestUser(reactor.userId);
        await deleteTestUser(author.userId);
      }
    },
    TT
  );
});

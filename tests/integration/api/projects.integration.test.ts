/**
 * Integration tests — POST + GET /api/projects
 * Feature: aws-community-showcase (Tasks 9.2, 10.5)
 */

import { GET, POST } from '@/app/api/projects/route';
import {
  createTestUserViaAuth,
  buildRequest,
  deleteTestUser,
  signedInClient,
} from '../../helpers/supabase-test';
import type {
  CreateProjectResponse,
  GetProjectsResponse,
  ErrorResponse,
} from '@/types';

const TT = 30_000;

describe('POST /api/projects — integration', () => {
  it(
    'creates a project owned by the authenticated user',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const req = buildRequest('http://test.local/api/projects', {
          method: 'POST',
          accessToken: u.accessToken,
          body: {
            title: 'Hello World',
            description: 'My first AWS project',
            mediaUrl: 'https://example.com/image.png',
          },
        });
        const res = await POST(req);
        expect(res.status).toBe(201);
        const body = (await res.json()) as CreateProjectResponse;
        expect(body.project.title).toBe('Hello World');
        expect(body.project.description).toBe('My first AWS project');
        expect(body.project.mediaUrl).toBe('https://example.com/image.png');
        expect(body.project.authorId).toBe(u.userId);
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 401 without auth',
    async () => {
      const req = buildRequest('http://test.local/api/projects', {
        method: 'POST',
        body: { title: 't', description: 'd' },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    },
    TT
  );

  it(
    'returns 400 when title is missing',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const req = buildRequest('http://test.local/api/projects', {
          method: 'POST',
          accessToken: u.accessToken,
          body: { description: 'no title' },
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = (await res.json()) as ErrorResponse;
        expect(body.details).toMatchObject({ title: expect.any(String) });
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 400 for invalid mediaUrl',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const req = buildRequest('http://test.local/api/projects', {
          method: 'POST',
          accessToken: u.accessToken,
          body: { title: 't', description: 'd', mediaUrl: 'not-a-url' },
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 409 when caller has no public.users row yet',
    async () => {
      const orphan = await signedInClient(); // anon-auth only
      try {
        const req = buildRequest('http://test.local/api/projects', {
          method: 'POST',
          accessToken: orphan.accessToken,
          body: { title: 't', description: 'd' },
        });
        const res = await POST(req);
        expect(res.status).toBe(409);
        const body = (await res.json()) as ErrorResponse;
        expect(body.error).toBe('NO_USER_PROFILE');
      } finally {
        await deleteTestUser(orphan.authUserId);
      }
    },
    TT
  );
});

describe('GET /api/projects — integration', () => {
  it(
    'returns projects newest-first with author + reaction info',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        // Create three projects with small spacing so created_at differs.
        for (const i of [1, 2, 3]) {
          await POST(
            buildRequest('http://test.local/api/projects', {
              method: 'POST',
              accessToken: u.accessToken,
              body: { title: `T${i}`, description: `D${i}` },
            })
          );
          await new Promise((r) => setTimeout(r, 10));
        }

        const req = buildRequest('http://test.local/api/projects', {
          method: 'GET',
          accessToken: u.accessToken,
        });
        const res = await GET(req);
        expect(res.status).toBe(200);
        const body = (await res.json()) as GetProjectsResponse;

        // Filter to just this user's projects (other tests may have left rows).
        const mine = body.projects.filter((p) => p.authorId === u.userId);
        expect(mine.length).toBe(3);

        // Newest first
        for (let i = 1; i < mine.length; i++) {
          expect(mine[i - 1].createdAt >= mine[i].createdAt).toBe(true);
        }

        // Each has author username, reactionCount = 0, hasReacted = false
        for (const p of mine) {
          expect(p.author.username).toBe(u.username);
          expect(p.reactionCount).toBe(0);
          expect(p.hasReacted).toBe(false);
        }
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT * 2
  );

  it(
    'works for unauthenticated callers (public read), with hasReacted=false',
    async () => {
      const req = buildRequest('http://test.local/api/projects', { method: 'GET' });
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = (await res.json()) as GetProjectsResponse;
      for (const p of body.projects) {
        expect(p.hasReacted).toBe(false);
      }
    },
    TT
  );
});

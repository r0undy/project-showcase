/**
 * Integration tests — GET /api/users/[id]
 * Feature: aws-community-showcase (Task 7.2)
 */

import { GET } from '@/app/api/users/[id]/route';
import {
  createTestUserViaAuth,
  buildRequest,
  deleteTestUser,
  signedInClient,
} from '../../helpers/supabase-test';
import type { GetUserResponse, ErrorResponse } from '@/types';

const TT = 30_000;

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('GET /api/users/[id] — integration', () => {
  it(
    'returns the user + their (empty) onboarding progress',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const req = buildRequest(`http://test.local/api/users/${u.userId}`, {
          method: 'GET',
          accessToken: u.accessToken,
        });
        const res = await GET(req, params(u.userId));
        expect(res.status).toBe(200);
        const body = (await res.json()) as GetUserResponse;
        expect(body.user.id).toBe(u.userId);
        expect(body.user.username).toBe(u.username);
        expect(Array.isArray(body.onboardingProgress)).toBe(true);
        expect(body.onboardingProgress.length).toBe(0);
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 404 for a non-existent user id',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const ghostId = '00000000-0000-4000-8000-000000000000';
        const req = buildRequest(`http://test.local/api/users/${ghostId}`, {
          method: 'GET',
          accessToken: u.accessToken,
        });
        const res = await GET(req, params(ghostId));
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
    'returns 401 without a bearer token',
    async () => {
      const req = buildRequest('http://test.local/api/users/whatever', {
        method: 'GET',
      });
      const res = await GET(req, params('whatever'));
      expect(res.status).toBe(401);
    },
    TT
  );

  it(
    'cannot read another user\'s onboarding progress (RLS scopes the rows)',
    async () => {
      // User A creates progress for themselves
      const a = await createTestUserViaAuth();
      const b = await signedInClient(); // anon-auth only, no public.users row
      try {
        // Insert a progress row for A using A's client (RLS allows it).
        await a.client
          .from('onboarding_progress')
          .insert({ user_id: a.userId, step_number: 4, is_completed: true });

        // B requests GET /api/users/{a.userId}. Since users are publicly readable,
        // B will see A's user row, but onboarding_progress is auth.uid()-scoped,
        // so B should see an EMPTY progress array (RLS hides A's rows from B).
        const req = buildRequest(`http://test.local/api/users/${a.userId}`, {
          method: 'GET',
          accessToken: b.accessToken,
        });
        const res = await GET(req, params(a.userId));
        expect(res.status).toBe(200);
        const body = (await res.json()) as GetUserResponse;
        expect(body.user.id).toBe(a.userId);
        expect(body.onboardingProgress).toEqual([]); // RLS-filtered
      } finally {
        await deleteTestUser(a.userId);
        await deleteTestUser(b.authUserId);
      }
    },
    TT
  );
});

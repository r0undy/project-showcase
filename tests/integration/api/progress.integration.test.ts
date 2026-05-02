/**
 * Integration tests — PATCH /api/users/[id]/progress
 * Feature: aws-community-showcase (Task 8.3)
 *
 * NOTE: requires migration 006_extend_completed_at_trigger.sql to be applied
 * for the "first-time INSERT with isCompleted=true sets completed_at" assertion.
 */

import { PATCH } from '@/app/api/users/[id]/progress/route';
import {
  createTestUserViaAuth,
  buildRequest,
  deleteTestUser,
  signedInClient,
} from '../../helpers/supabase-test';
import type { UpdateProgressResponse, ErrorResponse } from '@/types';

const TT = 30_000;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('PATCH /api/users/[id]/progress — integration', () => {
  it(
    'creates a progress row on first call and sets completed_at when isCompleted=true',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const req = buildRequest(`http://test.local/api/users/${u.userId}/progress`, {
          method: 'PATCH',
          accessToken: u.accessToken,
          body: { stepNumber: 4, isCompleted: true },
        });
        const res = await PATCH(req, params(u.userId));
        expect(res.status).toBe(200);
        const body = (await res.json()) as UpdateProgressResponse;
        expect(body.progress.userId).toBe(u.userId);
        expect(body.progress.stepNumber).toBe(4);
        expect(body.progress.isCompleted).toBe(true);
        expect(body.progress.completedAt).toBeDefined();
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'is idempotent — second PATCH with the same body returns the same logical state',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const make = () =>
          buildRequest(`http://test.local/api/users/${u.userId}/progress`, {
            method: 'PATCH',
            accessToken: u.accessToken,
            body: { stepNumber: 5, isCompleted: true },
          });
        const r1 = await PATCH(make(), params(u.userId));
        expect(r1.status).toBe(200);
        const b1 = (await r1.json()) as UpdateProgressResponse;
        const r2 = await PATCH(make(), params(u.userId));
        expect(r2.status).toBe(200);
        const b2 = (await r2.json()) as UpdateProgressResponse;
        expect(b2.progress.id).toBe(b1.progress.id);
        expect(b2.progress.isCompleted).toBe(true);
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 401 without a bearer token',
    async () => {
      const req = buildRequest('http://test.local/api/users/anyone/progress', {
        method: 'PATCH',
        body: { stepNumber: 4, isCompleted: true },
      });
      const res = await PATCH(req, params('anyone'));
      expect(res.status).toBe(401);
    },
    TT
  );

  it(
    'returns 403 when path id ≠ caller auth.uid()',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const someoneElse = '00000000-0000-4000-8000-000000000000';
        const req = buildRequest(`http://test.local/api/users/${someoneElse}/progress`, {
          method: 'PATCH',
          accessToken: u.accessToken,
          body: { stepNumber: 4, isCompleted: true },
        });
        const res = await PATCH(req, params(someoneElse));
        expect(res.status).toBe(403);
        const body = (await res.json()) as ErrorResponse;
        expect(body.error).toBe('FORBIDDEN');
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 400 for an out-of-range stepNumber',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const req = buildRequest(`http://test.local/api/users/${u.userId}/progress`, {
          method: 'PATCH',
          accessToken: u.accessToken,
          body: { stepNumber: 99, isCompleted: true },
        });
        const res = await PATCH(req, params(u.userId));
        expect(res.status).toBe(400);
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );

  it(
    'returns 400 for non-boolean isCompleted',
    async () => {
      const u = await createTestUserViaAuth();
      try {
        const req = buildRequest(`http://test.local/api/users/${u.userId}/progress`, {
          method: 'PATCH',
          accessToken: u.accessToken,
          body: { stepNumber: 4, isCompleted: 'yes' },
        });
        const res = await PATCH(req, params(u.userId));
        expect(res.status).toBe(400);
      } finally {
        await deleteTestUser(u.userId);
      }
    },
    TT
  );
});

// keep used import (avoids tree-shake warning for typing-only path)
void signedInClient;

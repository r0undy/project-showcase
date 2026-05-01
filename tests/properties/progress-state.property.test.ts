/**
 * Property-Based Tests — Onboarding step state persistence
 * Feature: aws-community-showcase
 *
 * Property 7: Completed step state persistence — Validates Req 5.4.
 *
 * For any step number N (4 ≤ N ≤ 6) marked as completed, navigating away
 * from N and returning SHALL display the step in completed state. We model
 * "navigate away and return" as: PATCH the step with isCompleted=true, then
 * GET /api/users/[id] and assert the progress array shows step N completed.
 */

import fc from 'fast-check';
import { PATCH } from '@/app/api/users/[id]/progress/route';
import { GET } from '@/app/api/users/[id]/route';
import {
  createTestUserViaAuth,
  buildRequest,
  deleteTestUser,
} from '../helpers/supabase-test';
import type { UpdateProgressResponse, GetUserResponse } from '@/types';

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Onboarding Step Persistence Property Tests', () => {
  /**
   * Tag: Feature: aws-community-showcase, Property 7: Completed step state persistence
   */
  it(
    'a step marked completed is reported as completed on subsequent reads',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 4, max: 6 }),
          async (stepNumber) => {
            const u = await createTestUserViaAuth();
            try {
              // Mark step done
              const patchReq = buildRequest(
                `http://test.local/api/users/${u.userId}/progress`,
                { method: 'PATCH', accessToken: u.accessToken, body: { stepNumber, isCompleted: true } }
              );
              const patchRes = await PATCH(patchReq, params(u.userId));
              expect(patchRes.status).toBe(200);
              const patchBody = (await patchRes.json()) as UpdateProgressResponse;
              expect(patchBody.progress.isCompleted).toBe(true);

              // "Navigate away and return" → GET the user.
              const getReq = buildRequest(`http://test.local/api/users/${u.userId}`, {
                method: 'GET',
                accessToken: u.accessToken,
              });
              const getRes = await GET(getReq, params(u.userId));
              expect(getRes.status).toBe(200);
              const getBody = (await getRes.json()) as GetUserResponse;
              const target = getBody.onboardingProgress.find(
                (p) => p.stepNumber === stepNumber
              );
              expect(target).toBeDefined();
              expect(target!.isCompleted).toBe(true);
            } finally {
              await deleteTestUser(u.userId);
            }
          }
        ),
        { numRuns: 5 } // 5 anonymous users per run is plenty given the cost.
      );
    },
    180_000
  );
});

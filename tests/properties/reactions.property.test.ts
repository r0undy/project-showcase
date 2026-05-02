/**
 * Property-Based Tests — Reactions
 * Feature: aws-community-showcase
 *
 * Property 11: Duplicate reaction prevention — Validates Req 9.4.
 *              For any user U and project P, after U reacts to P, any further
 *              reaction attempts by U on P MUST be rejected with HTTP 409 and
 *              MUST NOT create another reactions row.
 *
 * Property 12: Reaction button active state consistency — Validates Req 9.5.
 *              The hasReacted flag returned by GET /api/projects MUST equal
 *              true iff the calling user has a reactions row for that project.
 */

import fc from 'fast-check';
import { POST as POST_REACTION } from '@/app/api/reactions/route';
import { GET as GET_PROJECTS, POST as POST_PROJECT } from '@/app/api/projects/route';
import {
  createTestUserViaAuth,
  buildRequest,
  deleteTestUser,
  adminTestClient,
} from '../helpers/supabase-test';
import type { GetProjectsResponse } from '@/types';

const TT = 180_000;

describe('Reactions API Property Tests', () => {
  describe('Property 11: Duplicate reaction prevention', () => {
    it(
      'second-and-later reactions by the same user on the same project return 409 and do not create extra rows',
      async () => {
        // Reuse a single (author, reactor) pair across iterations. Each iteration
        // tests `extraAttempts` repeated 409s on the SAME (user, project) row,
        // then deletes the reaction so the next iteration can re-add it. This
        // keeps anon-signup count to 2 for the entire property test.
        const author = await createTestUserViaAuth();
        const reactor = await createTestUserViaAuth();
        try {
          await fc.assert(
            fc.asyncProperty(
              fc.integer({ min: 1, max: 3 }),
              async (extraAttempts) => {
                // Fresh project each iteration (so reactor can react again).
                const created = await POST_PROJECT(
                  buildRequest('http://test.local/api/projects', {
                    method: 'POST',
                    accessToken: author.accessToken,
                    body: { title: 'p', description: 'd' },
                  })
                );
                const { project } = await created.json();

                // First reaction succeeds
                const r1 = await POST_REACTION(
                  buildRequest('http://test.local/api/reactions', {
                    method: 'POST',
                    accessToken: reactor.accessToken,
                    body: { projectId: project.id },
                  })
                );
                expect(r1.status).toBe(201);

                // All extra attempts must be 409
                for (let i = 0; i < extraAttempts; i++) {
                  const rN = await POST_REACTION(
                    buildRequest('http://test.local/api/reactions', {
                      method: 'POST',
                      accessToken: reactor.accessToken,
                      body: { projectId: project.id },
                    })
                  );
                  expect(rN.status).toBe(409);
                }

                // DB row count for (reactor, project) is exactly 1.
                const admin = adminTestClient();
                const { count } = await admin
                  .from('reactions')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', reactor.userId)
                  .eq('project_id', project.id);
                expect(count).toBe(1);
              }
            ),
            { numRuns: 3 }
          );
        } finally {
          // Cascade-deletes projects + reactions through FKs.
          await deleteTestUser(reactor.userId);
          await deleteTestUser(author.userId);
        }
      },
      TT
    );
  });

  describe('Property 12: hasReacted flag consistency', () => {
    it(
      'hasReacted is true iff the caller has a reactions row for the project',
      async () => {
        const author = await createTestUserViaAuth();
        const reactor = await createTestUserViaAuth();
        const bystander = await createTestUserViaAuth();
        try {
          const created = await POST_PROJECT(
            buildRequest('http://test.local/api/projects', {
              method: 'POST',
              accessToken: author.accessToken,
              body: { title: 'q', description: 'd' },
            })
          );
          const { project } = await created.json();

          // Before reactor reacts: hasReacted=false for everyone.
          const beforeRes = await GET_PROJECTS(
            buildRequest('http://test.local/api/projects', {
              method: 'GET',
              accessToken: reactor.accessToken,
            })
          );
          const before = (await beforeRes.json()) as GetProjectsResponse;
          const targetBefore = before.projects.find((p) => p.id === project.id);
          expect(targetBefore?.hasReacted).toBe(false);

          // Reactor reacts.
          const reactRes = await POST_REACTION(
            buildRequest('http://test.local/api/reactions', {
              method: 'POST',
              accessToken: reactor.accessToken,
              body: { projectId: project.id },
            })
          );
          expect(reactRes.status).toBe(201);

          // For reactor: hasReacted=true.
          const reactorRes = await GET_PROJECTS(
            buildRequest('http://test.local/api/projects', {
              method: 'GET',
              accessToken: reactor.accessToken,
            })
          );
          const reactorList = (await reactorRes.json()) as GetProjectsResponse;
          const reactorTarget = reactorList.projects.find((p) => p.id === project.id);
          expect(reactorTarget?.hasReacted).toBe(true);

          // For bystander (different user): hasReacted=false.
          const bystanderRes = await GET_PROJECTS(
            buildRequest('http://test.local/api/projects', {
              method: 'GET',
              accessToken: bystander.accessToken,
            })
          );
          const bystanderList = (await bystanderRes.json()) as GetProjectsResponse;
          const bystanderTarget = bystanderList.projects.find((p) => p.id === project.id);
          expect(bystanderTarget?.hasReacted).toBe(false);
        } finally {
          await deleteTestUser(bystander.userId);
          await deleteTestUser(reactor.userId);
          await deleteTestUser(author.userId);
        }
      },
      TT
    );
  });
});

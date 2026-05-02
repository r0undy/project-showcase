/**
 * Property-Based Tests — Projects
 * Feature: aws-community-showcase
 *
 * Property 8:  Project card field completeness — Validates Req 7.2.
 *              The endpoint MUST surface title, description, author username,
 *              and createdAt for every project.
 *
 * Property 9:  Project list chronological sorting — Validates Req 7.3.
 *              For any list of projects with createdAt timestamps, adjacent
 *              entries P1, P2 must satisfy P1.createdAt >= P2.createdAt.
 *
 * Property 10: Reaction count display accuracy — Validates Req 9.3.
 *              Each project's reactionCount must equal the number of reactions
 *              currently in the DB for that project.
 */

import fc from 'fast-check';
import { GET, POST } from '@/app/api/projects/route';
import { POST as POST_REACTION } from '@/app/api/reactions/route';
import {
  createTestUserViaAuth,
  buildRequest,
  deleteTestUser,
  adminTestClient,
} from '../helpers/supabase-test';
import type { GetProjectsResponse } from '@/types';

const TT = 180_000;

describe('Projects API Property Tests', () => {
  describe('Property 8: Project card field completeness', () => {
    it(
      'every returned project carries title, description, author.username, createdAt',
      async () => {
        const u = await createTestUserViaAuth();
        try {
          await fc.assert(
            fc.asyncProperty(
              fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
              fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
              async (title, description) => {
                const create = await POST(
                  buildRequest('http://test.local/api/projects', {
                    method: 'POST',
                    accessToken: u.accessToken,
                    body: { title, description },
                  })
                );
                expect(create.status).toBe(201);

                const res = await GET(
                  buildRequest('http://test.local/api/projects', {
                    method: 'GET',
                    accessToken: u.accessToken,
                  })
                );
                expect(res.status).toBe(200);
                const body = (await res.json()) as GetProjectsResponse;
                for (const p of body.projects) {
                  expect(typeof p.title).toBe('string');
                  expect(p.title.length).toBeGreaterThan(0);
                  expect(typeof p.description).toBe('string');
                  expect(p.description.length).toBeGreaterThan(0);
                  expect(typeof p.author?.username).toBe('string');
                  expect(p.author.username.length).toBeGreaterThan(0);
                  expect(typeof p.createdAt).toBe('string');
                  expect(p.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
                }
              }
            ),
            { numRuns: 5 }
          );
        } finally {
          await deleteTestUser(u.userId);
        }
      },
      TT
    );
  });

  describe('Property 9: Project list chronological sorting', () => {
    it(
      'returned projects are non-increasing by createdAt',
      async () => {
        const u = await createTestUserViaAuth();
        try {
          // Create N projects in sequence
          for (let i = 0; i < 4; i++) {
            await POST(
              buildRequest('http://test.local/api/projects', {
                method: 'POST',
                accessToken: u.accessToken,
                body: { title: `chron-${i}`, description: 'x' },
              })
            );
            await new Promise((r) => setTimeout(r, 15));
          }

          const res = await GET(
            buildRequest('http://test.local/api/projects', {
              method: 'GET',
              accessToken: u.accessToken,
            })
          );
          const body = (await res.json()) as GetProjectsResponse;
          const mine = body.projects.filter((p) => p.authorId === u.userId);
          expect(mine.length).toBeGreaterThanOrEqual(4);
          for (let i = 1; i < mine.length; i++) {
            expect(mine[i - 1].createdAt >= mine[i].createdAt).toBe(true);
          }
        } finally {
          await deleteTestUser(u.userId);
        }
      },
      TT
    );
  });

  describe('Property 10: Reaction count display accuracy', () => {
    it(
      'reactionCount on a project equals the number of rows in `reactions` for it',
      async () => {
        const author = await createTestUserViaAuth();
        // Create one project and have a separate user react to it.
        try {
          const createRes = await POST(
            buildRequest('http://test.local/api/projects', {
              method: 'POST',
              accessToken: author.accessToken,
              body: { title: 'reactable', description: 'count me' },
            })
          );
          const created = await createRes.json();
          const projectId = created.project.id as string;

          // Distinct reactor.
          const reactor = await createTestUserViaAuth();
          try {
            const reactRes = await POST_REACTION(
              buildRequest('http://test.local/api/reactions', {
                method: 'POST',
                accessToken: reactor.accessToken,
                body: { projectId },
              })
            );
            expect(reactRes.status).toBe(201);

            // Read back: reactionCount should be 1.
            const listRes = await GET(
              buildRequest('http://test.local/api/projects', {
                method: 'GET',
                accessToken: author.accessToken,
              })
            );
            const list = (await listRes.json()) as GetProjectsResponse;
            const target = list.projects.find((p) => p.id === projectId);
            expect(target).toBeDefined();
            expect(target!.reactionCount).toBe(1);

            // Cross-check by counting in DB directly.
            const admin = adminTestClient();
            const { count } = await admin
              .from('reactions')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', projectId);
            expect(target!.reactionCount).toBe(count ?? 0);
          } finally {
            await deleteTestUser(reactor.userId);
          }
        } finally {
          await deleteTestUser(author.userId);
        }
      },
      TT
    );
  });
});

/**
 * Property-Based Tests — API contract
 * Feature: aws-community-showcase
 *
 * Property 6: User creation returns valid UUID — Validates Req 4.6, 11.5
 * Property 13: API error response format consistency — Validates Req 10.7, 10.8
 *
 * These tests hit POST /api/users by importing the Route Handler directly,
 * so they exercise the validation + Supabase insert + RLS path.
 */

import fc from 'fast-check';
import { POST } from '@/app/api/users/route';
import {
  signedInClient,
  buildRequest,
  deleteTestUser,
  uniqueUsername,
} from '../helpers/supabase-test';
import type { CreateUserResponse, ErrorResponse } from '@/types';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('API Property Tests', () => {
  /**
   * Tag: Feature: aws-community-showcase, Property 6: User creation returns valid UUID
   *
   * For any valid user-creation request (valid username + non-empty awsccId),
   * the response includes a user with id matching UUID v4.
   */
  describe('Property 6: User creation returns valid UUID', () => {
    it('returns a UUID-v4 user id on every successful creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Valid usernames: 3-32 chars from the allowed alphabet, prefixed for uniqueness.
          fc
            .array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')
              ),
              { minLength: 3, maxLength: 16 }
            )
            .map((cs) => `p6_${Date.now().toString(36)}_${cs.join('')}`),
          fc.string({ minLength: 1, maxLength: 32 }).filter((s) => s.trim().length > 0),
          async (username, awsccId) => {
            const { accessToken, authUserId } = await signedInClient();
            try {
              const req = buildRequest('http://test.local/api/users', {
                method: 'POST',
                accessToken,
                body: { username, awsccId },
              });
              const res = await POST(req);
              expect(res.status).toBe(201);
              const body = (await res.json()) as CreateUserResponse;
              expect(body.user).toBeDefined();
              expect(body.user.id).toMatch(UUID_V4_RE);
              expect(body.user.id).toBe(authUserId); // id === auth.uid()
            } finally {
              await deleteTestUser(authUserId);
            }
          }
        ),
        // Each iteration must use a fresh auth user (id is bound to auth.uid()).
        // Capped at 3 to keep the suite under Supabase's anon-signup rate limit;
        // raise the dashboard rate limit and increase this for stronger coverage.
        { numRuns: 3 }
      );
    }, 240_000);
  });

  /**
   * Tag: Feature: aws-community-showcase, Property 13: API error response format consistency
   *
   * For any error condition, the response carries a JSON body with `error` and
   * `message` (both non-empty strings) and an appropriate status code.
   */
  describe('Property 13: API error response format consistency', () => {
    it('rejects requests with no Authorization header as 401 + ErrorResponse', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 32 }),
          fc.string({ minLength: 0, maxLength: 32 }),
          async (username, awsccId) => {
            const req = buildRequest('http://test.local/api/users', {
              method: 'POST',
              body: { username, awsccId },
            });
            const res = await POST(req);
            expect(res.status).toBe(401);
            const body = (await res.json()) as ErrorResponse;
            expectErrorResponseShape(body);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('returns 400 + ErrorResponse for any invalid username (auth present)', async () => {
      // Generate strings that are guaranteed-invalid: include a disallowed char.
      const disallowedChar = fc.constantFrom(
        ...' !@#$%^&*()+=[]{}|\\;:\'",.<>/?`~'.split('')
      );
      // Share one anon session across all iterations — validation rejection happens
      // BEFORE we touch the database, so reusing the session is safe and avoids
      // hitting Supabase's anon-signup rate limit.
      const { accessToken, authUserId } = await signedInClient();
      try {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 0, maxLength: 16 }),
            disallowedChar,
            fc.string({ minLength: 0, maxLength: 16 }),
            async (prefix, bad, suffix) => {
              const username = prefix + bad + suffix;
              const req = buildRequest('http://test.local/api/users', {
                method: 'POST',
                accessToken,
                body: { username, awsccId: 'AWSCC-x' },
              });
              const res = await POST(req);
              expect(res.status).toBe(400);
              const body = (await res.json()) as ErrorResponse;
              expectErrorResponseShape(body);
            }
          ),
          { numRuns: 25 }
        );
      } finally {
        await deleteTestUser(authUserId);
      }
    }, 120_000);
  });
});

function expectErrorResponseShape(body: unknown): asserts body is ErrorResponse {
  expect(body).toBeDefined();
  expect(typeof body).toBe('object');
  const b = body as Record<string, unknown>;
  expect(typeof b.error).toBe('string');
  expect((b.error as string).length).toBeGreaterThan(0);
  expect(typeof b.message).toBe('string');
  expect((b.message as string).length).toBeGreaterThan(0);
}

// silence unused warning for helper import order
void uniqueUsername;

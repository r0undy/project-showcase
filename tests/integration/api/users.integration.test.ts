/**
 * Integration tests — POST /api/users
 * Feature: aws-community-showcase (Task 6.5)
 *
 * Hits the live linked Supabase project. Each test cleans up its own auth + db rows.
 */

import { POST } from "@/app/api/users/route";
import {
  signedInClient,
  buildRequest,
  deleteTestUser,
  adminTestClient,
  uniqueUsername,
} from "../../helpers/supabase-test";
import type { CreateUserResponse, ErrorResponse } from "@/types";

const TEST_TIMEOUT = 30_000;

describe("POST /api/users — integration", () => {
  it(
    "creates a user record (id === auth.uid()) and returns 201 with the User",
    async () => {
      const { accessToken, authUserId } = await signedInClient();
      const username = uniqueUsername("it");
      try {
        const req = buildRequest("http://test.local/api/users", {
          method: "POST",
          accessToken,
          body: { username, awsccId: "AWSCC-INT-001" },
        });
        const res = await POST(req);

        expect(res.status).toBe(201);
        const body = (await res.json()) as CreateUserResponse;
        expect(body.user.id).toBe(authUserId);
        expect(body.user.username).toBe(username);
        expect(body.user.awsccId).toBe("AWSCC-INT-001");
        expect(body.user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

        // Verify row actually exists in the DB
        const admin = adminTestClient();
        const { data, error } = await admin
          .from("users")
          .select("*")
          .eq("id", authUserId)
          .single();
        expect(error).toBeNull();
        expect(data?.username).toBe(username);
        expect(data?.awscc_id).toBe("AWSCC-INT-001");
      } finally {
        await deleteTestUser(authUserId);
      }
    },
    TEST_TIMEOUT,
  );

  it(
    "returns 401 when Authorization header is missing",
    async () => {
      const req = buildRequest("http://test.local/api/users", {
        method: "POST",
        body: { username: uniqueUsername("it"), awsccId: "X" },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toBe("UNAUTHORIZED");
      expect(body.message).toMatch(/authentication/i);
    },
    TEST_TIMEOUT,
  );

  it(
    "returns 401 when Authorization header is malformed",
    async () => {
      const req = buildRequest("http://test.local/api/users", {
        method: "POST",
        headers: { authorization: "Basic malformed" },
        body: { username: uniqueUsername("it"), awsccId: "X" },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    },
    TEST_TIMEOUT,
  );

  it(
    "returns 400 for an invalid username (contains spaces)",
    async () => {
      const { accessToken, authUserId } = await signedInClient();
      try {
        const req = buildRequest("http://test.local/api/users", {
          method: "POST",
          accessToken,
          body: { username: "has spaces", awsccId: "AWSCC-1" },
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = (await res.json()) as ErrorResponse;
        expect(body.error).toBe("VALIDATION_ERROR");
        expect(body.details).toMatchObject({ username: expect.any(String) });
      } finally {
        await deleteTestUser(authUserId);
      }
    },
    TEST_TIMEOUT,
  );

  it(
    "allows awsccId to be omitted",
    async () => {
      const { accessToken, authUserId } = await signedInClient();
      try {
        const req = buildRequest("http://test.local/api/users", {
          method: "POST",
          accessToken,
          body: { username: uniqueUsername("it") },
        });
        const res = await POST(req);
        expect(res.status).toBe(201);
        const body = (await res.json()) as CreateUserResponse;
        expect(body.user.awsccId).toBeUndefined();

        const admin = adminTestClient();
        const { data, error } = await admin
          .from("users")
          .select("*")
          .eq("id", authUserId)
          .single();
        expect(error).toBeNull();
        expect(data?.awscc_id).toBeNull();
      } finally {
        await deleteTestUser(authUserId);
      }
    },
    TEST_TIMEOUT,
  );

  it(
    "returns 400 for non-JSON body",
    async () => {
      const { accessToken, authUserId } = await signedInClient();
      try {
        const req = new Request("http://test.local/api/users", {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: "not json",
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = (await res.json()) as ErrorResponse;
        expect(body.error).toBe("INVALID_JSON");
      } finally {
        await deleteTestUser(authUserId);
      }
    },
    TEST_TIMEOUT,
  );

  it(
    "returns 409 when the username is already taken",
    async () => {
      const username = uniqueUsername("it");
      // Create initial user
      const first = await signedInClient();
      const firstReq = buildRequest("http://test.local/api/users", {
        method: "POST",
        accessToken: first.accessToken,
        body: { username, awsccId: "AWSCC-A" },
      });
      const firstRes = await POST(firstReq);
      expect(firstRes.status).toBe(201);

      // Second user tries to take the same username
      const second = await signedInClient();
      try {
        const secondReq = buildRequest("http://test.local/api/users", {
          method: "POST",
          accessToken: second.accessToken,
          body: { username, awsccId: "AWSCC-B" },
        });
        const secondRes = await POST(secondReq);
        expect(secondRes.status).toBe(409);
        const body = (await secondRes.json()) as ErrorResponse;
        expect(body.error).toBe("CONFLICT");
        expect(body.message.toLowerCase()).toContain("username");
      } finally {
        await deleteTestUser(first.authUserId);
        await deleteTestUser(second.authUserId);
      }
    },
    TEST_TIMEOUT,
  );

  it(
    "returns 409 when the same auth user tries to insert twice",
    async () => {
      const { accessToken, authUserId } = await signedInClient();
      try {
        const u1 = uniqueUsername("it");
        const u2 = uniqueUsername("it2");
        const r1 = await POST(
          buildRequest("http://test.local/api/users", {
            method: "POST",
            accessToken,
            body: { username: u1, awsccId: "AWSCC-1" },
          }),
        );
        expect(r1.status).toBe(201);

        const r2 = await POST(
          buildRequest("http://test.local/api/users", {
            method: "POST",
            accessToken,
            body: { username: u2, awsccId: "AWSCC-2" },
          }),
        );
        expect(r2.status).toBe(409);
      } finally {
        await deleteTestUser(authUserId);
      }
    },
    TEST_TIMEOUT,
  );
});

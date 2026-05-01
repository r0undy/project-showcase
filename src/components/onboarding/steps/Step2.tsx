"use client";

/**
 * Step 2 — User info form.
 *
 * Renders the cosmic-themed form that signs the user in anonymously and
 * creates their public.users row via POST /api/users (see UserInfoForm).
 */

import { UserInfoForm } from "../UserInfoForm";
import { StepShell } from "./StepShell";

export function Step2() {
  return (
    <StepShell
      eyebrow="STEP 2"
      title="Tell us who you are."
      lede="Pick a username, add your AWSCC ID, and choose an optional avatar. We'll create your community profile and tie it to this device."
    >
      <UserInfoForm showSubmit={false} />
    </StepShell>
  );
}

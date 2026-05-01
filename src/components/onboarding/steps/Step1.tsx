'use client';

import { StepShell } from './StepShell';

/** Step 1 — Welcome. Filled in fully in Task 17. */
export function Step1() {
  return (
    <StepShell
      eyebrow="WELCOME"
      title="Let's get you on the launchpad."
      lede="The next 7 steps walk you through claiming a username, setting up your environment, and getting your project ready to deploy with AWS."
    />
  );
}

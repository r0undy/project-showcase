"use client";

/**
 * Step 4 — "You're cleared for launch."
 *
 * Completion screen with a primary CTA that navigates to deploy steps.
 */

import { motion } from "motion/react";
import { StepShell } from "./StepShell";

const itemVariants = {
  enter: { y: 14, opacity: 0, filter: "blur(4px)" },
  center: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { y: -8, opacity: 0, filter: "blur(4px)" },
};

export function Step4() {
  return (
    <StepShell
      eyebrow="ALL SET"
      title="You're cleared for launch."
      lede="Next up: the deploy checklist. We'll walk through the exact steps to get your project live."
    >
      <motion.p
        variants={itemVariants}
        className="mt-4 text-xs leading-relaxed text-muted-foreground/80"
      >
        Tip: your session is saved on this device, so you can come back to the
        deploy checklist later without re-onboarding.
      </motion.p>
    </StepShell>
  );
}

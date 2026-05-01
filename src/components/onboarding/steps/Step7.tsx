'use client';

/**
 * Step 7 — "You're cleared for launch."
 *
 * Completion screen with a primary CTA that navigates to the showcase. Note
 * that `/showcase` is built in Task 22 — clicking the CTA before that lands
 * will 404. The "Back to home" secondary link is always safe.
 */

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { StepShell } from './StepShell';

const itemVariants = {
  enter: { y: 14, opacity: 0, filter: 'blur(4px)' },
  center: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { y: -8, opacity: 0, filter: 'blur(4px)' },
};

export function Step7() {
  return (
    <StepShell
      eyebrow="ALL SET"
      title="You're cleared for launch."
      lede="Your project is ready to join the AWS Cloud Club PUP showcase. Drop in to react to other community projects, or share what you built today."
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
      >
        <Link
          href="/showcase"
          className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            paddingInline: '1.75rem',
            height: '2.75rem',
            boxShadow:
              '0 0 0 1px color-mix(in oklab, var(--glow-magenta) 40%, transparent), 0 12px 28px -8px color-mix(in oklab, var(--glow-magenta) 60%, transparent), 0 0 50px -8px color-mix(in oklab, var(--primary) 50%, transparent)',
          }}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Go to the showcase
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to home
        </Link>
      </motion.div>

      <motion.p
        variants={itemVariants}
        className="mt-4 text-xs leading-relaxed text-muted-foreground/80"
      >
        Tip: your session is saved on this device, so you can come back to the
        showcase later without re-onboarding.
      </motion.p>
    </StepShell>
  );
}

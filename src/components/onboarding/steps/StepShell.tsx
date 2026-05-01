'use client';

/**
 * Shared layout for every onboarding step. Each piece (eyebrow / title / lede /
 * content) is its own `motion` element so the parent in OnboardingFlow can
 * cascade a staggered enter via `staggerChildren` on its variants. The
 * children themselves carry no `initial`/`animate` — they inherit from the
 * parent variants context, so the same `enter`/`center`/`exit` keys propagate.
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface StepShellProps {
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  /** Step heading. */
  title: string;
  /** Step lead-in paragraph (optional). */
  lede?: string;
  children?: ReactNode;
}

/* Per-element variant. Picked up from variants context (set on the parent
 * <motion.div> in OnboardingFlow). The center transition uses an "expo-out"
 * cubic-bezier so the elements arrive smoothly rather than springing in. */
const item = {
  enter: { y: 14, opacity: 0, filter: 'blur(4px)' },
  center: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    y: -8,
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const },
  },
};

export function StepShell({ eyebrow, title, lede, children }: StepShellProps) {
  return (
    <div className="flex flex-col gap-5 text-left">
      {eyebrow && (
        <motion.span
          variants={item}
          className="font-display text-[10px] tracking-[0.22em] text-muted-foreground"
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        variants={item}
        className="font-display text-3xl uppercase leading-[1.05] tracking-[0.02em] text-foreground sm:text-4xl md:text-5xl"
      >
        {title}
      </motion.h2>
      {lede && (
        <motion.p
          variants={item}
          className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base"
        >
          {lede}
        </motion.p>
      )}
      {children && (
        <motion.div variants={item} className="mt-2">
          {children}
        </motion.div>
      )}
    </div>
  );
}

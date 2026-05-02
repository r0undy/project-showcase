'use client';

/**
 * CountdownTimer (Req 1.1, 2.5, 17.1, 17.2).
 *
 * Renders four cells (days / hours / minutes / seconds) with monospaced numbers
 * and small uppercase labels. Math + tick driven by `useCountdown`.
 */

import { motion } from 'motion/react';
import { useCountdown } from '@/hooks/useCountdown';
import type { TimeRemaining } from '@/lib/countdown';

interface CountdownTimerProps {
  /** ISO 8601 target datetime. */
  targetDate: string;
}

const CELLS: Array<{ key: keyof TimeRemaining; label: string }> = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
];

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const remaining = useCountdown(targetDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="grid grid-cols-4 gap-2 sm:gap-3"
      role="timer"
      aria-live="polite"
      aria-label="Time remaining until event"
    >
      {CELLS.map(({ key, label }) => (
        <Cell key={key} value={remaining[key]} label={label} />
      ))}
    </motion.div>
  );
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div
      // Inline padding + min-height/gap so the cell layout doesn't depend on
      // class-cascade resolution. Mirrors the CTA button approach.
      style={{
        paddingInline: 'clamp(0.75rem, 2.5vw, 1.5rem)',
        paddingBlock: 'clamp(0.875rem, 2.5vw, 1.25rem)',
        rowGap: '0.5rem',
        minHeight: '5rem',
      }}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-linear-to-br from-card to-secondary shadow-[0_0_28px_-12px_var(--glow-violet)] backdrop-blur-sm sm:rounded-2xl"
    >
      {/* Inner top-glow accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-(--glow-magenta) to-transparent opacity-70 sm:inset-x-12"
      />
      <span
        className="font-mono text-2xl font-semibold tabular-nums leading-none text-foreground sm:text-4xl"
        style={{ textShadow: '0 0 18px color-mix(in oklab, var(--glow-magenta) 40%, transparent)' }}
        aria-hidden="true"
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

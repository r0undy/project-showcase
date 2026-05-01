'use client';

/**
 * CTAButton (Req 1.2, 1.3, 16.1, 17.1).
 *
 * "Get Started" button with a Framer Motion hover/tap micro-interaction.
 * `onClick` is the modal trigger — the parent owns the modal-open state so
 * this stays presentational.
 */

import { motion } from 'motion/react';

interface CTAButtonProps {
  onClick: () => void;
  label?: string;
}

export function CTAButton({ onClick, label = 'Get Started' }: CTAButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      style={{
        // Inline width-affecting styles bypass any Tailwind class-resolution
        // surprises. minWidth keeps the pill visibly proportioned regardless
        // of how the surrounding flex layout sizes the inline-flex element.
        minWidth: '11rem',
        paddingInline: '2rem',
        height: '2.75rem',
        boxShadow:
          '0 0 0 1px color-mix(in oklab, var(--glow-magenta) 40%, transparent), 0 12px 32px -8px color-mix(in oklab, var(--glow-magenta) 60%, transparent), 0 0 60px -8px color-mix(in oklab, var(--primary) 50%, transparent)',
      }}
      className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Soft inner highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white/60 to-transparent"
      />
      {label}
    </motion.button>
  );
}

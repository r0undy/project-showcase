'use client';

/**
 * Step 3 — "Here's what you'll need."
 *
 * Pre-flight checklist before the technical setup steps (4–6). Items are
 * informational, not blocking — the user can mark steps done later.
 */

import { Cloud, GitBranch, Terminal, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { StepShell } from './StepShell';

const CHECKLIST: Array<{
  icon: typeof Cloud;
  title: string;
  body: string;
}> = [
  {
    icon: Cloud,
    title: 'AWS account',
    body: 'Free tier works — you only need it for the deployment step.',
  },
  {
    icon: GitBranch,
    title: 'GitHub account',
    body: 'For pushing your code and (optionally) wiring up CI.',
  },
  {
    icon: Terminal,
    title: 'Node.js 20+',
    body: 'And your editor of choice. We use Next.js 16 + Tailwind v4.',
  },
  {
    icon: Clock,
    title: '~30 minutes',
    body: 'Of focused time. You can pause anytime — your progress is saved.',
  },
];

const itemVariants = {
  enter: { y: 14, opacity: 0, filter: 'blur(4px)' },
  center: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { y: -8, opacity: 0, filter: 'blur(4px)' },
};

export function Step3() {
  return (
    <StepShell
      eyebrow="BEFORE YOU START"
      title="Here's what you'll need."
      lede="A few accounts and tools to keep within reach. You don't have to install everything right now — but having these on hand makes the next three steps quick."
    >
      <ul
        style={{ display: 'grid', gap: '0.5rem' }}
        className="sm:grid-cols-2"
      >
        {CHECKLIST.map(({ icon: Icon, title, body }) => (
          <motion.li
            key={title}
            variants={itemVariants}
            style={{
              padding: 'clamp(0.625rem, 1.5vw, 0.875rem)',
              gap: '0.625rem',
              display: 'flex',
              alignItems: 'flex-start',
            }}
            className="rounded-lg border border-border/60 bg-card/40 backdrop-blur-sm"
          >
            <span
              aria-hidden="true"
              style={{
                marginTop: '0.0625rem',
                width: '1.625rem',
                height: '1.625rem',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                background: 'var(--card)',
                boxShadow:
                  'inset 0 0 0 1px color-mix(in oklab, var(--glow-magenta) 40%, transparent),' +
                  ' 0 0 10px -3px color-mix(in oklab, var(--glow-magenta) 50%, transparent)',
              }}
            >
              <Icon className="size-3.5" />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <span
                style={{ fontSize: '0.6875rem', letterSpacing: '0.18em' }}
                className="font-display uppercase text-foreground"
              >
                {title}
              </span>
              <span
                style={{ fontSize: '0.75rem', lineHeight: 1.5 }}
                className="text-muted-foreground"
              >
                {body}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </StepShell>
  );
}

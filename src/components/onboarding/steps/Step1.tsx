'use client';

/**
 * Step 1 — Welcome.
 *
 * Sets the context for the 7-step flow with a short pitch and three visual
 * highlights of what the user is about to do.
 */

import { Rocket, Sparkles, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { StepShell } from './StepShell';

const HIGHLIGHTS: Array<{
  icon: typeof Sparkles;
  title: string;
  body: string;
}> = [
  {
    icon: Users,
    title: 'Claim your profile',
    body: 'Pick a username and link your AWSCC ID — joins you to the community showcase.',
  },
  {
    icon: Sparkles,
    title: 'Build the essentials',
    body: 'Walk through the design system, frontend setup, and deployment guide at your own pace.',
  },
  {
    icon: Rocket,
    title: 'Ship it with AWS',
    body: 'Take your portfolio live and react to other community projects when you land.',
  },
];

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

export function Step1() {
  return (
    <StepShell
      eyebrow="WELCOME"
      title="Ready to build, deploy, and showcase?"
      lede="Over the next few steps you'll set up your community profile, walk through the build essentials, and deploy your portfolio with AWS — all at your own pace."
    >
      <ul
        style={{ display: 'grid', gap: '0.5rem' }}
        className="sm:grid-cols-3"
      >
        {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
          <motion.li
            key={title}
            variants={itemVariants}
            style={{
              padding: 'clamp(0.75rem, 2vw, 1.125rem)',
              rowGap: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
            }}
            className="rounded-lg border border-border/60 bg-card/40 backdrop-blur-sm"
          >
            <span
              aria-hidden="true"
              style={{
                width: '1.75rem',
                height: '1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                background:
                  'linear-gradient(135deg, color-mix(in oklab, var(--primary) 30%, transparent), color-mix(in oklab, var(--accent) 30%, transparent))',
                boxShadow:
                  '0 0 14px -4px color-mix(in oklab, var(--glow-magenta) 60%, transparent)',
              }}
            >
              <Icon className="size-3.5" />
            </span>
            <span
              style={{ fontSize: '0.6875rem', letterSpacing: '0.16em' }}
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
          </motion.li>
        ))}
      </ul>
      <p
        style={{ marginTop: '0.5rem', fontSize: '0.6875rem' }}
        className="text-muted-foreground/80"
      >
        Takes about 10 minutes.
      </p>
    </StepShell>
  );
}

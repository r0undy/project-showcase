'use client';

/**
 * WelcomeClient — the /welcome page shell. Reuses the cosmic background +
 * decorative layers from the landing page so the route feels visually
 * continuous, then lets OnboardingFlow render full-bleed (no card wrapper)
 * with its own per-step heading. A small "← Back to home" link in the
 * top-left lets users exit without using the browser back button, and a
 * single page-level eyebrow keeps the event branding visible.
 */

import Link from 'next/link';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export function WelcomeClient() {
  return (
    <main className="cosmic-bg relative flex min-h-screen flex-col items-center px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24">
      <div className="cosmic-stars" aria-hidden="true" />

      <span
        className="cosmic-planet cosmic-float cosmic-planet-md"
        aria-hidden="true"
        style={{ top: '14%', left: '6%' }}
      />
      <span
        className="cosmic-planet cosmic-float cosmic-planet-sm"
        aria-hidden="true"
        style={{ top: '70%', right: '10%', animationDelay: '1.5s', opacity: 0.55 }}
      />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:left-6 sm:top-6"
      >
        <span aria-hidden="true">←</span>
        Back to home
      </Link>

      <span className="absolute right-4 top-4 z-20 font-display text-[10px] tracking-[0.22em] text-muted-foreground sm:right-6 sm:top-6">
        FROM VIBE TO LIVE
      </span>

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center">
        <OnboardingFlow />
      </div>
    </main>
  );
}

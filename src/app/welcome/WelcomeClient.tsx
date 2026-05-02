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
import { CosmicShootingStars } from '@/components/landing/CosmicShootingStars';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export function WelcomeClient() {
  return (
    <main
      style={{
        paddingInline: 'clamp(1rem, 3vw, 1.5rem)',
        paddingTop: 'clamp(3.5rem, 6vw, 5rem)',
        paddingBottom: 'clamp(2rem, 4vw, 4rem)',
      }}
      className="cosmic-bg relative flex min-h-screen flex-col items-center overflow-hidden"
    >
      <div className="cosmic-stars" aria-hidden="true" />

      <CosmicShootingStars />

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
      <span
        className="cosmic-planet cosmic-float cosmic-planet-sm"
        aria-hidden="true"
        style={{ top: '32%', right: '14%', animationDelay: '3s', opacity: 0.4 }}
      />

      <div className="cosmic-horizon" aria-hidden="true" />

      <Link
        href="/"
        style={{
          paddingInline: '0.875rem',
          paddingBlock: '0.5rem',
          gap: '0.5rem',
        }}
        className="absolute left-4 top-4 z-20 inline-flex items-center rounded-full border border-border/60 bg-card/40 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:left-6 sm:top-6"
      >
        <span aria-hidden="true">←</span>
        Back to home
      </Link>

      <span className="absolute right-4 top-4 z-20 font-display text-[10px] tracking-[0.22em] text-muted-foreground sm:right-6 sm:top-6">
        FROM VIBE TO LIVE
      </span>

      {/* `flex-1` + `min-h-0` lets the OnboardingFlow inside take all the
       * remaining vertical space, which it then divides between the step
       * viewport (flex: 1) and the StepNavigation (flex-shrink: 0). End
       * result: the stepper stays pinned at the bottom of this region
       * regardless of step content height. */}
      <div
        style={{ minHeight: 0, flex: 1 }}
        className="relative z-10 flex w-full flex-col items-center"
      >
        <OnboardingFlow />
      </div>
    </main>
  );
}

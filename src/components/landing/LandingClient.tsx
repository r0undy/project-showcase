'use client';

/**
 * LandingClient — owns the modal-open state for the landing page.
 *
 * The actual <OnboardingModal> is implemented in Task 16 and will be wired in
 * here. For now the click handler flips state; the modal is rendered as a
 * conditional placeholder that's easy to swap out without touching the
 * Server Component boundary.
 */

import { useState } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { CTAButton } from './CTAButton';

interface LandingClientProps {
  targetDate: string;
}

export function LandingClient({ targetDate }: LandingClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CountdownTimer targetDate={targetDate} />

      <CTAButton onClick={() => setIsModalOpen(true)} />

      {/* TODO(Task 16): replace with <OnboardingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /> */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Onboarding (placeholder)"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            // Inline padding so the panel's whitespace doesn't depend on the
            // class cascade — clamp scales 24–40px between mobile and desktop.
            style={{
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              maxWidth: '28rem',
              width: '100%',
            }}
            className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-card to-secondary shadow-[0_20px_60px_-15px_color-mix(in_oklab,var(--glow-magenta)_50%,transparent)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-(--glow-magenta) to-transparent sm:inset-x-16"
            />
            <span className="font-display text-[10px] tracking-[0.22em] text-muted-foreground">
              ONBOARDING
            </span>
            <h2 className="mt-4 font-display text-2xl uppercase tracking-[0.02em] text-foreground sm:text-3xl">
              Coming soon
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              The 7-step onboarding flow lands in Task 16. You&rsquo;ll sign in,
              pick a username + AWSCC ID, and walk through the setup steps from
              here.
            </p>
            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ paddingInline: '1.25rem', height: '2.5rem' }}
                className="inline-flex items-center rounded-full border border-border bg-card/40 text-sm font-medium text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

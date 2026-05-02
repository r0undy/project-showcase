/**
 * Landing Page (Server Component) — Req 1.1, 1.2, 1.5, 15.1, 15.2, 17.2, 17.3.
 *
 * Theme: Cosmic ("From Vibe to Live"). Copy + typography mirror the event
 * poster — Bungee display font for the headline, dark purple base with
 * magenta glows, animated shooting stars, floating planets.
 */

import { CosmicShootingStars } from '@/components/landing/CosmicShootingStars';
import { LandingClient } from '@/components/landing/LandingClient';

export default function Home() {
  return (
    <main className="cosmic-bg relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      {/* Decorative layers (z-index: -1 via class, no a11y impact) */}
      <div className="cosmic-stars" aria-hidden="true" />

      <CosmicShootingStars />

      {/* Planets — sized smaller on mobile via the responsive helper class. */}
      <span
        className="cosmic-planet cosmic-float cosmic-planet-lg"
        aria-hidden="true"
        style={{ top: '12%', left: '4%' }}
      />
      <span
        className="cosmic-planet cosmic-float cosmic-planet-md"
        aria-hidden="true"
        style={{ top: '72%', right: '8%', animationDelay: '1.5s', opacity: 0.55 }}
      />
      <span
        className="cosmic-planet cosmic-float cosmic-planet-sm"
        aria-hidden="true"
        style={{ top: '8%', right: '14%', animationDelay: '3s', opacity: 0.4 }}
      />
      {/* Distant planet horizon at the bottom — see globals.css `.cosmic-horizon`. */}
      <div className="cosmic-horizon" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-6 text-center sm:gap-8">
        <header className="flex flex-col items-center gap-4 sm:gap-5">
          {/* Eyebrow tagline */}
          <span className="font-display text-[10px] tracking-[0.22em] text-foreground sm:text-xs">
            FROM VIBE TO LIVE:
          </span>

          {/* Hero headline — wraps naturally on mobile, stacks on desktop */}
          <h1 className="cosmic-glow-pulse font-display text-2xl uppercase leading-[1.05] tracking-[0.02em] text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            <span
              className="bg-linear-to-b from-white via-white to-(--glow-magenta) bg-clip-text text-transparent"
              style={{
                WebkitTextStroke: '1.5px color-mix(in oklab, var(--glow-magenta) 70%, transparent)',
                paintOrder: 'stroke fill',
              }}
            >
              Deploying your portfolio with AWS
            </span>
          </h1>

          {/* Event details — chips stack on small screens */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-sm">
              May 2, 2026
            </span>
            <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-sm">
              1:00 PM &ndash; 6:00 PM
            </span>
            <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-sm">
              White Cloak Technologies, Pasig City
            </span>
          </div>

          <p className="max-w-md text-xs text-muted-foreground sm:max-w-lg sm:text-sm">
            Submit your project, react to others, and join the AWS Cloud Club PUP showcase.
          </p>
        </header>

        <LandingClient />

        <footer className="mt-2 text-[10px] text-muted-foreground/80 sm:text-xs">
          AWS Cloud Club PUP &middot; awscloudclub.pupmnl@gmail.com &middot; @awscc_pup
        </footer>
      </div>
    </main>
  );
}

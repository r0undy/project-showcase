/**
 * Landing Page (Server Component) — Req 1.1, 1.2, 1.5, 15.1, 15.2, 17.2, 17.3.
 *
 * Theme: Cosmic ("From Vibe to Live"). Copy + typography mirror the event
 * poster — Bungee display font for the headline, dark purple base with
 * magenta glows, animated shooting stars, floating planets.
 */

import { LandingClient } from '@/components/landing/LandingClient';

const DEFAULT_TARGET = '2026-12-31T23:59:59Z';

/* Shooting stars originate from the upper-right of the viewport and fly
 * diagonally down-left (see globals.css `.cosmic-shooting-star`). Positions
 * use `top` + `right`; mixing pixel offsets so the meteor shower looks
 * staggered rather than mechanically uniform. */
const SHOOTING_STARS: Array<{
  top: string;
  right: string;
  delay: string;
  duration: string;
}> = [
  { top: '0',     right: '0',     delay: '0s',    duration: '2.5s' },
  { top: '0',     right: '120px', delay: '0.6s',  duration: '3s' },
  { top: '60px',  right: '0',     delay: '1.2s',  duration: '2s' },
  { top: '0',     right: '320px', delay: '1.8s',  duration: '2.8s' },
  { top: '0',     right: '600px', delay: '2.4s',  duration: '2.4s' },
  { top: '160px', right: '40px',  delay: '3.0s',  duration: '2.6s' },
];

export default function Home() {
  const targetDate = process.env.NEXT_PUBLIC_COUNTDOWN_TARGET ?? DEFAULT_TARGET;

  return (
    <main className="cosmic-bg relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      {/* Decorative layers (z-index: -1 via class, no a11y impact) */}
      <div className="cosmic-stars" aria-hidden="true" />

      {SHOOTING_STARS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="cosmic-shooting-star"
          style={{
            top: s.top,
            right: s.right,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}

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
            The launch happens in:
          </p>
        </header>

        <LandingClient targetDate={targetDate} />

        <footer className="mt-2 text-[10px] text-muted-foreground/80 sm:text-xs">
          AWS Cloud Club PUP &middot; awscloudclub.pupmnl@gmail.com &middot; @awscc_pup
        </footer>
      </div>
    </main>
  );
}

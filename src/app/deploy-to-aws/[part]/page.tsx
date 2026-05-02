import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CosmicShootingStars } from '@/components/landing/CosmicShootingStars';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { QuickNav } from '@/components/markdown/QuickNav';
import { TopNav } from '@/components/nav/TopNav';
import { RevealListener } from '@/components/deploy/RevealListener';
import { PartPresenceCard } from '@/components/deploy/PartPresenceCard';
import { getDeployGuidePart } from '@/lib/markdown';
import { getGlobalConfig } from '@/lib/global-config';

// /p4 must be checked against the live reveal flag, not pre-rendered.
export const dynamic = 'force-dynamic';

interface DeployToAwsPartPageProps {
  // Next.js 15+ App Router: route params are now an async Promise.
  params: Promise<{ part: string }>;
}

export default async function DeployToAwsPartPage({
  params,
}: DeployToAwsPartPageProps) {
  const { part } = await params;
  const { part4_revealed } = await getGlobalConfig();
  const section = await getDeployGuidePart(part, part4_revealed);

  if (!section) {
    notFound();
  }

  return (
    <main
      className="cosmic-bg relative grid min-h-screen w-full place-items-center"
      style={{
        // Generous horizontal padding scales 16 → 64px so the content has
        // visible breathing room from the page edges on every viewport.
        paddingInline: 'clamp(1rem, 4vw, 4rem)',
        paddingTop: 'clamp(5.5rem, 8vw, 7rem)',
        paddingBottom: 'clamp(2.5rem, 4vw, 4rem)',
      }}
    >
      <div className="cosmic-stars" aria-hidden="true" />
      <CosmicShootingStars />
      <span
        className="cosmic-planet cosmic-float cosmic-planet-md"
        aria-hidden="true"
        style={{ top: '8%', left: '4%' }}
      />
      <span
        className="cosmic-planet cosmic-float cosmic-planet-sm"
        aria-hidden="true"
        style={{ top: '60%', right: '4%', animationDelay: '1.5s', opacity: 0.45 }}
      />
      <div className="cosmic-horizon" aria-hidden="true" />
      <TopNav active="deploy" />
      <RevealListener />
      <PartPresenceCard part={section.slug} />

      {/* Two-column layout on lg+: main content (left, centered) + sticky
       *  quick-nav (right). Below `lg`, only the main content shows. */}
      <div
        className="relative z-10 mx-auto grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem]"
        style={{
          maxWidth: '78rem',
          gap: 'clamp(1.5rem, 3vw, 3rem)',
          alignItems: 'start', // crucial: lets the aside size to its content
        }}
      >
        {/* Inner column: capped at 52rem and centered horizontally inside its
         *  grid cell so the article reads at a comfortable width even when
         *  the page goes wide. */}
        <div
          className="flex w-full min-w-0 flex-col"
          style={{
            gap: 'clamp(1.25rem, 2.8vw, 2rem)',
            maxWidth: '52rem',
            marginInline: 'auto',
          }}
        >
          <Link
            href="/deploy-to-aws"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
          >
            ← Back to deploy guide
          </Link>

          <header
            className="rounded-2xl border border-border/60 bg-secondary"
            style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Part {section.part}
            </span>
            <h1 className="mt-3 font-display text-2xl uppercase tracking-[0.02em] text-foreground sm:text-4xl">
              {section.title}
            </h1>
          </header>

          <article
            className="rounded-2xl border border-border/60 bg-secondary"
            style={{ padding: 'clamp(1.25rem, 3vw, 2.25rem)' }}
          >
            <div className="space-y-4">
              <MarkdownRenderer content={section.content} />
            </div>
          </article>
        </div>

        {/* Sticky right-side quick nav. Sticky lives on the <aside> itself
         *  rather than on the inner <nav>, because:
         *   - `alignSelf: start` keeps the aside content-sized (otherwise
         *     `align-items: stretch` on the grid would size it to the full
         *     row height, and sticky-inside-stretched-cell behaves
         *     inconsistently across browsers).
         *   - With sticky on the aside + a real ancestor scroll container
         *     (the document, since `.cosmic-bg` uses `clip-path: inset(0)`
         *     rather than `overflow: hidden`/`clip`), the pin-to-top
         *     behavior is rock-solid: the aside stays anchored
         *     6rem below the top of the viewport until the bottom of the
         *     grid row passes, then scrolls off naturally with the article. */}
        <aside
          className="hidden lg:block"
          style={{
            position: 'sticky',
            top: '6rem',
            alignSelf: 'start',
          }}
        >
          <QuickNav headings={section.headings} />
        </aside>
      </div>
    </main>
  );
}

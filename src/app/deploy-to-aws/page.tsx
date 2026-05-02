import { CosmicShootingStars } from "@/components/landing/CosmicShootingStars";
import { TopNav } from "@/components/nav/TopNav";
import { RevealListener } from "@/components/deploy/RevealListener";
import { DeployPartsList } from "@/components/deploy/DeployPartsList";
import { getDeployGuideSections } from "@/lib/markdown";
import { getGlobalConfig } from "@/lib/global-config";

// Always read the latest reveal flag — never serve a cached snapshot.
export const dynamic = "force-dynamic";

const PART_SUMMARIES: Record<number, string> = {
  1: "Receive your credentials, sign in, and set the region correctly.",
  2: "Create the S3 bucket, upload files, and enable static hosting.",
  3: "Add CloudFront for HTTPS, a CDN, and a professional URL.",
  4: "Celebrate, ship to the showcase, and meet the rest of the community.",
};

export default async function DeployToAwsPage() {
  const { part4_revealed } = await getGlobalConfig();
  const sections = await getDeployGuideSections(part4_revealed);

  return (
    <main
      className="cosmic-bg relative grid min-h-screen w-full place-items-start justify-items-center overflow-hidden pb-12 sm:pb-16"
      style={{ paddingTop: 'clamp(3.75rem, 4vw, 4.25rem)' }}
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
        style={{ top: '68%', right: '8%', animationDelay: '1.5s', opacity: 0.5 }}
      />
      <div className="cosmic-horizon" aria-hidden="true" />
      <TopNav active="deploy" />
      <RevealListener />

      <div
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col"
        style={{ gap: "clamp(1.5rem, 3vw, 2.5rem)" }}
      >
        <div />
        <header
          className="rounded-2xl border border-border/60 bg-secondary"
          style={{ padding: "clamp(1.25rem, 3vw, 2rem)" }}
        >
          <span className="font-display text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            AWS WORKSHOP GUIDE
          </span>
          <h1 className="mt-3 font-display text-2xl uppercase tracking-[0.02em] text-foreground sm:text-4xl">
            Deploy to AWS
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Pick a part to follow the step-by-step guide. Each section matches
            the workshop flow and keeps the AWS console steps easy to follow.
          </p>
        </header>

        <section
          className="rounded-2xl border border-border/60 bg-secondary"
          style={{ padding: "clamp(0.75rem, 2vw, 1rem)" }}
        >
          <div
            className="flex items-center justify-between rounded-xl border border-border/50 bg-card"
            style={{ padding: "0.75rem 1rem" }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Parts
            </span>
            <span className="text-xs text-muted-foreground">
              {sections.length} guides
            </span>
          </div>

          <DeployPartsList sections={sections} partSummaries={PART_SUMMARIES} />
        </section>
      </div>
    </main>
  );
}

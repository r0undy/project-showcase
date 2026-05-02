import Link from "next/link";
import { CosmicShootingStars } from "@/components/landing/CosmicShootingStars";
import { TopNav } from "@/components/nav/TopNav";
import { getDeployGuideSections } from "@/lib/markdown";

const PART_SUMMARIES: Record<number, string> = {
  1: "Receive your credentials, sign in, and set the region correctly.",
  2: "Create the S3 bucket, upload files, and enable static hosting.",
  3: "Add CloudFront for HTTPS, a CDN, and a professional URL.",
};

export default async function DeployToAwsPage() {
  const sections = await getDeployGuideSections();

  return (
    <main className="cosmic-bg relative grid min-h-screen w-full place-items-center overflow-hidden pb-12 pt-24 sm:pb-16 sm:pt-28">
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

          <div className="mt-3 flex flex-col" style={{ gap: "0.5rem" }}>
            {sections.map((section) => (
              <Link
                key={section.slug}
                href={`/deploy-to-aws/${section.slug}`}
                className="group flex items-center justify-between rounded-xl border border-border/50 bg-card transition hover:border-accent/60"
                style={{ padding: "0.85rem 1rem" }}
              >
                <div className="flex items-center" style={{ gap: "0.75rem" }}>
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full border border-border/70"
                  />
                  <div className="flex flex-col" style={{ gap: "0.2rem" }}>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Part {section.part}
                    </span>
                    <span className="text-sm font-semibold text-foreground sm:text-base">
                      {section.title}
                    </span>
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      {PART_SUMMARIES[section.part] ??
                        "Follow the guided steps."}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-accent transition group-hover:text-foreground">
                  Open guide
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

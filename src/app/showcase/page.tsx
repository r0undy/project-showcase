import type { Metadata } from 'next';
import { CosmicShootingStars } from "@/components/landing/CosmicShootingStars";
import { TopNav } from "@/components/nav/TopNav";
import { ShowcaseGrid } from "@/components/showcase/ShowcaseGrid";
import type { ProjectWithAuthor } from "@/types";

export const metadata: Metadata = {
  title: 'Community Showcase · From Vibe to Live',
  description: 'Projects built by the AWS Cloud Club PUP Manila community.',
};

async function fetchProjects(): Promise<ProjectWithAuthor[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/projects`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects ?? [];
  } catch {
    return [];
  }
}

export default async function ShowcasePage() {
  const projects = await fetchProjects();

  return (
    <main
      className="cosmic-bg relative grid min-h-screen w-full place-items-center"
      style={{ overflow: 'clip' }}
    >
      <div className="cosmic-stars" aria-hidden="true" />
      <CosmicShootingStars />
      <span
        className="cosmic-planet cosmic-float cosmic-planet-md"
        aria-hidden="true"
        style={{ top: '12%', left: '4%' }}
      />
      <span
        className="cosmic-planet cosmic-float cosmic-planet-sm"
        aria-hidden="true"
        style={{ top: '60%', right: '6%', animationDelay: '1.5s', opacity: 0.5 }}
      />
      <div className="cosmic-horizon" aria-hidden="true" />
      <TopNav active="showcase" />

      <div
        className="relative z-10 mx-auto w-full max-w-7xl"
        style={{ padding: '120px 24px 80px' }}
      >
        <ShowcaseGrid initialProjects={projects} />
      </div>
    </main>
  );
}

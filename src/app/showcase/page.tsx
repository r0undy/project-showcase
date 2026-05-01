import { TopNav } from "@/components/nav/TopNav";
import { ShowcaseGrid } from "@/components/showcase/ShowcaseGrid";
import type { ProjectWithAuthor } from "@/types";

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
    <main className="cosmic-bg relative min-h-screen" style={{ overflow: 'clip' }}>
      <div className="cosmic-stars" aria-hidden="true" />
      <TopNav active="showcase" />

      <div
        className="relative z-10 mx-auto w-full"
        style={{ padding: '120px 24px 80px' }}
      >
        <ShowcaseGrid initialProjects={projects} />
      </div>
    </main>
  );
}

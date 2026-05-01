import { TopNav } from "@/components/nav/TopNav";

export default function ShowcasePage() {
  return (
    <main className="cosmic-bg relative flex min-h-screen items-center justify-center px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
      <div className="cosmic-stars" aria-hidden="true" />
      <div className="cosmic-horizon" aria-hidden="true" />
      <TopNav active="showcase" />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <h1 className="font-display text-2xl uppercase tracking-[0.02em] text-foreground sm:text-4xl">
          Showcase
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Coming soon.
        </p>
      </div>
    </main>
  );
}

'use client';

/**
 * QuickNav — sticky right-side outline of a markdown page's headings.
 *
 * - Headings come pre-extracted from `lib/markdown.ts#extractHeadings`, so
 *   the slugs match the `id` attributes the MarkdownRenderer puts on each
 *   heading. Clicking a link jumps to the anchor (smoothed by CSS + the
 *   `scroll-margin-top` we set in the renderer to clear the fixed TopNav).
 * - `IntersectionObserver` highlights whichever heading is closest to the
 *   top of the viewport, so the active state tracks the user's scroll
 *   position without manual scroll handlers.
 *
 * Hidden on screens narrower than `lg` (the parent page hides the column).
 */

import { useEffect, useState } from 'react';
import type { MarkdownHeading } from '@/lib/markdown';

interface QuickNavProps {
  headings: MarkdownHeading[];
}

export function QuickNav({ headings }: QuickNavProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    headings[0]?.slug ?? null
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (headings.length === 0) return;

    // Map slug → its corresponding heading element, keeping only the ones
    // actually mounted in the DOM.
    const elements: HTMLElement[] = [];
    for (const h of headings) {
      const el = document.getElementById(h.slug);
      if (el) elements.push(el);
    }
    if (elements.length === 0) return;

    // The rootMargin pulls the activation band up so a heading is only
    // "active" once it's near the top of the viewport.
    //   top: -96px   → ignore the first 96px (where the fixed TopNav sits)
    //   bottom: -55% → only count headings in the top ~45% of the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        // Track every observed entry's intersection state in a Map so we
        // can pick the topmost intersecting heading deterministically.
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

        if (intersecting.length > 0) {
          setActiveSlug(intersecting[0].id);
        }
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      // Sticky positioning lives on the parent <aside> in the page layout
      // (alignSelf: start + position: sticky). This element just caps its
      // own scroll height so a long outline can scroll internally instead
      // of pushing past the viewport bottom.
      style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}
      className="hide-scrollbar rounded-2xl border border-border/60 bg-secondary/60 backdrop-blur-sm"
    >
      <div style={{ padding: 'clamp(1rem, 1.6vw, 1.25rem)' }}>
        <p
          style={{ marginBottom: '0.875rem' }}
          className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          On this page
        </p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {headings.map((h) => {
            const isActive = h.slug === activeSlug;
            return (
              <li key={h.slug} style={{ paddingLeft: h.depth === 3 ? '0.75rem' : h.depth === 4 ? '1.5rem' : 0 }}>
                <a
                  href={`#${h.slug}`}
                  aria-current={isActive ? 'location' : undefined}
                  style={{
                    display: 'block',
                    paddingBlock: '0.25rem',
                    borderLeft: isActive
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                    paddingLeft: '0.625rem',
                    color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.8125rem',
                    lineHeight: 1.4,
                    transition: 'color 150ms ease, border-color 150ms ease',
                  }}
                  className="hover:text-foreground"
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

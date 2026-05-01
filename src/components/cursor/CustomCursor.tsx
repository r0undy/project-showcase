'use client';

/**
 * CustomCursor — a glowing magenta dot that follows the pointer.
 *
 * Behavior:
 *   - Only activates on devices with a fine pointer (mouse / trackpad).
 *     Touch users keep their native cursor (which is invisible anyway).
 *   - Honors `prefers-reduced-motion`: skips the trailing dot in that case.
 *   - Adds a `cosmic-cursor` class to <html> while active, which (via
 *     globals.css) hides the OS cursor on `(pointer: fine)`.
 *   - Two layers: a small bright dot at the exact pointer + a larger soft
 *     halo that lerps toward the pointer for a comet-trail feel.
 *   - Grows the halo when hovering interactive elements.
 */

import { useEffect, useRef, useState } from 'react';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, [data-cursor-hover]';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    setEnabled(true);
    document.documentElement.classList.add('cosmic-cursor');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let haloX = pointerX;
    let haloY = pointerY;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      }
      if (reduced && haloRef.current) {
        haloRef.current.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onOver = (e: PointerEvent) => {
      if (!haloRef.current) return;
      const target = e.target as Element | null;
      const interactive = target?.closest(INTERACTIVE_SELECTOR);
      haloRef.current.dataset.hover = interactive ? 'true' : 'false';
    };

    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (haloRef.current) haloRef.current.style.opacity = '0';
    };
    const onEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (haloRef.current) haloRef.current.style.opacity = '1';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    if (!reduced) {
      const tick = () => {
        // Lerp the halo toward the pointer for a soft trailing effect.
        haloX += (pointerX - haloX) * 0.18;
        haloY += (pointerY - haloY) * 0.18;
        if (haloRef.current) {
          haloRef.current.style.transform = `translate3d(${haloX}px, ${haloY}px, 0) translate(-50%, -50%)`;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove('cosmic-cursor');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={haloRef}
        aria-hidden="true"
        data-hover="false"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-10 w-10 rounded-full mix-blend-screen transition-[width,height,opacity] duration-200 will-change-transform data-[hover=true]:h-14 data-[hover=true]:w-14"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--glow-magenta) 60%, transparent) 0%, transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-2 w-2 rounded-full will-change-transform"
        style={{
          background: '#ffffff',
          boxShadow:
            '0 0 8px color-mix(in oklab, var(--glow-magenta) 80%, transparent), 0 0 18px var(--glow-magenta)',
        }}
      />
    </>
  );
}

'use client';

/**
 * CustomCursor — a glowing magenta dot with a cosmic stardust trail.
 *
 * Behavior:
 *   - Only activates on devices with a fine pointer (mouse / trackpad).
 *     Touch users keep their native cursor (which is invisible anyway).
 *   - Honors `prefers-reduced-motion`: skips the trail and lerping halo.
 *   - Adds a `cosmic-cursor` class to <html> while active, which (via
 *     globals.css) hides the OS cursor on `(pointer: fine)`.
 *   - Three layers:
 *       1. a small bright dot at the exact pointer (DOM)
 *       2. a soft halo that lerps toward the pointer (DOM)
 *       3. a canvas of stardust particles emitted on movement, blended
 *          additively for a comet/cosmic glow
 *   - Grows the halo and emits more particles when hovering interactive
 *     elements.
 */

import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, [data-cursor-hover]';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;   // base radius in css px
  life: number;   // 1 → 0
  decay: number;  // life lost per frame
  white: boolean; // a subset render as bright white sparkles
};

const MAX_PARTICLES = 220;

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    // Reveal the cursor layers (rendered with opacity:0 by default so refs
    // bind on first paint — gating the JSX behind a state flag would mean
    // the effect captures null refs before the elements mount).
    if (dotRef.current) dotRef.current.style.opacity = '1';
    if (haloRef.current) haloRef.current.style.opacity = '1';

    document.documentElement.classList.add('cosmic-cursor');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let lastX = pointerX;
    let lastY = pointerY;
    let haloX = pointerX;
    let haloY = pointerY;
    let raf = 0;
    let hovering = false;

    const particles: Particle[] = [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true }) ?? null;

    // Pre-render two particle sprites once: a magenta core and a white
    // sparkle. Per-frame draws are then a cheap drawImage with globalAlpha
    // rather than a fresh radial gradient per particle (which is expensive).
    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const whiteSprite = document.createElement('canvas');
    whiteSprite.width = 64;
    whiteSprite.height = 64;
    {
      const sctx = sprite.getContext('2d');
      if (sctx) {
        const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255, 220, 240, 1)');
        g.addColorStop(0.35, 'rgba(255, 69, 200, 0.55)');
        g.addColorStop(1, 'rgba(147, 51, 234, 0)');
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, 64, 64);
      }
      const wctx = whiteSprite.getContext('2d');
      if (wctx) {
        const g = wctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.35, 'rgba(255, 200, 240, 0.6)');
        g.addColorStop(1, 'rgba(255, 69, 200, 0)');
        wctx.fillStyle = g;
        wctx.fillRect(0, 0, 64, 64);
      }
    }

    const resize = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const emit = (x: number, y: number, count: number, dragX: number, dragY: number) => {
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.5 + 0.1;
        // A small fraction of the recent pointer motion is inherited as
        // velocity so particles drift along the trail before decelerating.
        particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed + dragX * 0.08,
          vy: Math.sin(angle) * speed + dragY * 0.08 - 0.12, // slight upward drift
          size: Math.random() * 2 + 0.8,
          life: 1,
          decay: 0.012 + Math.random() * 0.018,
          white: Math.random() < 0.18,
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      }
      if (reduced && haloRef.current) {
        haloRef.current.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      }
      if (!reduced) {
        const dx = pointerX - lastX;
        const dy = pointerY - lastY;
        const dist = Math.hypot(dx, dy);
        // Emission scales with movement so fast flicks leave longer trails.
        const base = Math.min(7, Math.floor(dist / 6));
        const count = base + (hovering ? 2 : 1);
        if (count > 0) emit(pointerX, pointerY, count, -dx, -dy);
        lastX = pointerX;
        lastY = pointerY;
      }
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const interactive = !!target?.closest(INTERACTIVE_SELECTOR);
      hovering = interactive;
      if (haloRef.current) {
        const size = interactive ? 56 : 40;
        haloRef.current.style.width = `${size}px`;
        haloRef.current.style.height = `${size}px`;
      }
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
    window.addEventListener('resize', resize);
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

        if (ctx && canvas) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          // Additive blending makes overlapping particles bloom.
          ctx.globalCompositeOperation = 'lighter';
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.life -= p.decay;
            if (p.life <= 0) {
              particles.splice(i, 1);
              continue;
            }
            ctx.globalAlpha = p.life * 0.65;
            const size = p.size * (0.6 + p.life * 1.4) * 8;
            ctx.drawImage(p.white ? whiteSprite : sprite, p.x - size / 2, p.y - size / 2, size, size);
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove('cosmic-cursor');
    };
  }, []);

  // Render the layers unconditionally so refs bind on first paint. Initial
  // opacity is 0 — the effect flips it to 1 only when activation conditions
  // (fine pointer, etc.) are met. Inline styles bypass Tailwind class
  // resolution so positioning/z-index don't depend on theme tokens.
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />
      <div
        ref={haloRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 40,
          height: 40,
          borderRadius: 9999,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          willChange: 'transform',
          zIndex: 9999,
          opacity: 0,
          background:
            'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--glow-magenta) 60%, transparent) 0%, transparent 70%)',
          filter: 'blur(2px)',
          transition: 'width 200ms ease, height 200ms ease, opacity 200ms ease',
        }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 8,
          height: 8,
          borderRadius: 9999,
          pointerEvents: 'none',
          willChange: 'transform',
          zIndex: 10000,
          opacity: 0,
          background: '#ffffff',
          boxShadow:
            '0 0 8px color-mix(in oklab, var(--glow-magenta) 80%, transparent), 0 0 18px var(--glow-magenta)',
        }}
      />
    </>
  );
}

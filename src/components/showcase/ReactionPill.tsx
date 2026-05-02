'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { EmojiReaction } from '@/types';

interface ReactionPillProps {
  reaction: EmojiReaction;
  onClick: () => void;
  disabled?: boolean;
  currentUserId?: string | null;
}

export function ReactionPill({ reaction, onClick, disabled, currentUserId }: ReactionPillProps) {
  const { emoji, count, hasReacted, reactors } = reaction;
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  function handleEnter() {
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltipPos({ top: rect.top - 6, left: rect.left + rect.width / 2 });
      setHovered(true);
    }, 250);
  }

  function handleLeave() {
    if (showTimer.current) clearTimeout(showTimer.current);
    setHovered(false);
  }

  // Build tooltip text: "you, @alice and 3 others reacted with 😊"
  const names = reactors.map((r) =>
    r.userId === currentUserId ? 'you' : `@${r.username}`
  );
  let tooltipText: string;
  if (names.length === 0) {
    tooltipText = `Reacted with ${emoji}`;
  } else if (names.length === 1) {
    tooltipText = `${names[0]} reacted with ${emoji}`;
  } else if (names.length === 2) {
    tooltipText = `${names[0]} and ${names[1]} reacted with ${emoji}`;
  } else if (names.length <= 5) {
    tooltipText = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} reacted with ${emoji}`;
  } else {
    tooltipText = `${names.slice(0, 3).join(', ')} and ${names.length - 3} others reacted with ${emoji}`;
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        disabled={disabled}
        aria-label={tooltipText}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: hasReacted ? 'oklch(28% 0.1 340 / 0.4)' : 'oklch(16% 0.04 285)',
          border: '1px solid',
          borderColor: hasReacted ? 'oklch(65% 0.25 340 / 0.5)' : 'oklch(35% 0.06 285 / 0.4)',
          borderRadius: '20px',
          padding: '4px 10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          color: hasReacted ? 'oklch(70% 0.25 340)' : 'oklch(65% 0.08 285)',
          fontWeight: 600,
          transition: 'all 0.15s',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }}>{emoji}</span>
        {count}
      </button>

      {mounted && hovered && createPortal(
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
            background: 'oklch(8% 0.03 285)',
            border: '1px solid oklch(35% 0.08 285 / 0.5)',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12px',
            color: 'var(--foreground)',
            maxWidth: '260px',
            lineHeight: 1.45,
            boxShadow: '0 8px 24px oklch(0% 0 0 / 0.5)',
            pointerEvents: 'none',
            animation: 'tooltip-in 0.12s ease-out both',
          }}
        >
          {tooltipText}
        </div>,
        document.body
      )}
    </>
  );
}

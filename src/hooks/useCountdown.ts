'use client';

/**
 * useCountdown — re-renders every second with the time remaining until `target`.
 *
 * Implements Req 1.1, 2.5. Pure-math is delegated to `calculateTimeRemaining`
 * (covered by Property 1) so the hook itself is just a setInterval wrapper.
 *
 * The interval is cleared on unmount and reset whenever `target` changes.
 * If the target has already elapsed the hook still renders zeros and stops
 * re-running so we don't waste timers on a static state.
 */

import { useEffect, useState } from 'react';
import {
  calculateTimeRemaining,
  isCountdownExpired,
  type TimeRemaining,
} from '@/lib/countdown';

export function useCountdown(target: string | Date): TimeRemaining {
  const [remaining, setRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(target)
  );

  useEffect(() => {
    // Sync once when target changes; covers the initial render and prop updates.
    setRemaining(calculateTimeRemaining(target));

    if (isCountdownExpired(target)) return;

    const id = setInterval(() => {
      const next = calculateTimeRemaining(target);
      setRemaining(next);
      if (isCountdownExpired(target)) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [target]);

  return remaining;
}

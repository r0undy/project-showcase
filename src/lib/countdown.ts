/**
 * Countdown calculation utility (Req 2.5).
 *
 * Pure function — easy to property-test without rendering React.
 * The formula matches Property 1's specification exactly:
 *   days    = floor(total_seconds / 86400)
 *   hours   = floor((total_seconds % 86400) / 3600)
 *   minutes = floor((total_seconds % 3600) / 60)
 *   seconds = total_seconds % 60
 *
 * Edge-case behavior:
 *   - target in the past → all zeros
 *   - target equals now  → all zeros
 *   - invalid date string → all zeros (caller decides UI fallback)
 *
 * Sub-second precision is intentionally truncated (floor) so the displayed
 * countdown stays monotonic and never flickers between, say, 30s and 29s.
 */

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZERO: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function calculateTimeRemaining(
  target: Date | string,
  now: Date = new Date()
): TimeRemaining {
  const targetDate = typeof target === 'string' ? new Date(target) : target;
  if (Number.isNaN(targetDate.getTime())) return ZERO;

  const totalSeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
  if (totalSeconds <= 0) return ZERO;

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function isCountdownExpired(target: Date | string, now: Date = new Date()): boolean {
  const t = typeof target === 'string' ? new Date(target) : target;
  if (Number.isNaN(t.getTime())) return true;
  return t.getTime() <= now.getTime();
}

/**
 * Unit tests — countdown utility (Task 13.4).
 * Specific edge cases. Property-based coverage lives in
 * tests/properties/countdown.property.test.ts (Property 1).
 */

import { calculateTimeRemaining, isCountdownExpired } from '@/lib/countdown';

describe('calculateTimeRemaining', () => {
  const NOW = new Date('2026-05-01T12:00:00Z');

  it('returns zeros when target equals now', () => {
    expect(calculateTimeRemaining(NOW, NOW)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('returns zeros for a target in the past', () => {
    const past = new Date(NOW.getTime() - 60_000);
    expect(calculateTimeRemaining(past, NOW)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('decomposes 1 day exactly', () => {
    const target = new Date(NOW.getTime() + 86_400_000);
    expect(calculateTimeRemaining(target, NOW)).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('decomposes 1d 2h 3m 4s', () => {
    const totalSec = 1 * 86_400 + 2 * 3_600 + 3 * 60 + 4;
    const target = new Date(NOW.getTime() + totalSec * 1000);
    expect(calculateTimeRemaining(target, NOW)).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  it('decomposes 23h 59m 59s (just under 1 day)', () => {
    const totalSec = 23 * 3_600 + 59 * 60 + 59;
    const target = new Date(NOW.getTime() + totalSec * 1000);
    expect(calculateTimeRemaining(target, NOW)).toEqual({
      days: 0,
      hours: 23,
      minutes: 59,
      seconds: 59,
    });
  });

  it('handles a far-future target (1000 days)', () => {
    const target = new Date(NOW.getTime() + 1000 * 86_400_000);
    const r = calculateTimeRemaining(target, NOW);
    expect(r.days).toBe(1000);
    expect(r.hours).toBe(0);
  });

  it('returns zeros for an invalid date string', () => {
    expect(calculateTimeRemaining('not-a-date', NOW)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('accepts an ISO 8601 string target', () => {
    const target = '2026-05-02T12:00:00Z'; // exactly +1 day
    expect(calculateTimeRemaining(target, NOW)).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('truncates sub-second precision (does not round up)', () => {
    // 5.9 seconds in the future should report 5, not 6.
    const target = new Date(NOW.getTime() + 5_900);
    expect(calculateTimeRemaining(target, NOW).seconds).toBe(5);
  });
});

describe('isCountdownExpired', () => {
  const NOW = new Date('2026-05-01T12:00:00Z');

  it('is false when target is in the future', () => {
    expect(isCountdownExpired(new Date(NOW.getTime() + 1000), NOW)).toBe(false);
  });

  it('is true when target equals now', () => {
    expect(isCountdownExpired(NOW, NOW)).toBe(true);
  });

  it('is true when target is in the past', () => {
    expect(isCountdownExpired(new Date(NOW.getTime() - 1000), NOW)).toBe(true);
  });

  it('is true for an invalid date', () => {
    expect(isCountdownExpired('garbage', NOW)).toBe(true);
  });
});

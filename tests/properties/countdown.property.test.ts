/**
 * Property-Based Tests — Countdown
 * Feature: aws-community-showcase
 *
 * Property 1: Countdown time calculation accuracy — Validates Req 2.5.
 *
 * For any target datetime and current datetime where target > current,
 * calculateTimeRemaining produces:
 *   days    = floor(total_seconds / 86400)
 *   hours   = floor((total_seconds % 86400) / 3600)
 *   minutes = floor((total_seconds % 3600) / 60)
 *   seconds = total_seconds % 60
 *
 * Tag: Feature: aws-community-showcase, Property 1: Countdown time calculation accuracy
 */

import fc from 'fast-check';
import { calculateTimeRemaining } from '@/lib/countdown';

describe('Countdown Property Tests', () => {
  describe('Property 1: Countdown time calculation accuracy', () => {
    it('produces the canonical day/hour/minute/second decomposition for any positive future delta', () => {
      fc.assert(
        fc.property(
          // Total seconds in the future, up to ~10 years.
          fc.integer({ min: 1, max: 10 * 365 * 86_400 }),
          (totalSeconds) => {
            const now = new Date('2026-01-01T00:00:00Z');
            const target = new Date(now.getTime() + totalSeconds * 1000);

            const result = calculateTimeRemaining(target, now);

            expect(result.days).toBe(Math.floor(totalSeconds / 86_400));
            expect(result.hours).toBe(Math.floor((totalSeconds % 86_400) / 3_600));
            expect(result.minutes).toBe(Math.floor((totalSeconds % 3_600) / 60));
            expect(result.seconds).toBe(totalSeconds % 60);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('the components recompose to the original total seconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 * 365 * 86_400 }),
          (totalSeconds) => {
            const now = new Date('2026-01-01T00:00:00Z');
            const target = new Date(now.getTime() + totalSeconds * 1000);
            const r = calculateTimeRemaining(target, now);
            const reconstituted =
              r.days * 86_400 + r.hours * 3_600 + r.minutes * 60 + r.seconds;
            expect(reconstituted).toBe(totalSeconds);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('returns all zeros for any target at or before now', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 * 365 * 86_400 }),
          (secondsAgo) => {
            const now = new Date('2026-01-01T00:00:00Z');
            const target = new Date(now.getTime() - secondsAgo * 1000);
            const r = calculateTimeRemaining(target, now);
            expect(r).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          }
        ),
        { numRuns: 200 }
      );
    });

    it('every component is a non-negative integer in its expected range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 * 365 * 86_400 }),
          (totalSeconds) => {
            const now = new Date('2026-01-01T00:00:00Z');
            const target = new Date(now.getTime() + totalSeconds * 1000);
            const r = calculateTimeRemaining(target, now);
            expect(Number.isInteger(r.days)).toBe(true);
            expect(Number.isInteger(r.hours)).toBe(true);
            expect(Number.isInteger(r.minutes)).toBe(true);
            expect(Number.isInteger(r.seconds)).toBe(true);
            expect(r.days).toBeGreaterThanOrEqual(0);
            expect(r.hours).toBeGreaterThanOrEqual(0);
            expect(r.hours).toBeLessThan(24);
            expect(r.minutes).toBeGreaterThanOrEqual(0);
            expect(r.minutes).toBeLessThan(60);
            expect(r.seconds).toBeGreaterThanOrEqual(0);
            expect(r.seconds).toBeLessThan(60);
          }
        ),
        { numRuns: 500 }
      );
    });
  });
});

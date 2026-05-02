/**
 * Property-Based Tests — Validation
 * Feature: aws-community-showcase
 *
 * Property 5: Username validation pattern compliance — Validates Req 4.2.
 */

import fc from 'fast-check';
import { isValidUsername, USERNAME_PATTERN } from '@/lib/validation';

describe('Username Validation Property Tests', () => {
  /**
   * Tag: Feature: aws-community-showcase, Property 5: Username validation pattern compliance
   *
   * For any input string, isValidUsername returns true iff the string is
   * non-empty AND matches /^[a-zA-Z0-9_-]+$/. (Length cap is implementation
   * detail; we restrict generated inputs to <= 64 chars to focus on the pattern.)
   */
  describe('Property 5: Username validation pattern compliance', () => {
    it('accepts iff input matches the canonical pattern', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 64 }),
          (input) => {
            const isValid = isValidUsername(input);
            const matchesPattern = input.length > 0 && USERNAME_PATTERN.test(input);
            expect(isValid).toBe(matchesPattern);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('always accepts strings drawn from the allowed alphabet (and rejects empty)', () => {
      const allowedChar = fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')
      );
      fc.assert(
        fc.property(
          fc.array(allowedChar, { minLength: 0, maxLength: 64 }).map((cs) => cs.join('')),
          (input) => {
            expect(isValidUsername(input)).toBe(input.length > 0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('rejects any input containing a disallowed character', () => {
      // Disallowed chars: anything not [A-Za-z0-9_-]
      const disallowed = fc.constantFrom(
        ...' !@#$%^&*()+=[]{}|\\;:\'",.<>/?`~\t\n'.split('')
      );
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 30 }),
          disallowed,
          fc.string({ minLength: 0, maxLength: 30 }),
          (prefix, bad, suffix) => {
            const input = prefix + bad + suffix;
            expect(isValidUsername(input)).toBe(false);
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});

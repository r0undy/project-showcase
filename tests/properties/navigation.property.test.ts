/**
 * Property-Based Tests — Onboarding navigation
 * Feature: aws-community-showcase
 *
 * Property 2: Onboarding navigation consistency — Validates Req 3.3
 * Property 3: Form data preservation across navigation — Validates Req 3.4
 * Property 4: Step indicator display accuracy — Validates Req 3.5
 *
 * All three are tested against the pure transitions in `lib/onboarding-state.ts`.
 * No React render — fast, deterministic.
 */

import fc from "fast-check";
import {
  INITIAL_ONBOARDING_STATE,
  TOTAL_STEPS,
  goToStep,
  nextStep,
  previousStep,
  setFormField,
} from "@/lib/onboarding-state";

const validStep = fc.integer({ min: 1, max: TOTAL_STEPS });

describe("Onboarding Navigation Property Tests", () => {
  /**
   * Tag: Feature: aws-community-showcase, Property 2: Onboarding navigation consistency
   *
   * For any current step N (1..4) and target M (1..4), goToStep(N→M) succeeds
   * regardless of completion state. The resulting `currentStep` MUST equal M.
   */
  describe("Property 2: Onboarding navigation consistency", () => {
    it("goToStep moves to any valid target from any starting step", () => {
      fc.assert(
        fc.property(validStep, validStep, (from, to) => {
          const start = goToStep(INITIAL_ONBOARDING_STATE, from);
          const after = goToStep(start, to);
          expect(after.currentStep).toBe(to);
        }),
        { numRuns: 200 },
      );
    });

    it("completion state of any step never blocks navigation to that step", () => {
      // Pre-mark some random subset of steps complete; navigation still works.
      fc.assert(
        fc.property(
          validStep,
          validStep,
          fc.array(validStep, { minLength: 0, maxLength: TOTAL_STEPS }),
          (from, to, completed) => {
            const completedSet = new Set(completed);
            const start = {
              ...INITIAL_ONBOARDING_STATE,
              currentStep: from,
              completedSteps: completedSet,
            };
            const after = goToStep(start, to);
            expect(after.currentStep).toBe(to);
            // Navigation does not mutate completion state.
            expect(after.completedSteps).toBe(start.completedSteps);
          },
        ),
        { numRuns: 200 },
      );
    });

    it("next/back are clamped at the boundaries", () => {
      fc.assert(
        fc.property(validStep, (step) => {
          const s = goToStep(INITIAL_ONBOARDING_STATE, step);
          const after = nextStep(s);
          if (step === TOTAL_STEPS) {
            expect(after.currentStep).toBe(TOTAL_STEPS);
          } else {
            expect(after.currentStep).toBe(step + 1);
          }
        }),
        { numRuns: 50 },
      );
      fc.assert(
        fc.property(validStep, (step) => {
          const s = goToStep(INITIAL_ONBOARDING_STATE, step);
          const after = previousStep(s);
          if (step === 1) {
            expect(after.currentStep).toBe(1);
          } else {
            expect(after.currentStep).toBe(step - 1);
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Tag: Feature: aws-community-showcase, Property 3: Form data preservation across navigation
   *
   * For any form data and any sequence of step changes, the form data MUST be
   * preserved. Navigation does not touch formData.
   */
  describe("Property 3: Form data preservation across navigation", () => {
    it("any sequence of next/back/goToStep preserves the formData", () => {
      const navOp = fc.oneof(
        fc.constant({ kind: "next" as const }),
        fc.constant({ kind: "back" as const }),
        validStep.map((step) => ({ kind: "goto" as const, step })),
      );

      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 64 }),
          fc.string({ minLength: 0, maxLength: 64 }),
          fc.array(navOp, { minLength: 1, maxLength: 30 }),
          (username, awsccId, ops) => {
            // Seed form data
            let s = setFormField(
              INITIAL_ONBOARDING_STATE,
              "username",
              username,
            );
            s = setFormField(s, "awsccId", awsccId);

            for (const op of ops) {
              if (op.kind === "next") s = nextStep(s);
              else if (op.kind === "back") s = previousStep(s);
              else s = goToStep(s, op.step);
            }

            expect(s.formData.username).toBe(username);
            expect(s.formData.awsccId).toBe(awsccId);
          },
        ),
        { numRuns: 200 },
      );
    });

    it("setFormField on one field never disturbs the other", () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 32 }),
          fc.string({ maxLength: 32 }),
          fc.string({ maxLength: 32 }),
          (initialUsername, initialAwscc, newUsername) => {
            let s = setFormField(
              INITIAL_ONBOARDING_STATE,
              "username",
              initialUsername,
            );
            s = setFormField(s, "awsccId", initialAwscc);
            s = setFormField(s, "username", newUsername);
            expect(s.formData.username).toBe(newUsername);
            expect(s.formData.awsccId).toBe(initialAwscc);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Tag: Feature: aws-community-showcase, Property 4: Step indicator display accuracy
   *
   * The indicator string is derived from `state.currentStep` and `TOTAL_STEPS`.
   * The pure data must always satisfy `1 <= currentStep <= TOTAL_STEPS` and
   * the formatted indicator string must contain the correct N/total values.
   */
  describe("Property 4: Step indicator display accuracy", () => {
    it("currentStep is always in [1, TOTAL_STEPS] after any navigation", () => {
      const navOp = fc.oneof(
        fc.constant({ kind: "next" as const }),
        fc.constant({ kind: "back" as const }),
        // Include out-of-range values to ensure clamping holds.
        fc
          .integer({ min: -50, max: 50 })
          .map((step) => ({ kind: "goto" as const, step })),
      );

      fc.assert(
        fc.property(fc.array(navOp, { minLength: 0, maxLength: 40 }), (ops) => {
          let s = INITIAL_ONBOARDING_STATE;
          for (const op of ops) {
            if (op.kind === "next") s = nextStep(s);
            else if (op.kind === "back") s = previousStep(s);
            else s = goToStep(s, op.step);
            expect(s.currentStep).toBeGreaterThanOrEqual(1);
            expect(s.currentStep).toBeLessThanOrEqual(TOTAL_STEPS);
            expect(Number.isInteger(s.currentStep)).toBe(true);
          }
        }),
        { numRuns: 200 },
      );
    });

    it('the formatted indicator "Step N of 4" reflects the current step exactly', () => {
      fc.assert(
        fc.property(validStep, (step) => {
          const s = goToStep(INITIAL_ONBOARDING_STATE, step);
          const indicator = `Step ${s.currentStep} of ${TOTAL_STEPS}`;
          expect(indicator).toBe(`Step ${step} of 4`);
        }),
        { numRuns: 50 },
      );
    });
  });
});

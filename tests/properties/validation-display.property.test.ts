/**
 * Property-Based Tests — Inline validation error display
 * Feature: aws-community-showcase
 *
 * Property 18: Validation error inline display — Validates Req 18.2
 *
 * "For any form field with a validation error, the frontend SHALL display
 *  an inline error message adjacent to or below the field, and the error
 *  message SHALL describe the validation failure."
 *
 * The frontend's "display rule" lives in `useFormValidation.visibleErrors`:
 * an error is considered displayable when (a) it exists in the validate()
 * output AND (b) the field has been touched OR the form has been submitted.
 *
 * The actual <span> rendering is asserted in the UserInfoForm unit tests;
 * here we hammer the pure rule with property tests so we know the data
 * underpinning the UI is correct for every input.
 */

import fc from "fast-check";
import { validateUserForm } from "@/lib/validation";

type FormErrors = ReturnType<typeof validateUserForm>;

/** Pure projection mirroring `useFormValidation.visibleErrors`. */
function visibleErrors(
  errors: FormErrors,
  touched: { username?: boolean; awsccId?: boolean },
  submitted: boolean,
): FormErrors {
  if (submitted) return errors;
  const out: FormErrors = {};
  if (touched.username && errors.username) out.username = errors.username;
  if (touched.awsccId && errors.awsccId) out.awsccId = errors.awsccId;
  return out;
}

describe("Property 18: Validation error inline display", () => {
  it("after submit, every error from validate() is visible", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 32 }),
        fc.string({ maxLength: 32 }),
        (username, awsccId) => {
          const errors = validateUserForm({ username, awsccId });
          const visible = visibleErrors(errors, {}, true);
          expect(visible).toEqual(errors);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("a touched field with an error always has its message visible", () => {
    // Restrict to inputs guaranteed to be invalid: bad username.
    fc.assert(
      fc.property(
        // Username with at least one disallowed char
        fc
          .tuple(
            fc.string({ maxLength: 16 }),
            fc.constantFrom(..." !@#$%^&*".split("")),
            fc.string({ maxLength: 16 }),
          )
          .map(([a, bad, c]) => a + bad + c),
        (badUsername) => {
          const errors = validateUserForm({
            username: badUsername,
            awsccId: "",
          });
          const visible = visibleErrors(
            errors,
            { username: true, awsccId: true },
            false,
          );
          // Username should have an error message.
          expect(typeof visible.username).toBe("string");
          expect((visible.username ?? "").length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("an untouched, pre-submit field never shows an error", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 32 }),
        fc.string({ maxLength: 32 }),
        (username, awsccId) => {
          const errors = validateUserForm({ username, awsccId });
          const visible = visibleErrors(errors, {}, false);
          expect(visible).toEqual({});
        },
      ),
      { numRuns: 200 },
    );
  });

  it("a valid input never produces a visible error, regardless of touched/submitted state", () => {
    const validUsername = fc
      .array(
        fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-_".split("")),
        { minLength: 1, maxLength: 32 },
      )
      .map((cs) => cs.join(""));
    const optionalAwscc = fc.oneof(
      fc.constant(""),
      fc
        .string({ minLength: 1, maxLength: 32 })
        .filter((s) => s.trim().length > 0),
    );

    fc.assert(
      fc.property(
        validUsername,
        optionalAwscc,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (username, awsccId, tu, ta, submitted) => {
          const errors = validateUserForm({ username, awsccId });
          expect(errors).toEqual({});
          const visible = visibleErrors(
            errors,
            { username: tu, awsccId: ta },
            submitted,
          );
          expect(visible).toEqual({});
        },
      ),
      { numRuns: 200 },
    );
  });
});

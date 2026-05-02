/**
 * Shared input validation utilities.
 *
 * The username pattern is the canonical regex defined in Property 5
 * (Req 4.2): only alphanumeric characters, hyphens, and underscores.
 * Empty strings are NOT valid usernames.
 */

import type { ValidationErrors } from "@/types";

export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const USERNAME_MIN_LENGTH = 1;
export const USERNAME_MAX_LENGTH = 64;

export function isValidUsername(input: unknown): input is string {
  if (typeof input !== "string") return false;
  if (input.length < USERNAME_MIN_LENGTH || input.length > USERNAME_MAX_LENGTH)
    return false;
  return USERNAME_PATTERN.test(input);
}

export function isNonEmptyString(input: unknown): input is string {
  return typeof input === "string" && input.trim().length > 0;
}

export function isValidStepNumber(input: unknown): input is number {
  return (
    typeof input === "number" &&
    Number.isInteger(input) &&
    input >= 1 &&
    input <= 7
  );
}

export function isValidUrl(input: unknown): input is string {
  if (typeof input !== "string") return false;
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public-named aliases (Task 14 spec: validateUsername / validateRequired / validateUrl).
// Keep these alongside the type-guard predicates so call sites can use whichever
// reads better in context.
// ---------------------------------------------------------------------------
export const validateUsername = isValidUsername;
export const validateRequired = isNonEmptyString;
export const validateUrl = isValidUrl;

/**
 * Validate the user-info form (Step 2).
 * Returns an empty object if everything is valid.
 */
export function validateUserForm(input: {
  username: unknown;
  awsccId: unknown;
  avatarUrl?: unknown;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!isValidUsername(input.username)) {
    errors.username =
      "Username can only contain letters, numbers, hyphens, and underscores.";
  }
  if (
    input.awsccId !== undefined &&
    input.awsccId !== null &&
    input.awsccId !== "" &&
    !isNonEmptyString(input.awsccId)
  ) {
    errors.awsccId = "AWSCC ID must be a non-empty string.";
  }
  if (input.avatarUrl && !isValidUrl(input.avatarUrl)) {
    errors.avatarUrl = "Avatar URL must be a valid http(s) URL.";
  }
  return errors;
}

/**
 * Validate the project-creation form.
 * `url` is required and must be a valid http(s) URL.
 * `mediaUrl` is optional but, when present, must be a valid http(s) URL.
 */
export function validateProjectForm(input: {
  title: unknown;
  description: unknown;
  url?: unknown;
  mediaUrl?: unknown;
}): { title?: string; description?: string; url?: string; mediaUrl?: string } {
  const errors: { title?: string; description?: string; url?: string; mediaUrl?: string } = {};
  if (!isNonEmptyString(input.title)) {
    errors.title = "Title is required.";
  } else if ((input.title as string).length > 200) {
    errors.title = "Title must be 200 characters or fewer.";
  }
  if (!isNonEmptyString(input.description)) {
    errors.description = "Description is required.";
  }
  if (!isValidUrl(input.url)) {
    errors.url = "A valid project URL (http or https) is required.";
  }
  if (
    input.mediaUrl !== undefined &&
    input.mediaUrl !== null &&
    input.mediaUrl !== ""
  ) {
    if (!isValidUrl(input.mediaUrl)) {
      errors.mediaUrl = "Media URL must be a valid http(s) URL.";
    }
  }
  return errors;
}

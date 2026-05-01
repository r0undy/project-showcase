/**
 * Shared input validation utilities.
 *
 * The username pattern is the canonical regex defined in Property 5
 * (Req 4.2): only alphanumeric characters, hyphens, and underscores.
 * Empty strings are NOT valid usernames.
 */

import type { ValidationErrors } from '@/types';

export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const USERNAME_MIN_LENGTH = 1;
export const USERNAME_MAX_LENGTH = 64;

export function isValidUsername(input: unknown): input is string {
  if (typeof input !== 'string') return false;
  if (input.length < USERNAME_MIN_LENGTH || input.length > USERNAME_MAX_LENGTH) return false;
  return USERNAME_PATTERN.test(input);
}

export function isNonEmptyString(input: unknown): input is string {
  return typeof input === 'string' && input.trim().length > 0;
}

export function isValidStepNumber(input: unknown): input is number {
  return typeof input === 'number' && Number.isInteger(input) && input >= 1 && input <= 7;
}

export function isValidUrl(input: unknown): input is string {
  if (typeof input !== 'string') return false;
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate the user-info form (Step 2).
 * Returns an empty object if everything is valid.
 */
export function validateUserForm(input: { username: unknown; awsccId: unknown }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!isValidUsername(input.username)) {
    errors.username = 'Username can only contain letters, numbers, hyphens, and underscores.';
  }
  if (!isNonEmptyString(input.awsccId)) {
    errors.awsccId = 'AWSCC ID is required.';
  }
  return errors;
}

/**
 * Validate the project-creation form.
 * `mediaUrl` is optional but, when present, must be a valid http(s) URL.
 */
export function validateProjectForm(input: {
  title: unknown;
  description: unknown;
  mediaUrl?: unknown;
}): { title?: string; description?: string; mediaUrl?: string } {
  const errors: { title?: string; description?: string; mediaUrl?: string } = {};
  if (!isNonEmptyString(input.title)) {
    errors.title = 'Title is required.';
  } else if ((input.title as string).length > 200) {
    errors.title = 'Title must be 200 characters or fewer.';
  }
  if (!isNonEmptyString(input.description)) {
    errors.description = 'Description is required.';
  }
  if (input.mediaUrl !== undefined && input.mediaUrl !== null && input.mediaUrl !== '') {
    if (!isValidUrl(input.mediaUrl)) {
      errors.mediaUrl = 'Media URL must be a valid http(s) URL.';
    }
  }
  return errors;
}

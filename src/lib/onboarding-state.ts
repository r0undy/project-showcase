/**
 * Pure onboarding state transitions (Task 16).
 *
 * Extracted from the React hook so the navigation logic can be property-tested
 * without rendering. Each function takes the current state and returns the
 * next state — no side effects, no React.
 *
 * State shape (matches `OnboardingState` in src/types/index.ts):
 *   - currentStep: 1..4 (Req 3.1)
 *   - formData: { username, awsccId } — preserved across navigation (Req 3.4)
 *   - completedSteps: Set<number> of steps marked done (Req 5.1, 5.4)
 */

import type { UserFormData } from "@/types";

export const TOTAL_STEPS = 4;
export const MIN_STEP = 1;
export const MAX_STEP = TOTAL_STEPS;

export interface OnboardingState {
  currentStep: number;
  formData: UserFormData;
  completedSteps: ReadonlySet<number>;
}

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  currentStep: 1,
  formData: { username: "", awsccId: "" },
  completedSteps: new Set<number>(),
};

/** Clamp a step number into [MIN_STEP, MAX_STEP]. */
export function clampStep(step: number): number {
  if (!Number.isInteger(step)) return MIN_STEP;
  if (step < MIN_STEP) return MIN_STEP;
  if (step > MAX_STEP) return MAX_STEP;
  return step;
}

export function nextStep(state: OnboardingState): OnboardingState {
  if (state.currentStep >= MAX_STEP) return state;
  return { ...state, currentStep: state.currentStep + 1 };
}

export function previousStep(state: OnboardingState): OnboardingState {
  if (state.currentStep <= MIN_STEP) return state;
  return { ...state, currentStep: state.currentStep - 1 };
}

/**
 * Direct navigation to any valid step. Used by the step-indicator click
 * handler (Req 3.3, 5.5 — navigation between any two steps must succeed
 * regardless of completion state).
 */
export function goToStep(
  state: OnboardingState,
  target: number,
): OnboardingState {
  const clamped = clampStep(target);
  if (clamped === state.currentStep) return state;
  return { ...state, currentStep: clamped };
}

export function setFormField<K extends keyof UserFormData>(
  state: OnboardingState,
  field: K,
  value: UserFormData[K],
): OnboardingState {
  if (state.formData[field] === value) return state;
  return { ...state, formData: { ...state.formData, [field]: value } };
}

export function markStepCompleted(
  state: OnboardingState,
  step: number,
): OnboardingState {
  const clamped = clampStep(step);
  if (state.completedSteps.has(clamped)) return state;
  const next = new Set(state.completedSteps);
  next.add(clamped);
  return { ...state, completedSteps: next };
}

export function unmarkStepCompleted(
  state: OnboardingState,
  step: number,
): OnboardingState {
  const clamped = clampStep(step);
  if (!state.completedSteps.has(clamped)) return state;
  const next = new Set(state.completedSteps);
  next.delete(clamped);
  return { ...state, completedSteps: next };
}

export function isStepCompleted(state: OnboardingState, step: number): boolean {
  return state.completedSteps.has(step);
}

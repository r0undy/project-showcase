'use client';

/**
 * useOnboardingState — React hook wrapping the pure transitions in
 * src/lib/onboarding-state.ts. The hook is just glue; all the testable
 * behavior lives in the pure module so property tests don't need to render.
 */

import { useCallback, useState } from 'react';
import type { UserFormData } from '@/types';
import {
  INITIAL_ONBOARDING_STATE,
  OnboardingState,
  goToStep as goToStepPure,
  isStepCompleted,
  markStepCompleted,
  nextStep,
  previousStep,
  setFormField,
  TOTAL_STEPS,
  unmarkStepCompleted,
} from '@/lib/onboarding-state';

export interface UseOnboardingStateResult {
  state: OnboardingState;
  totalSteps: number;
  next: () => void;
  back: () => void;
  goToStep: (step: number) => void;
  setField: <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => void;
  markCompleted: (step: number) => void;
  unmarkCompleted: (step: number) => void;
  isCompleted: (step: number) => boolean;
  reset: () => void;
}

export function useOnboardingState(
  initial: OnboardingState = INITIAL_ONBOARDING_STATE
): UseOnboardingStateResult {
  const [state, setState] = useState<OnboardingState>(initial);

  return {
    state,
    totalSteps: TOTAL_STEPS,
    next: useCallback(() => setState((s) => nextStep(s)), []),
    back: useCallback(() => setState((s) => previousStep(s)), []),
    goToStep: useCallback((step: number) => setState((s) => goToStepPure(s, step)), []),
    setField: useCallback(
      <K extends keyof UserFormData>(field: K, value: UserFormData[K]) =>
        setState((s) => setFormField(s, field, value)),
      []
    ),
    markCompleted: useCallback(
      (step: number) => setState((s) => markStepCompleted(s, step)),
      []
    ),
    unmarkCompleted: useCallback(
      (step: number) => setState((s) => unmarkStepCompleted(s, step)),
      []
    ),
    isCompleted: useCallback((step: number) => isStepCompleted(state, step), [state]),
    reset: useCallback(() => setState(initial), [initial]),
  };
}

"use client";

/**
 * Onboarding context — gives step components access to the navigation +
 * shared form data without prop-drilling through the AnimatePresence layer.
 *
 * Set up by OnboardingFlow. Consumed by step components (notably Step 2,
 * which needs `next()` to advance after the form submits successfully).
 */

import { createContext, useContext, type ReactNode } from "react";
import type { OnboardingState } from "@/lib/onboarding-state";
import type { UserFormData } from "@/types";

export interface OnboardingContextValue {
  state: OnboardingState;
  totalSteps: number;
  next: () => void;
  back: () => void;
  goToStep: (step: number) => void;
  setField: <K extends keyof UserFormData>(
    field: K,
    value: UserFormData[K],
  ) => void;
  markCompleted: (step: number) => void;
  isFormSubmitting: boolean;
  setFormSubmitting: (value: boolean) => void;
  hasExistingProfile: boolean;
  setExistingProfile: (value: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  value,
  children,
}: {
  value: OnboardingContextValue;
  children: ReactNode;
}) {
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error(
      "useOnboardingContext must be used within an OnboardingProvider (rendered by OnboardingFlow).",
    );
  }
  return ctx;
}

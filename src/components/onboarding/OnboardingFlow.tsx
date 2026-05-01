'use client';

/**
 * OnboardingFlow — the 7-step onboarding flow rendered directly on the page
 * (no card wrapper). Steps occupy the full content column; navigation sits
 * at the bottom. Pure state lives in `lib/onboarding-state.ts`.
 *
 * Transitions:
 *   - Direction-aware: forward navigation slides the new step in from the
 *     right, backward slides it in from the left. The outgoing step exits
 *     in the opposite direction.
 *   - Blur during transit (filter: blur(8px) → 0) gives a "polished glass"
 *     feel rather than a hard slide.
 *   - Each step's children (eyebrow / title / lede / content) animate with
 *     a 60ms stagger via variants context — see StepShell.
 *   - Cubic-bezier [0.16, 1, 0.3, 1] (smooth-out / expo-out) for entries;
 *     [0.4, 0, 1, 1] (ease-in) for exits.
 */

import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useId, useMemo, useState, type ComponentType } from 'react';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { StepNavigation } from './StepNavigation';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import { Step3 } from './steps/Step3';
import { Step4 } from './steps/Step4';
import { Step5 } from './steps/Step5';
import { Step6 } from './steps/Step6';
import { Step7 } from './steps/Step7';

const STEP_COMPONENTS: Record<number, ComponentType> = {
  1: Step1,
  2: Step2,
  3: Step3,
  4: Step4,
  5: Step5,
  6: Step6,
  7: Step7,
};

/* Container variants — passed `direction` (1 = forward, -1 = backward) so
 * the same component renders both directions correctly. The children
 * inherit `enter`/`center`/`exit` from this variants context (set in
 * StepShell on each piece), and we cascade them with `staggerChildren`. */
const stepContainer: Variants = {
  enter: (direction: 1 | -1) => ({
    x: 32 * direction,
    opacity: 0,
    filter: 'blur(8px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  exit: (direction: 1 | -1) => ({
    x: -32 * direction,
    opacity: 0,
    filter: 'blur(8px)',
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as const },
  }),
};

export function OnboardingFlow() {
  const onboarding = useOnboardingState();
  const { state, totalSteps, next, back, goToStep } = onboarding;
  const headingId = useId();
  const [direction, setDirection] = useState<1 | -1>(1);

  // For now any step can advance; specific steps (e.g. Step 2's form)
  // override this via their own validation in later tasks.
  const canProceed = true;

  const StepComponent = useMemo(
    () => STEP_COMPONENTS[state.currentStep] ?? Step1,
    [state.currentStep]
  );

  const handleNext = () => {
    setDirection(1);
    next();
  };
  const handleBack = () => {
    setDirection(-1);
    back();
  };
  const handleStepClick = (target: number) => {
    setDirection(target >= state.currentStep ? 1 : -1);
    goToStep(target);
  };

  return (
    <section
      role="region"
      aria-labelledby={headingId}
      className="flex w-full max-w-2xl flex-col gap-12"
    >
      <span id={headingId} className="sr-only">
        Onboarding — step {state.currentStep} of {totalSteps}
      </span>

      {/* Step viewport — fixed min-height keeps the navigation from jumping
       * as content height varies between steps. `overflow-hidden` clips the
       * incoming/outgoing slide so the page doesn't get a horizontal scroll
       * mid-transition. */}
      <div className="relative min-h-72 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={state.currentStep}
            custom={direction}
            variants={stepContainer}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      <StepNavigation
        currentStep={state.currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onBack={handleBack}
        onStepClick={handleStepClick}
        canProceed={canProceed}
        completedSteps={state.completedSteps}
      />
    </section>
  );
}

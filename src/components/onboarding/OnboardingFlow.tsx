"use client";

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

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useId, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { StepNavigation } from "./StepNavigation";
import { USER_INFO_FORM_ID } from "./UserInfoForm";
import { Step1 } from "./steps/Step1";
import { Step2 } from "./steps/Step2";
import { Step3 } from "./steps/Step3";
import { Step4 } from "./steps/Step4";

const STEP_COMPONENTS: Record<number, ComponentType> = {
  1: Step1,
  2: Step2,
  3: Step3,
  4: Step4,
};

/* Container variants — passed `direction` (1 = forward, -1 = backward) so
 * the same component renders both directions correctly. The children
 * inherit `enter`/`center`/`exit` from this variants context (set in
 * StepShell on each piece), and we cascade them with `staggerChildren`. */
const stepContainer: Variants = {
  enter: (direction: 1 | -1) => ({
    x: 32 * direction,
    opacity: 0,
    filter: "blur(8px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
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
    filter: "blur(8px)",
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as const },
  }),
};

export function OnboardingFlow() {
  const onboarding = useOnboardingState();
  const { state, totalSteps, next, back, goToStep, setField, markCompleted } =
    onboarding;
  const headingId = useId();
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isFormSubmitting, setFormSubmitting] = useState(false);
  const [hasExistingProfile, setExistingProfile] = useState(false);

  // Step 2 owns its own submit button (the UserInfoForm); the StepNavigation
  // hides Continue there to avoid two competing primary actions. Other steps
  // can always advance via Continue.
  const isFormStep = state.currentStep === 2;
  const canProceed = !isFormStep;
  const isLastStep = state.currentStep === totalSteps;

  const StepComponent = useMemo(
    () => STEP_COMPONENTS[state.currentStep] ?? Step1,
    [state.currentStep],
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
    <OnboardingProvider
      value={{
        state,
        totalSteps,
        next,
        back,
        goToStep,
        setField,
        markCompleted,
        isFormSubmitting,
        setFormSubmitting,
        hasExistingProfile,
        setExistingProfile,
      }}
    >
      <section
        role="region"
        aria-labelledby={headingId}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "46rem",
          flex: 1, // take all available vertical space from parent
          minHeight: 0, // allow inner viewport to shrink and scroll
        }}
      >
        <span id={headingId} className="sr-only">
          Onboarding — step {state.currentStep} of {totalSteps}
        </span>

        {/* Step viewport. `flex: 1` makes it eat the available height so the
         * StepNavigation below stays pinned at a constant vertical position
         * (it doesn't get pushed down by tall steps or jump up on short steps).
         * Internal vertical centering keeps short content from clinging to the
         * top of the viewport. `overflow-y: auto` lets long content scroll
         * inside the viewport instead of pushing the nav out of view.
         * `overflow-x: hidden` clips the slide-in/out animation. */}
        <div
          className="hide-scrollbar"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "clamp(1.25rem, 3vw, 2rem)",
            position: "relative",
          }}
        >
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

        {/* StepNavigation — never grows, never shrinks; always at the bottom of
         * the section. */}
        <div
          style={{ flexShrink: 0, marginTop: "clamp(1.25rem, 2.5vw, 1.75rem)" }}
        >
          <StepNavigation
            currentStep={state.currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onBack={handleBack}
            onStepClick={handleStepClick}
            canProceed={canProceed}
            completedSteps={state.completedSteps}
            hideNext={isFormStep}
            primaryAction={
              isLastStep ? (
                <Link
                  href="/deploy-to-aws"
                  className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{
                    paddingInline: "2rem",
                    height: "2.5rem",
                    boxShadow:
                      "0 0 24px -4px color-mix(in oklab, var(--glow-magenta) 60%, transparent)",
                  }}
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  Go to deploy steps
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ) : isFormStep ? (
                <motion.button
                  type={hasExistingProfile ? "button" : "submit"}
                  form={hasExistingProfile ? undefined : USER_INFO_FORM_ID}
                  onClick={hasExistingProfile ? handleNext : undefined}
                  disabled={isFormSubmitting}
                  whileHover={!isFormSubmitting ? { scale: 1.03 } : undefined}
                  whileTap={!isFormSubmitting ? { scale: 0.97 } : undefined}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  style={{
                    paddingInline: "2rem",
                    height: "2.5rem",
                    boxShadow:
                      "0 0 24px -4px color-mix(in oklab, var(--glow-magenta) 60%, transparent)",
                    opacity: isFormSubmitting ? 0.7 : 1,
                    cursor: isFormSubmitting ? "wait" : "pointer",
                  }}
                  className="inline-flex items-center rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {isFormSubmitting ? (
                    <span
                      aria-hidden="true"
                      style={{
                        width: "0.875rem",
                        height: "0.875rem",
                        borderRadius: "50%",
                        border:
                          "2px solid color-mix(in oklab, var(--primary-foreground) 40%, transparent)",
                        borderTopColor: "var(--primary-foreground)",
                        animation: "cosmic-spin 0.7s linear infinite",
                      }}
                    />
                  ) : null}
                  {isFormSubmitting
                    ? "Creating profile…"
                    : hasExistingProfile
                      ? "Continue"
                      : "Create profile"}
                </motion.button>
              ) : undefined
            }
          />
        </div>
      </section>
    </OnboardingProvider>
  );
}

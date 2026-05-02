"use client";

/**
 * StepNavigation — Next/Back buttons + clickable step indicator.
 *
 * Implements Req 3.2 (Next/Continue), 3.3 (Back), 3.5 (indicator), 5.5
 * (any-to-any navigation regardless of completion).
 *
 * Animation polish:
 *   - The whole nav fades in with a slight upward drift on first mount,
 *     deliberately slower than the step content so the eye lands on the
 *     copy first then notices the controls.
 *   - The active dot smoothly animates size + color + glow when the
 *     current step changes (no jump-cut).
 *   - Buttons use spring whileHover / whileTap for a tactile feel.
 */

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onStepClick: (step: number) => void;
  /** Disables Next when the current step has unsubmitted required input. */
  canProceed: boolean;
  /** Steps the user has marked done — used to color the dots. */
  completedSteps: ReadonlySet<number>;
  /** Override label on the Next button (e.g. "Continue", "Submit", "Finish"). */
  nextLabel?: string;
  /** Hide the Next button entirely (e.g. on Step 2 where the form provides
   *  its own submit button). The Back button + indicator still render. */
  hideNext?: boolean;
  /** Optional custom primary action (e.g. submit button). */
  primaryAction?: ReactNode;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export function StepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onStepClick,
  canProceed,
  completedSteps,
  nextLabel,
  hideNext = false,
  primaryAction,
}: StepNavigationProps) {
  const isFirst = currentStep <= 1;
  const isLast = currentStep >= totalSteps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: easeOut }}
      className="flex flex-col gap-6"
    >
      {/* Step indicator (Req 3.5) — text label + clickable dots */}
      <div className="flex flex-col items-center gap-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentStep}
            aria-live="polite"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="font-display text-[10px] tracking-[0.22em] text-muted-foreground"
          >
            STEP {currentStep} OF {totalSteps}
          </motion.span>
        </AnimatePresence>

        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Onboarding steps"
        >
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
            const isActive = step === currentStep;
            const isDone = completedSteps.has(step);
            return (
              <button
                key={step}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to step ${step}${isDone ? " (completed)" : ""}`}
                onClick={() => onStepClick(step)}
                className="relative flex size-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <motion.span
                  className="block rounded-full"
                  animate={{
                    width: isActive ? 14 : 8,
                    height: isActive ? 14 : 8,
                    backgroundColor: isActive
                      ? "var(--primary)"
                      : isDone
                        ? "color-mix(in oklab, var(--accent) 80%, transparent)"
                        : "color-mix(in oklab, var(--muted-foreground) 50%, transparent)",
                    boxShadow: isActive
                      ? "0 0 14px color-mix(in oklab, var(--glow-magenta) 70%, transparent)"
                      : "0 0 0 0 transparent",
                  }}
                  transition={{ duration: 0.35, ease: easeOut }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Next / Back buttons (Req 3.2, 3.3) */}
      <div className="flex items-center justify-between gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          whileHover={!isFirst ? { scale: 1.03 } : undefined}
          whileTap={!isFirst ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          style={{ paddingInline: "1.5rem", height: "2.5rem" }}
          className="inline-flex items-center rounded-full border border-border bg-card/40 text-sm font-medium text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40"
        >
          Back
        </motion.button>

        {primaryAction ??
          (!hideNext && (
            <motion.button
              type="button"
              onClick={onNext}
              disabled={!canProceed || isLast}
              whileHover={canProceed && !isLast ? { scale: 1.03 } : undefined}
              whileTap={canProceed && !isLast ? { scale: 0.97 } : undefined}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              style={{
                paddingInline: "2rem",
                height: "2.5rem",
                boxShadow:
                  canProceed && !isLast
                    ? "0 0 24px -4px color-mix(in oklab, var(--glow-magenta) 60%, transparent)"
                    : undefined,
              }}
              className="inline-flex items-center rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40"
            >
              {nextLabel ?? (isLast ? "Finish" : "Continue")}
            </motion.button>
          ))}
      </div>
    </motion.div>
  );
}

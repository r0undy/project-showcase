/**
 * Unit tests — OnboardingFlow navigation (Task 16.6).
 *
 * Drives the flow through clicks and asserts the visible step indicator
 * follows. Animations run via AnimatePresence; jsdom doesn't paint, but the
 * rendered DOM updates synchronously enough for these checks.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

/**
 * Wait for the indicator to display *exactly* `step`. The indicator is
 * inside an AnimatePresence (fade between values), so during a transition
 * the old and new can briefly coexist; `findByText` with a step-specific
 * regex only resolves once the new indicator is in the DOM.
 */
async function findStepIndicator(step: number): Promise<HTMLElement> {
  return await screen.findByText(new RegExp(`^STEP\\s+${step}\\s+OF\\s+7$`, 'i'));
}

describe('<OnboardingFlow />', () => {
  it('opens on step 1 with the correct indicator and total', async () => {
    render(<OnboardingFlow />);
    expect(await findStepIndicator(1)).toBeInTheDocument();
  });

  it('Continue advances steps; the indicator updates each time', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    // Each click is on "Continue" (the button label only flips to "Finish"
    // once we've reached step 7, at which point the button is also disabled).
    for (let target = 2; target <= 7; target++) {
      await user.click(screen.getByRole('button', { name: /continue/i }));
      expect(await findStepIndicator(target)).toBeInTheDocument();
    }
    // After reaching step 7 the button label is "Finish" and disabled.
    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled();
  });

  it('Back returns to the previous step', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(await findStepIndicator(2)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(await findStepIndicator(1)).toBeInTheDocument();
  });

  it('clicking a step indicator dot jumps to that step', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(7);
    await user.click(tabs[4]); // step 5
    expect(await findStepIndicator(5)).toBeInTheDocument();
  });

  it('the Back button is disabled on step 1', () => {
    render(<OnboardingFlow />);
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('the Next button label is "Finish" on the last step and disabled', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);
    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[6]);
    const finish = await screen.findByRole('button', { name: /finish/i });
    expect(finish).toBeDisabled();
  });

  it('exposes a labeled region for screen readers', () => {
    render(<OnboardingFlow />);
    expect(screen.getByRole('region', { name: /onboarding/i })).toBeInTheDocument();
  });
});

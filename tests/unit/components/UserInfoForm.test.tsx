/**
 * Unit tests — UserInfoForm (Task 18.3).
 *
 * Drives the form via real keyboard / click events. Submission is
 * exercised through the `submit` prop override so we don't need to mock
 * the Supabase client or `fetch` — the override is the same boundary the
 * real submit hits in production.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserInfoForm } from "@/components/onboarding/UserInfoForm";
import {
  OnboardingProvider,
  type OnboardingContextValue,
} from "@/lib/onboarding-context";
import { INITIAL_ONBOARDING_STATE } from "@/lib/onboarding-state";
import type { UserFormData } from "@/types";

interface RenderOpts {
  submit?: jest.MockedFunction<(values: UserFormData) => Promise<void>>;
  next?: jest.Mock;
  setField?: jest.Mock;
}

function renderForm(opts: RenderOpts = {}) {
  const next = opts.next ?? jest.fn();
  const setField = opts.setField ?? jest.fn();
  const ctx: OnboardingContextValue = {
    state: INITIAL_ONBOARDING_STATE,
    totalSteps: 4,
    next,
    back: jest.fn(),
    goToStep: jest.fn(),
    setField,
    markCompleted: jest.fn(),
    isFormSubmitting: false,
    setFormSubmitting: jest.fn(),
    hasExistingProfile: false,
    setExistingProfile: jest.fn(),
  };
  return {
    ...render(
      <OnboardingProvider value={ctx}>
        <UserInfoForm submit={opts.submit} />
      </OnboardingProvider>,
    ),
    next,
    setField,
  };
}

describe("<UserInfoForm />", () => {
  it("renders both fields with helper text and a submit button", () => {
    renderForm();
    expect(screen.getByLabelText(/avatar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/awscc id/i)).toBeInTheDocument();
    expect(screen.getByText(/letters, numbers, hyphens/i)).toBeInTheDocument();
    expect(screen.getByText(/if you have one/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create profile/i }),
    ).toBeInTheDocument();
  });

  it("shows inline error for an invalid username after the user blurs the field", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(/username/i);
    await user.type(input, "has spaces!");
    await user.tab(); // blur
    expect(
      await screen.findByText(/username can only contain letters, numbers/i),
    ).toBeInTheDocument();
  });

  it("does NOT show errors before the user touches the field", () => {
    renderForm();
    expect(screen.queryByText(/username can only contain letters/i)).toBeNull();
    expect(screen.queryByText(/awscc id/i)).toBeNull();
  });

  it("reveals all errors after a submit attempt with empty fields", async () => {
    const user = userEvent.setup();
    const submit = jest.fn();
    renderForm({ submit });
    await user.click(screen.getByRole("button", { name: /create profile/i }));
    expect(submit).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/username can only contain letters/i),
    ).toBeInTheDocument();
  });

  it("calls submit + next + setField with valid input", async () => {
    const user = userEvent.setup();
    const submit = jest.fn().mockResolvedValue(undefined);
    const { next, setField } = renderForm({ submit });

    await user.type(screen.getByLabelText(/username/i), "cosmic_dev-1");
    await user.type(screen.getByLabelText(/awscc id/i), "AWSCC-PUP-42");
    await user.click(screen.getByRole("button", { name: /create profile/i }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({
      username: "cosmic_dev-1",
      awsccId: "AWSCC-PUP-42",
    });
    expect(setField).toHaveBeenCalledWith("username", "cosmic_dev-1");
    expect(setField).toHaveBeenCalledWith("awsccId", "AWSCC-PUP-42");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state while submit is pending", async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    const submit = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    renderForm({ submit });

    await user.type(screen.getByLabelText(/username/i), "valid_user");
    await user.type(screen.getByLabelText(/awscc id/i), "AWSCC-1");
    await user.click(screen.getByRole("button", { name: /create profile/i }));

    expect(
      await screen.findByRole("button", { name: /creating profile/i }),
    ).toBeDisabled();

    // Release the pending promise and let the test exit cleanly.
    release();
  });

  it("surfaces a submit error message when the submit function rejects", async () => {
    const user = userEvent.setup();
    const submit = jest
      .fn()
      .mockRejectedValue(
        new Error("That username is already taken. Try another."),
      );
    const { next } = renderForm({ submit });

    await user.type(screen.getByLabelText(/username/i), "taken_name");
    await user.type(screen.getByLabelText(/awscc id/i), "AWSCC-1");
    await user.click(screen.getByRole("button", { name: /create profile/i }));

    expect(
      await screen.findByText(/that username is already taken/i),
    ).toBeInTheDocument();
    expect(next).not.toHaveBeenCalled();
  });
});

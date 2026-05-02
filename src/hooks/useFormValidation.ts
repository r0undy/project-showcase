'use client';

/**
 * useFormValidation — generic controlled-form helper (Req 4.2, 4.3, 8.3, 18.2).
 *
 * Holds the form values, runs a caller-supplied `validate` function, and
 * exposes touched state so errors only show after the user has interacted
 * with a field (Property 18 / Req 18.2 — inline display).
 *
 * Intentionally tiny — we don't pull in react-hook-form for a 7-step modal
 * and a 3-field project form. If complexity grows, consider migrating.
 */

import { useCallback, useMemo, useState } from 'react';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface UseFormValidationResult<T extends object> {
  values: T;
  errors: FormErrors<T>;
  /** Errors visible to the UI (only for fields the user has touched, or after submit). */
  visibleErrors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  /** True after submit has been attempted; visibleErrors then includes all errors. */
  submitted: boolean;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setTouched: <K extends keyof T>(key: K, touched?: boolean) => void;
  /** Mark the form as submitted so all errors become visible; returns true iff valid. */
  markSubmitted: () => boolean;
  reset: (next?: Partial<T>) => void;
}

export function useFormValidation<T extends object>(
  initialValues: T,
  validate: (values: T) => FormErrors<T>
): UseFormValidationResult<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validate(values), [values, validate]);
  const isValid = Object.keys(errors).length === 0;

  const visibleErrors = useMemo<FormErrors<T>>(() => {
    if (submitted) return errors;
    const result: FormErrors<T> = {};
    for (const key of Object.keys(errors) as Array<keyof T>) {
      if (touched[key]) result[key] = errors[key];
    }
    return result;
  }, [errors, touched, submitted]);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setValues = useCallback((next: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...next }));
  }, []);

  const setTouched = useCallback(<K extends keyof T>(key: K, t: boolean = true) => {
    setTouchedState((prev) => ({ ...prev, [key]: t }));
  }, []);

  const markSubmitted = useCallback(() => {
    setSubmitted(true);
    return Object.keys(validate(values)).length === 0;
  }, [validate, values]);

  const reset = useCallback(
    (next?: Partial<T>) => {
      setValuesState({ ...initialValues, ...(next ?? {}) });
      setTouchedState({});
      setSubmitted(false);
    },
    [initialValues]
  );

  return {
    values,
    errors,
    visibleErrors,
    touched,
    isValid,
    submitted,
    setValue,
    setValues,
    setTouched,
    markSubmitted,
    reset,
  };
}

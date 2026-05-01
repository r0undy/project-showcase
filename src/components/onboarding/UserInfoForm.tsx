"use client";

/**
 * UserInfoForm — Step 2 of onboarding (Task 18.1).
 *
 * Submission flow (per design.md Note 5):
 *   1. Validate locally (`validateUserForm` from src/lib/validation.ts).
 *   2. Sign in anonymously via `supabase.auth.signInAnonymously()` —
 *      Supabase auto-persists the session in localStorage.
 *   3. POST /api/users with the bearer token from that session. The Route
 *      Handler inserts a `public.users` row with `id = auth.uid()`.
 *   4. On success: store the username/awsccId (optional) in onboarding state and
 *      advance to step 3 via `next()`.
 *   5. On failure: surface a friendly error inline. If the failure happened
 *      AFTER we minted an anonymous auth user, sign that user out so we
 *      don't leak orphaned auth.users rows on retries.
 *
 * Validation:
 *   - Username: alphanumeric, hyphens, underscores only (Property 5).
 *   - AWSCC ID: optional.
 *   Errors display inline (Property 18) once a field is touched OR after
 *   the user has attempted to submit.
 */

import { motion } from "motion/react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useOnboardingContext } from "@/lib/onboarding-context";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { validateUserForm } from "@/lib/validation";
import type { CreateUserResponse, ErrorResponse, UserFormData } from "@/types";

interface UserInfoFormProps {
  /**
   * Optional override for tests so we can drive the network calls
   * deterministically without mocking the supabase singleton.
   */
  submit?: (values: UserFormData) => Promise<void>;
  /** Hide the internal submit button (used when the nav renders it). */
  showSubmit?: boolean;
}

export const USER_INFO_FORM_ID = "user-info-form";

const itemVariants = {
  enter: { y: 14, opacity: 0, filter: "blur(4px)" },
  center: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { y: -8, opacity: 0, filter: "blur(4px)" },
};

export function UserInfoForm({
  submit,
  showSubmit = true,
}: UserInfoFormProps = {}) {
  const {
    state,
    next,
    setField,
    setFormSubmitting,
    setExistingProfile,
    hasExistingProfile,
  } = useOnboardingContext();
  const usernameId = useId();
  const awsccIdId = useId();
  const avatarId = useId();
  const avatarHelpId = useId();
  const avatarErrorId = useId();
  const formErrId = useId();
  const defaultAvatarUrl = "/avatars/default-avatar.svg";
  const maxAvatarBytes = 2 * 1024 * 1024;

  const form = useFormValidation<UserFormData>(state.formData, (values) =>
    validateUserForm({
      username: values.username,
      awsccId: values.awsccId,
      avatarUrl: values.avatarUrl,
    }),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(defaultAvatarUrl);
  const [hasProfileAvatar, setHasProfileAvatar] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    const hasLocalProfile =
      typeof window !== "undefined" &&
      window.localStorage.getItem("awscc_user_created") === "true";

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const session = data.session;
        if (session || hasLocalProfile) {
          setExistingProfile(true);
        }
        if (session?.user?.id) {
          try {
            const res = await fetch(`/api/users/${session.user.id}`, {
              headers: { authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
              const body = (await res.json()) as {
                user?: {
                  avatarUrl?: string;
                  username?: string;
                  awsccId?: string;
                };
              };
              if (body.user?.username) {
                form.setValues({
                  username: body.user.username,
                  awsccId: body.user.awsccId ?? "",
                });
                setField("username", body.user.username);
                setField("awsccId", body.user.awsccId ?? "");
              }
              if (body.user?.avatarUrl) {
                setAvatarPreviewUrl(body.user.avatarUrl);
                setHasProfileAvatar(true);
              }
            }
          } catch {
            // Ignore profile fetch errors; default avatar stays.
          }
        }
      })
      .catch(() => {
        if (hasLocalProfile) setExistingProfile(true);
      });
  }, [setExistingProfile]);

  useEffect(() => {
    if (!avatarFile) {
      if (!hasProfileAvatar) {
        setAvatarPreviewUrl(defaultAvatarUrl);
      }
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile, defaultAvatarUrl, hasProfileAvatar]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.markSubmitted()) return; // shows all visibleErrors

    setIsSubmitting(true);
    setFormSubmitting(true);
    try {
      let uploadedAvatarUrl: string | null = null;
      if (submit) {
        await submit(form.values);
      } else {
        uploadedAvatarUrl = await defaultSubmit(
          form.values,
          avatarFile,
          defaultAvatarUrl,
        );
      }
      // Mirror form values into onboarding context state
      setField("username", form.values.username);
      setField("awsccId", form.values.awsccId ?? "");
      if (uploadedAvatarUrl) {
        setField("avatarUrl", uploadedAvatarUrl);
      }
      try {
        window.localStorage.setItem("awscc_user_created", "true");
      } catch {
        // Ignore storage errors (private mode, etc.).
      }
      setExistingProfile(true);
      next();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
      setFormSubmitting(false);
    }
  };

  return (
    <motion.form
      variants={itemVariants}
      id={USER_INFO_FORM_ID}
      onSubmit={onSubmit}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: "clamp(0.75rem, 2.5vw, 1.25rem)",
        }}
      >
        <div
          style={{
            flex: "1 1 0%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <label
            htmlFor={avatarId}
            style={{ fontSize: "0.6875rem", letterSpacing: "0.18em" }}
            className="font-display uppercase text-foreground"
          >
            Avatar (optional)
          </label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem",
              borderRadius: "0.875rem",
              background: "color-mix(in oklab, var(--card) 70%, transparent)",
              border:
                "1px solid color-mix(in oklab, var(--border) 90%, transparent)",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "5.25rem",
                height: "5.25rem",
              }}
            >
              <label
                htmlFor={avatarId}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  background:
                    "color-mix(in oklab, var(--muted) 35%, transparent)",
                  border:
                    "1px solid color-mix(in oklab, var(--border) 80%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  position: "relative",
                }}
              >
                {isAvatarLoading ? (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(120deg, color-mix(in oklab, var(--muted) 40%, transparent), color-mix(in oklab, var(--muted) 15%, transparent), color-mix(in oklab, var(--muted) 40%, transparent))",
                      backgroundSize: "200% 100%",
                      animation: "avatar-skeleton 1.2s ease-in-out infinite",
                    }}
                  />
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreviewUrl}
                  alt="Selected avatar preview"
                  onLoad={() => setIsAvatarLoading(false)}
                  onError={() => setIsAvatarLoading(false)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: isAvatarLoading ? 0 : 1,
                    transition: "opacity 200ms ease",
                  }}
                />
              </label>
              <label
                htmlFor={avatarId}
                style={{
                  position: "absolute",
                  bottom: "-0.35rem",
                  right: "-0.35rem",
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "9999px",
                  background:
                    "linear-gradient(to right, var(--primary), var(--accent))",
                  color: "var(--primary-foreground)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  boxShadow:
                    "0 0 0 1px color-mix(in oklab, var(--glow-magenta) 40%, transparent), 0 10px 20px -10px color-mix(in oklab, var(--glow-magenta) 60%, transparent)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                +
              </label>
            </div>
            <input
              id={avatarId}
              type="file"
              accept="image/*"
              aria-invalid={Boolean(avatarError)}
              aria-describedby={avatarError ? avatarErrorId : avatarHelpId}
              disabled={isSubmitting}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (!file) {
                  setAvatarFile(null);
                  setAvatarError(null);
                  return;
                }
                if (!file.type.startsWith("image/")) {
                  setAvatarFile(null);
                  setAvatarError(
                    "Please choose an image file (PNG, JPG, or SVG).",
                  );
                  return;
                }
                if (file.size > maxAvatarBytes) {
                  setAvatarFile(null);
                  setAvatarError("Avatar must be 2MB or smaller.");
                  return;
                }
                setAvatarError(null);
                setIsAvatarLoading(true);
                setAvatarFile(file);
              }}
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            />
            {avatarError ? (
              <span
                id={avatarErrorId}
                role="alert"
                style={{ fontSize: "0.75rem", lineHeight: 1.4 }}
                className="text-(--destructive)"
              >
                {avatarError}
              </span>
            ) : (
              <span
                id={avatarHelpId}
                style={{ fontSize: "0.75rem", lineHeight: 1.4 }}
                className="text-muted-foreground/80"
              >
                Tap + to upload (2MB max).
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            flex: "1 1 0%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <FormRow
            id={usernameId}
            label="Username"
            helper="Letters, numbers, hyphens, underscores."
            value={form.values.username}
            onChange={(v) => form.setValue("username", v)}
            onBlur={() => form.setTouched("username", true)}
            error={form.visibleErrors.username}
            autoComplete="off"
            spellCheck={false}
            maxLength={64}
            disabled={isSubmitting || hasExistingProfile}
          />

          <FormRow
            id={awsccIdId}
            label="AWSCC ID (optional)"
            helper="If you have one, drop it here."
            value={form.values.awsccId ?? ""}
            onChange={(v) => form.setValue("awsccId", v)}
            onBlur={() => form.setTouched("awsccId", true)}
            error={form.visibleErrors.awsccId}
            autoComplete="off"
            maxLength={64}
            disabled={isSubmitting || hasExistingProfile}
          />
        </div>
      </div>

      {submitError && (
        <div
          id={formErrId}
          role="alert"
          style={{
            padding: "0.625rem 0.875rem",
            borderRadius: "0.5rem",
            fontSize: "0.8125rem",
            lineHeight: 1.4,
            background:
              "color-mix(in oklab, var(--destructive) 15%, transparent)",
            color: "color-mix(in oklab, var(--destructive) 90%, white 0%)",
            border:
              "1px solid color-mix(in oklab, var(--destructive) 35%, transparent)",
          }}
        >
          {submitError}
        </div>
      )}

      {showSubmit && (
        <div
          style={{
            marginTop: "0.5rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.02 } : undefined}
            whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
              paddingInline: "1.75rem",
              height: "2.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "9999px",
              background:
                "linear-gradient(to right, var(--primary), var(--accent))",
              color: "var(--primary-foreground)",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow:
                "0 0 0 1px color-mix(in oklab, var(--glow-magenta) 40%, transparent), 0 12px 28px -8px color-mix(in oklab, var(--glow-magenta) 60%, transparent)",
              opacity: isSubmitting ? 0.65 : 1,
              cursor: isSubmitting ? "wait" : "pointer",
            }}
            aria-describedby={submitError ? formErrId : undefined}
          >
            {isSubmitting ? <Spinner /> : null}
            {isSubmitting ? "Creating profile…" : "Create profile"}
          </motion.button>
        </div>
      )}
    </motion.form>
  );
}

function FormRow({
  id,
  label,
  helper,
  value,
  onChange,
  onBlur,
  error,
  ...inputProps
}: {
  id: string;
  label: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur"
>) {
  const errorId = `${id}-err`;
  const helperId = `${id}-help`;

  return (
    <label
      htmlFor={id}
      style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
    >
      <span
        style={{ fontSize: "0.6875rem", letterSpacing: "0.18em" }}
        className="font-display uppercase text-foreground"
      >
        {label}
      </span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helper ? helperId : undefined}
        style={{
          height: "2.5rem",
          paddingInline: "0.875rem",
          borderRadius: "0.5rem",
          background: "color-mix(in oklab, var(--input) 80%, transparent)",
          border: error
            ? "1px solid color-mix(in oklab, var(--destructive) 60%, transparent)"
            : "1px solid color-mix(in oklab, var(--border) 90%, transparent)",
          color: "var(--foreground)",
          fontSize: "0.875rem",
          outline: "none",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 3px color-mix(in oklab, var(--destructive) 25%, transparent)"
            : "0 0 0 3px color-mix(in oklab, var(--ring) 30%, transparent)";
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.boxShadow = "none";
          onBlur?.();
        }}
        {...inputProps}
      />
      {error ? (
        <span
          id={errorId}
          role="alert"
          style={{ fontSize: "0.75rem", lineHeight: 1.4 }}
          className="text-(--destructive)"
        >
          {error}
        </span>
      ) : helper ? (
        <span
          id={helperId}
          style={{ fontSize: "0.75rem", lineHeight: 1.4 }}
          className="text-muted-foreground/80"
        >
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function Spinner() {
  return (
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
  );
}

/**
 * Real submit: anonymous Supabase sign-in → POST /api/users.
 * On any failure after the sign-in, sign the anonymous user out so we don't
 * leak orphaned auth.users rows on retry.
 */
async function defaultSubmit(
  values: UserFormData,
  avatarFile: File | null,
  defaultAvatarUrl: string,
): Promise<string | null> {
  const supabase = getBrowserSupabaseClient();

  // 1. Anonymous sign-in (Supabase persists the session in localStorage).
  const { data: signInData, error: signInError } =
    await supabase.auth.signInAnonymously();
  if (signInError || !signInData.session) {
    throw new Error(
      signInError?.message ?? "Could not start an anonymous session.",
    );
  }
  const accessToken = signInData.session.access_token;

  // 2. Upload avatar to Supabase Storage.
  let publicAvatarUrl: string | null = null;
  try {
    const fileToUpload = await resolveAvatarFile(avatarFile, defaultAvatarUrl);
    const extension = resolveAvatarExtension(fileToUpload);
    const filePath = `users/${signInData.session.user.id}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, fileToUpload, {
        upsert: true,
        contentType: fileToUpload.type || "image/png",
        cacheControl: "3600",
      });
    if (uploadError) {
      throw new Error(uploadError.message || "Could not upload avatar.");
    }

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    publicAvatarUrl = publicData.publicUrl;
  } catch (err) {
    await supabase.auth.signOut().catch(() => undefined);
    throw err instanceof Error ? err : new Error("Avatar upload failed.");
  }

  // 3. POST /api/users with the bearer token.
  let res: Response;
  try {
    res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        username: values.username,
        awsccId: values.awsccId?.trim() || undefined,
        avatarUrl: publicAvatarUrl ?? undefined,
      }),
    });
  } catch (err) {
    await supabase.auth.signOut().catch(() => undefined);
    throw err instanceof Error ? err : new Error("Network error.");
  }

  if (!res.ok) {
    let message = "Could not create your profile.";
    try {
      const body = (await res.json()) as ErrorResponse;
      if (res.status === 409) {
        message =
          body.message?.toLowerCase().includes("username") === true
            ? "That username is already taken. Try another."
            : (body.message ?? message);
      } else if (res.status === 400) {
        message =
          body.message ??
          "Some fields look invalid. Double-check and try again.";
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // body wasn't JSON; keep the default message
    }
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error(message);
  }

  // Success — server returned 201 with `user`. We don't need to use it here:
  // the form's caller advances the step, and on subsequent requests the
  // Supabase client uses the session it persisted to localStorage.
  await res.json().catch(() => undefined as unknown as CreateUserResponse);
  return publicAvatarUrl;
}

async function resolveAvatarFile(
  avatarFile: File | null,
  defaultAvatarUrl: string,
): Promise<File> {
  if (avatarFile) return avatarFile;

  const res = await fetch(defaultAvatarUrl);
  if (!res.ok) {
    throw new Error("Could not load the default avatar.");
  }
  const blob = await res.blob();
  const contentType = blob.type || "image/svg+xml";
  return new File([blob], "default-avatar.svg", { type: contentType });
}

function resolveAvatarExtension(file: File): string {
  const type = file.type.toLowerCase();
  if (type.includes("svg")) return "svg";
  if (type.includes("jpeg")) return "jpg";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return "png";
}

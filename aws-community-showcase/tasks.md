# Implementation Plan: AWS Community Showcase

## Overview

This implementation plan breaks down the AWS Community Showcase feature into discrete, actionable coding tasks. The feature is a fullstack Next.js 15+ application with TypeScript, Supabase database, and a Linear.app-inspired UI. The implementation follows a bottom-up approach: database setup → API routes → UI components → integration → testing.

**Technology Stack:**

- Next.js 15+ with App Router
- TypeScript 5.0+
- Supabase (PostgreSQL + Auth)
- Tailwind CSS 4.0+
- MagicUI components
- Framer Motion animations

**Key Implementation Areas:**

1. Database schema (4 tables with triggers and RLS)
2. API Routes (6 Next.js Route Handlers)
3. Authentication (Supabase Auth integration)
4. Landing page with countdown timer
5. Onboarding modal (4 steps)
6. Showcase page (project grid, reactions, submissions)
7. Responsive design and animations
8. Comprehensive testing (property-based, unit, integration, E2E)

## Tasks

- [x] 1. Project setup and configuration
  - [x] Initialize Next.js 15+ project with TypeScript and App Router (Next.js 16.2.4)
  - [x] Configure Tailwind CSS 4.0+ with custom theme (v4 with `@theme inline` in `src/app/globals.css`)
  - [x] Install and configure dependencies — Supabase client (`@supabase/supabase-js@^2.105.1`), Framer Motion (`framer-motion@^12.38.0`) + `motion@^12.38.0`, MagicUI (installed via shadcn CLI, see decision log)
  - [x] Set up TypeScript strict mode and path aliases (`@/*` → `./src/*`)
  - [x] Create environment variable configuration file (`.env.local`, `.env.example`) — verified linked to Supabase project `bkffopfnejyotqmhhgzu` (from-vibe-to-live)
  - _Requirements: 20.1, 20.3, 20.4, 20.5, 20.6, 20.7_
  - _Status: Verified by `npm run build` passing._

- [x] 2. Supabase database schema setup
  - [x] 2.1 Create Users table with UUID primary key, unique username constraint, and timestamps
    - Write SQL migration for Users table
    - Add indexes on username and created_at
    - Create trigger function for auto-updating updated_at timestamp
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 2.2 Create Projects table with foreign key to Users and cascade delete
    - Write SQL migration for Projects table
    - Add indexes on author_id and created_at
    - Create trigger for auto-updating updated_at timestamp
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 2.3 Create Reactions table with unique constraint on user_id + project_id
    - Write SQL migration for Reactions table
    - Add indexes on project_id, user_id, and composite unique index
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 2.4 Create Onboarding_Progress table with step tracking and completion timestamps
    - Write SQL migration for Onboarding_Progress table
    - Add unique constraint on user_id + step_number
    - Create trigger function to auto-set completed_at when is_completed changes to true
    - Add check constraint for step_number (1-7)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 2.5 Write property test for completion timestamp automation
    - **Property 14: Completion timestamp automation**
    - **Validates: Requirements 14.5**
    - _Status: Verified — 100 iterations passing in ~40s. Tolerance widened from 1s to 60s in [tests/properties/progress.property.test.ts](../tests/properties/progress.property.test.ts) to absorb ~9s clock skew between local machine and the Supabase Postgres server. Two negative-case tests (true→true, false→false) also pass._

    - [x] 2.6 Apply migrations to remote Supabase
      - Migrations 001–004 (and 005 from Task 3) pushed to `bkffopfnejyotqmhhgzu` via `supabase db push --include-all` on 2026-05-01.
      - CLI is linked to the project (`supabase/config.toml` exists; project ref stored in `.env.local`).

- [x] 3. Supabase authentication and Row Level Security (RLS)
  - [x] **Enable anonymous sign-ins** — confirmed ON in Dashboard → Authentication → Providers → "Anonymous Sign-Ins" on 2026-05-01. Anonymous users will inherit the `authenticated` role, so all existing RLS policies (which gate writes via `auth.uid() = ...`) apply correctly.
  - [x] Create RLS policies for Users table (users can read all, insert own, update own) — applied via `005_enable_rls_and_policies.sql`
  - [x] Create RLS policies for Projects table (all can read, authenticated can insert, authors can update/delete) — applied via `005_enable_rls_and_policies.sql`
  - [x] Create RLS policies for Reactions table (all can read, authenticated can insert own, users can delete own) — applied via `005_enable_rls_and_policies.sql`
  - [x] Create RLS policies for Onboarding_Progress table (users can only access their own records) — applied via `005_enable_rls_and_policies.sql`
  - _Requirements: 19.1, 19.2, 19.5_

- [x] 4. Core TypeScript types and interfaces
  - [x] Data model interfaces (`User`, `Project`, `ProjectWithAuthor`, `Reaction`, `OnboardingProgress`) in [src/types/index.ts](../src/types/index.ts). `User.id` documented as equal to `auth.uid()` (per anonymous-auth decision).
  - [x] API request/response types (`CreateUserRequest/Response`, `GetUserResponse`, `CreateProjectRequest/Response`, `GetProjectsResponse`, `CreateReactionRequest/Response`, `UpdateProgressRequest/Response`). `CreateUserResponse.sessionToken` removed — session is client-managed via `signInAnonymously()`.
  - [x] Component prop types for every component referenced in [design.md](design.md) (countdown, CTA, modal, navigation, form, accordion, project grid/card, reaction button).
  - [x] Error response type (`ErrorResponse` with `error`, `message`, optional `details`).
  - [x] Shared types directory at [src/types/](../src/types/).
  - _Requirements: 20.4_
  - _Status: Verified by `npm run build` (TypeScript compiles clean)._

- [x] 5. Supabase client configuration and utilities
  - [x] Browser client — `getBrowserSupabaseClient()` (singleton, `persistSession: true`, `localStorage`) in [src/lib/supabase.ts](../src/lib/supabase.ts). Backwards-compatible `supabase` const export retained.
  - [x] Per-request server client — `createServerSupabaseClient(accessToken?)` factory; forwards `Authorization: Bearer <token>` so PostgREST sees the right `auth.uid()` for RLS.
  - [x] Admin client — `createAdminSupabaseClient()` (service role, bypasses RLS). `supabaseAdmin` alias retained.
  - [x] All clients are type-parameterized with `<Database>` for end-to-end type safety on queries.
  - [x] Auth middleware — [src/lib/auth.ts](../src/lib/auth.ts) exports `getBearerToken(request)`, `getSession(request)` (validates token via `supabase.auth.getUser`), `requireAuth(request)` (returns `{ session }` or `{ response: 401 }`), and `errorResponse(status, error, message, details?)` for consistent error shape (Req 10.8 / Property 13).
  - _Requirements: 19.1, 19.5, 20.3_
  - _Status: Verified by `npm run build`. Property 14 test still passes after refactor (type-only import from `@/lib/supabase` still works)._

- [x] 6. Implement API Route: POST /api/users
  - [x] 6.1 Created in [src/app/api/users/route.ts](../src/app/api/users/route.ts). Anonymous-session precondition; `requireAuth` middleware extracts `auth.uid()`; `validateUserForm` enforces username pattern + non-empty awsccId; insert sets `id = auth.uid()`; 23505 mapped to 409 (username vs PK collision distinguished); error shape consistent.
  - [x] 6.2 Property 5 (username validation pattern) — [tests/properties/validation.property.test.ts](../tests/properties/validation.property.test.ts). 3 sub-properties (iff pattern match, allowed alphabet always passes, any disallowed char rejected). 200 runs each. **Verified passing** (0.8s).
  - [x] 6.3 Property 6 (UUID format on success) — [tests/properties/api.property.test.ts](../tests/properties/api.property.test.ts). Hits POST /api/users with generated valid inputs and asserts `user.id` matches UUID v4 + equals `auth.uid()`.
  - [x] 6.4 Property 13 (error response shape) — same file. Asserts 401 (no auth) and 400 (invalid username) bodies satisfy `ErrorResponse`.
  - [x] 6.5 Integration tests for POST /api/users — [tests/integration/api/users.integration.test.ts](../tests/integration/api/users.integration.test.ts). 8 cases: happy path, missing auth, malformed auth, invalid username, missing awsccId, non-JSON body, duplicate username (409), same-auth-user-twice (409).
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.7, 10.8_

- [x] 7. Implement API Route: GET /api/users/[id]
  - [x] 7.1 Created in [src/app/api/users/[id]/route.ts](../src/app/api/users/%5Bid%5D/route.ts). Returns user + onboardingProgress array (RLS-filtered). 401/404/500 handled.
  - [x] 7.2 Integration tests — [tests/integration/api/users-get.integration.test.ts](../tests/integration/api/users-get.integration.test.ts). Happy path, 404, 401, RLS-cross-user check (other user sees empty progress).
  - _Requirements: 10.2, 10.7, 10.8_

- [x] 8. Implement API Route: PATCH /api/users/[id]/progress
  - [x] 8.1 Created in [src/app/api/users/[id]/progress/route.ts](../src/app/api/users/%5Bid%5D/progress/route.ts). Validates stepNumber ∈ [1,7] + isCompleted boolean; enforces path id == auth.uid() (403 otherwise); upserts on (user_id, step_number).
  - [x] 8.2 Property 7 (completed-step persistence) — [tests/properties/progress-state.property.test.ts](../tests/properties/progress-state.property.test.ts). PATCH-then-GET cycle confirms isCompleted persists across reads. 5 runs (each spins up an anon user — capped for speed).
  - [x] 8.3 Integration tests — [tests/integration/api/progress.integration.test.ts](../tests/integration/api/progress.integration.test.ts). Initial-insert sets completed_at, idempotency, 401, 403 (cross-user), 400 invalid step, 400 non-boolean isCompleted.
  - **NOTE: required new migration [006_extend_completed_at_trigger.sql](../supabase/migrations/006_extend_completed_at_trigger.sql)** to fire the trigger on INSERT too (the original was BEFORE UPDATE only, so the upsert-creates-new-row case would have left completed_at null).
  - _Requirements: 5.3, 10.6, 10.7, 10.8, 19.5_

- [x] 9. Implement API Route: POST /api/projects
  - [x] 9.1 Created in [src/app/api/projects/route.ts](../src/app/api/projects/route.ts) (combined with GET). Validates title/description/optional mediaUrl URL; 23503 (no users row) mapped to 409 NO_USER_PROFILE.
  - [x] 9.2 Integration tests — [tests/integration/api/projects.integration.test.ts](../tests/integration/api/projects.integration.test.ts) (POST + GET combined). Happy path, 401, missing title (400), invalid mediaUrl (400), orphan auth user (409).
  - _Requirements: 8.3, 8.4, 10.3, 10.7, 10.8_

- [x] 10. Implement API Route: GET /api/projects
  - [x] 10.1 Implemented alongside POST in same file. FK-embed for author username, single roundtrip for reactions to compute counts + hasReacted. ORDER BY created_at DESC.
  - [x] 10.2 Property 8 (field completeness) — [tests/properties/projects.property.test.ts](../tests/properties/projects.property.test.ts). Verifies title/description/author.username/createdAt are non-empty for every returned project.
  - [x] 10.3 Property 9 (chronological sorting) — same file. Adjacent items satisfy P[i-1].createdAt >= P[i].createdAt.
  - [x] 10.4 Property 10 (reaction count accuracy) — same file. Cross-checks endpoint count against direct `SELECT COUNT(*)` from reactions.
  - [x] 10.5 Integration tests — same file as 9.2. Newest-first order, author username + reactionCount + hasReacted on each project, unauthenticated public read.
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.3, 9.5, 10.4, 10.7, 10.8_

- [x] 11. Implement API Route: POST /api/reactions
  - [x] 11.1 Created in [src/app/api/reactions/route.ts](../src/app/api/reactions/route.ts). 23505 → 409 CONFLICT, 23503 → 404 NOT_FOUND. Default reactionType is "like".
  - [x] 11.2 Property 11 (duplicate prevention) — [tests/properties/reactions.property.test.ts](../tests/properties/reactions.property.test.ts). Multiple repeat attempts each return 409; cross-check that reactions table has exactly 1 row for (user, project).
  - [x] 11.3 Property 12 (hasReacted flag consistency) — same file. Reactor sees `hasReacted: true`; bystander (separate user) sees `hasReacted: false`; pre-reaction state shows false for everyone.
  - [x] 11.4 Integration tests — [tests/integration/api/reactions.integration.test.ts](../tests/integration/api/reactions.integration.test.ts). Happy path, 401, 400 (missing projectId), 404 (unknown projectId), 409 (duplicate).
  - _Requirements: 9.2, 9.4, 10.5, 10.7, 10.8_

- [x] 12. Checkpoint — Ensure all API routes and database tests pass
  - **All tests green** (verified 2026-05-01):
    - **Property tests:** 6 suites, 15 tests, all passing in ~142s. Covers Properties 5–14.
    - **Integration tests:** 5 suites, 30 tests, all passing in ~18s. Covers happy paths + error cases for every Route Handler.
  - **Anonymous sign-ins enabled** in the Supabase dashboard. Direct curl to `/auth/v1/signup` now returns a session.
  - **Migration 006 pushed** to remote (`supabase db push --include-all`).
  - **Rate-limit refactor:** initial run hit Supabase's 30/5min anonymous-sign-up limit cumulatively across the property suite. Tests refactored to share an anon session across iterations wherever the property allows (e.g., Property 7 reuses one user across 6 stepNumber values; Property 11 reuses author+reactor across 3 iterations). Total anon sign-ins for full property run: ~14. Backoff/retry added in `tests/helpers/supabase-test.ts` as a defensive fallback. To increase iteration counts, raise the dashboard rate limit (Authentication → Rate Limits).

- [x] 13. Implement countdown timer utility and hook
  - [x] 13.1 Created [src/lib/countdown.ts](../src/lib/countdown.ts) — `calculateTimeRemaining(target, now?)` (pure) + `isCountdownExpired(target, now?)`. Sub-second precision is floored intentionally so the displayed countdown stays monotonic. Edge cases (past target, equal target, invalid date) return zeros.
    - _Requirements: 2.5_
  - [x] 13.2 Property 1 (countdown calculation accuracy) — [tests/properties/countdown.property.test.ts](../tests/properties/countdown.property.test.ts). 4 sub-properties × 200–500 runs: canonical decomposition, components recompose to total seconds, all-zeros for past targets, range invariants (h<24, m<60, s<60). **Verified passing** (1.1s, no DB calls).
    - _Validates: Req 2.5_
  - [x] 13.3 Created [src/hooks/useCountdown.ts](../src/hooks/useCountdown.ts) — `'use client'` hook that re-renders every second via `setInterval`, syncs on `target` prop change, clears the interval on unmount, and stops re-running once the target has elapsed (no idle timer when state can't change).
    - _Requirements: 1.1, 2.5_
  - [x] 13.4 Unit tests — [tests/unit/utils/countdown.test.ts](../tests/unit/utils/countdown.test.ts). 13 specific cases covering equal/past/future targets, exact day boundaries, ISO 8601 string input, invalid date input, sub-second truncation, and `isCountdownExpired` returns. **Verified passing** (0.6s).

- [x] 14. Implement form validation utilities
  - [x] `validateUsername` — alias for the existing `isValidUsername` predicate in [src/lib/validation.ts](../src/lib/validation.ts) (already covered by Property 5 at 600 runs).
  - [x] `validateRequired` — alias for `isNonEmptyString`.
  - [x] `validateUrl` — alias for `isValidUrl` (http(s) protocol only).
  - [x] `useFormValidation` hook — [src/hooks/useFormValidation.ts](../src/hooks/useFormValidation.ts). Generic over `T extends Record<string, unknown>`. Tracks values, errors, touched fields, submitted state, and exposes `visibleErrors` (errors only shown after a field is touched OR after submit, supporting Req 18.2's inline-display rule). Returns `setValue/setValues/setTouched/markSubmitted/reset`.
  - _Requirements: 4.2, 4.3, 8.3, 18.2_

- [x] 15. Implement Landing Page
  - [x] 15.1 Created [src/app/page.tsx](../src/app/page.tsx) as a Server Component that reads `NEXT_PUBLIC_COUNTDOWN_TARGET` (with a hardcoded fallback) and hands the target to a Client Component shell. Mobile-first centered hero layout: header pill + h1 + lede + countdown + CTA, with `max-w-3xl` desktop cap and `gap-10 sm:gap-12` rhythm. Server-rendered HTML verified via curl on dev server (200, 15.8KB, all expected text + correct numeric countdown for current date).
    - _Requirements: 1.1, 1.5, 15.1, 15.2, 17.2, 17.3_
  - [x] 15.2 Created [src/components/landing/CountdownTimer.tsx](../src/components/landing/CountdownTimer.tsx) — `'use client'`, calls `useCountdown(targetDate)`, renders four cells (Days/Hours/Minutes/Seconds) in a `grid-cols-2 sm:grid-cols-4` responsive grid. Tabular-nums monospace for the numbers, uppercase tracking-wider labels. `role="timer" aria-live="polite"` for screen readers. Subtle Framer Motion fade/slide-in on mount.
    - _Requirements: 1.1, 2.5, 17.1, 17.2_
  - [x] 15.3 Created [src/components/landing/CTAButton.tsx](../src/components/landing/CTAButton.tsx) — `'use client'`, presentational button that takes `onClick` + optional `label`. Framer Motion `whileHover` (scale 1.03) + `whileTap` (scale 0.98) with spring config. Focus-visible ring for keyboard accessibility. Modal-trigger plumbing lives in [src/components/landing/LandingClient.tsx](../src/components/landing/LandingClient.tsx) which owns `isModalOpen` state — the actual `<OnboardingModal>` is replaced with a placeholder marked `TODO(Task 16)`.
    - _Requirements: 1.2, 1.3, 16.1, 17.1_
  - [x] 15.4 Component tests — [tests/unit/components/CountdownTimer.test.tsx](../tests/unit/components/CountdownTimer.test.tsx) (4 cases: all four labels render, ARIA live region attributes, zeros for past target, correct numeric value for known future target with fake timers) and [tests/unit/components/CTAButton.test.tsx](../tests/unit/components/CTAButton.test.tsx) (4 cases: default + custom label, click handler, keyboard activation via Enter and Space). **All 8 passing.** RTL toolchain installed (`@testing-library/react`, `jest-dom`, `user-event`, `jest-environment-jsdom`); jest.config.js converted to multi-project (`server` for node + `components` for jsdom); jsdom `PointerEvent` polyfill added in [tests/jest.setup.dom.ts](../tests/jest.setup.dom.ts) so motion's keyboard-press synthesis works under jsdom.

- [x] 16. Implement Onboarding Modal structure and navigation
  - [x] 16.1 Created [src/components/onboarding/OnboardingFlow.tsx](../src/components/onboarding/OnboardingFlow.tsx) (`'use client'`). State (currentStep / formData / completedSteps) lives in [src/hooks/useOnboardingState.ts](../src/hooks/useOnboardingState.ts), which wraps the pure transitions in [src/lib/onboarding-state.ts](../src/lib/onboarding-state.ts) — so navigation logic is testable without rendering. Step transitions use `AnimatePresence mode="wait"` keyed on `currentStep` with slide + fade. **Onboarding is now a page route at `/welcome`** rather than a modal — see design.md Note 5 and the 2026-05-01 decisions log entry. The CTA on the landing page calls `router.push('/welcome')`.
    - _Requirements: 3.1, 3.4, 16.1, 16.2, 16.3_
  - [x] 16.2 Created [src/components/onboarding/StepNavigation.tsx](../src/components/onboarding/StepNavigation.tsx) — Next/Back buttons + "STEP N OF 4" indicator + 4 clickable dot tabs (`role="tab"`) for direct any-to-any navigation. Next is disabled when `canProceed` is false OR the user is on the last step (label flips to "Finish"). Back is disabled on step 1. Dots show three states: active (purple, magenta glow), completed (magenta accent), inactive (muted).
    - _Requirements: 3.2, 3.3, 3.5, 16.3_
  - [x] 16.3 Property 2 (navigation consistency) — [tests/properties/navigation.property.test.ts](../tests/properties/navigation.property.test.ts). 3 sub-properties × 50–200 runs: any-to-any goToStep succeeds; completion state never blocks navigation; next/back are clamped at 1 and 7. **Verified passing** (~0.1s, no DB).
    - _Validates: Req 3.3, 5.5_
  - [x] 16.4 Property 3 (form data preservation) — same file. 2 sub-properties: any sequence of next/back/goToStep preserves formData; setFormField on one field never disturbs the other. 200 runs each.
    - _Validates: Req 3.4_
  - [x] 16.5 Property 4 (step indicator accuracy) — same file. 2 sub-properties: currentStep stays in [1, 4] after any sequence including out-of-range goto attempts; the formatted indicator string matches the current step exactly. Up to 200 runs.
    - _Validates: Req 3.5_
  - [x] 16.6 Unit tests — [tests/unit/components/OnboardingFlow.test.tsx](../tests/unit/components/OnboardingFlow.test.tsx). 7 cases: opens on step 1 with right indicator, Continue advances all transitions, Back returns one step, dot click jumps directly to step 4, Back disabled on step 1, button label "Finish" + disabled on step 4, region is labeled for screen readers. **All passing.** (Modal-only assertions — Esc/X-button/backdrop/isOpen — were dropped when the modal became a page route.)

- [x] 16.7 Placeholder step components for Tasks 17/18/20 to fill in
  - [src/components/onboarding/steps/StepShell.tsx](../src/components/onboarding/steps/StepShell.tsx) — shared layout (eyebrow + heading + lede + content slot)
  - [Step1.tsx](../src/components/onboarding/steps/Step1.tsx) (Welcome), [Step3.tsx](../src/components/onboarding/steps/Step3.tsx) (Info), [Step4.tsx](../src/components/onboarding/steps/Step4.tsx) (Completion) — placeholder copy for Task 17 to flesh out
  - [Step2.tsx](../src/components/onboarding/steps/Step2.tsx) — placeholder for the UserInfoForm in Task 18
  - [Step4.tsx](../src/components/onboarding/steps/Step4.tsx) / [Step5.tsx](../src/components/onboarding/steps/Step5.tsx) / [Step6.tsx](../src/components/onboarding/steps/Step6.tsx) — placeholders for the accordion setup steps in Task 20 (now removed from the flow)

- [x] 17. Implement Onboarding Modal steps 1, 3, 7 (non-form steps)
  - [x] [Step1.tsx](../src/components/onboarding/steps/Step1.tsx) — Welcome screen. Title "Ready to build, deploy, and showcase?" + lede + 3-card highlight grid (`Users` / `Sparkles` / `Rocket` icons from lucide) covering "Claim your profile", "Build the essentials", "Ship it with AWS". Each highlight uses inline padding via `clamp(1.25rem, 3vw, 1.75rem)` per the 2026-05-01 padding decision; the icon halo uses a gradient + magenta box-shadow glow. Closes with a "Takes about 10 minutes" hint.
  - [x] [Step3.tsx](../src/components/onboarding/steps/Step3.tsx) — Information screen. "Here's what you'll need" checklist of four items (AWS account, GitHub via lucide `GitBranch`, Node.js 20+, ~30 minutes). 2-column grid on desktop, stacks on mobile. Each item uses inline padding `clamp(1rem, 2.5vw, 1.25rem)` and an inset-shadow magenta hairline on the icon disc.
  - [x] [Step4.tsx](../src/components/onboarding/steps/Step4.tsx) — Completion screen. Title "You're cleared for launch." with primary `<Link href="/deploy-steps">` CTA styled as a gradient pill with `Sparkles` + `ArrowRight` icons (the arrow translates on hover). Secondary "Back to home" text link. Tip about session persistence in localStorage.
  - **Padding convention:** all the new steps use **inline `style` for `padding`/`paddingInline`/`paddingBlock`/`gap`** instead of Tailwind `p-X` / `px-X` / `gap-X` classes. See the 2026-05-01 decision below — the user reported recurring visual-density issues with Tailwind padding classes despite the CSS resolving correctly, and the fix is to use inline styles for layout-critical whitespace going forward.
  - **Compact-on-mobile + pinned stepper:** [StepShell](../src/components/onboarding/steps/StepShell.tsx) heading switched to inline `fontSize: clamp(1.25rem, 3.5vw + 0.25rem, 2.25rem)` so it scales smoothly mobile→desktop without breakpoint-specific Tailwind sizes. Step 1/3 list cards use tighter `clamp()` padding + 1.75rem icon halos. [OnboardingFlow](../src/components/onboarding/OnboardingFlow.tsx) is now a `flex: 1` column where the **step viewport takes `flex: 1` (with `overflowY: auto` + `justifyContent: center`) and the StepNavigation has `flexShrink: 0`** — the stepper stays pinned at the bottom of the section regardless of step content height (no more "pushed down" behavior on tall content). Long content scrolls inside the viewport instead of pushing the nav out of view.
  - **Note:** the `lucide-react` package doesn't ship a GitHub-branded icon. `GitBranch` stands in.
  - _Requirements: 3.1, 17.2, 17.3_

- [x] 18. Implement Onboarding Modal Step 2 (User Info Form)
  - [x] 18.1 Created [src/components/onboarding/UserInfoForm.tsx](../src/components/onboarding/UserInfoForm.tsx). Controlled inputs (Username + AWSCC ID) wired to [useFormValidation](../src/hooks/useFormValidation.ts) with `validateUserForm` from [src/lib/validation.ts](../src/lib/validation.ts). Inline error display follows the touched-or-submitted rule (Property 18). Submit handler:
    1. `getBrowserSupabaseClient().auth.signInAnonymously()` — Supabase persists the session in `localStorage`.
    2. `fetch('/api/users', { Authorization: 'Bearer <token>' })`.
    3. On success → mirror `username` / `awsccId` into onboarding context state, then `next()`.
    4. On any failure after sign-in → `auth.signOut()` so retries don't leak orphaned `auth.users` rows. Inline error message rendered above the submit button.
       Loading state: button shows a spinner + "Creating profile…" + `disabled`. Helper text under each input explains the validation rule.
       Plumbing: a new [src/lib/onboarding-context.tsx](../src/lib/onboarding-context.tsx) (React context) gives Step 2 access to `next`, `state.formData`, `setField` without prop-drilling through the AnimatePresence layer. [OnboardingFlow](../src/components/onboarding/OnboardingFlow.tsx) wraps the steps in `<OnboardingProvider>` and **hides the StepNavigation Continue button on Step 2** via a new `hideNext` prop on [StepNavigation](../src/components/onboarding/StepNavigation.tsx) (the form provides its own submit, so two competing primary actions would be confusing). Wired into [steps/Step2.tsx](../src/components/onboarding/steps/Step2.tsx).
       Spinner uses a new `@keyframes cosmic-spin` rule in [globals.css](../src/app/globals.css). Padding/gap throughout follow the inline-style convention.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 18.2_

  - [x] 18.2 Property 18 (validation error inline display) — [tests/properties/validation-display.property.test.ts](../tests/properties/validation-display.property.test.ts). 4 sub-properties × 200 runs each: after submit every error is visible; touched + invalid → error visible; untouched + pre-submit → never visible; valid input → never produces a visible error regardless of touched/submitted state. **Verified passing.**
    - _Validates: Req 18.2_

  - [x] 18.3 Unit tests — [tests/unit/components/UserInfoForm.test.tsx](../tests/unit/components/UserInfoForm.test.tsx). 7 cases: renders both fields with helper + submit button; inline error after blur on invalid username; no errors before touch; submit attempt with empty fields reveals all errors AND blocks submit; valid input calls `submit + setField + next`; spinner + "Creating profile…" disabled state during pending submit; submit error message surfaces and prevents `next()`. The submit boundary is overridden via the `submit` prop in tests so we don't need to mock the Supabase client or `fetch`. **All 7 passing.**
        Also added a regression test in [OnboardingFlow.test.tsx](../tests/unit/components/OnboardingFlow.test.tsx) confirming Continue is hidden on step 2 and Create profile is shown instead. The "Continue advances steps" test now jumps past step 2 via the indicator dot (since Continue is unavailable there).

- [ ] 19. Implement Accordion component for setup steps (removed from onboarding flow)
  - Create Accordion client component with expand/collapse functionality
  - Support multiple sections open simultaneously
  - Add smooth expand/collapse animations with Framer Motion
  - Style according to design system
  - _Requirements: 6.4, 6.5, 16.1, 17.2_

- [ ] 20. Implement Onboarding Modal Steps 4, 5, 6 (Setup Steps with Accordions) (removed from onboarding flow)
  - [ ] 20.1 Create SetupStep component wrapper with "Mark as Done" functionality
    - Implement SetupStep component with accordion sections
    - Add "Mark as Done" checkbox/button
    - Handle marking step complete (call PATCH /api/users/[id]/progress)
    - Display completion indicator when step is marked done
    - Preserve completion state when navigating away and back
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

  - [ ] 20.2 Create Step4 component (UI/UX Setup) with accordion content
    - Define accordion sections for UI/UX setup instructions
    - Add content for each section
    - _Requirements: 6.1_

  - [ ] 20.3 Create Step5 component (Frontend Setup) with accordion content
    - Define accordion sections for frontend setup instructions
    - Add content for each section
    - _Requirements: 6.2_

  - [ ] 20.4 Create Step6 component (Deployment Setup) with accordion content
    - Define accordion sections for deployment setup instructions
    - Add content for each section
    - _Requirements: 6.3_

  - [ ] 20.5 Write unit tests for SetupStep components
    - Test accordion expand/collapse functionality
    - Test "Mark as Done" updates progress
    - Test completion state persists across navigation
    - Test multiple sections can be open simultaneously

- [ ] 21. Implement authentication context and session management
  - [ ] 21.1 Create AuthProvider context with Supabase Auth
    - Implement AuthProvider with Supabase Auth client
    - Use anonymous sign-in (`signInAnonymously()`) — no email/password.
    - Configure `persistSession: true` (already set in `src/lib/supabase.ts`) so the session lives in `localStorage` and survives refresh/tab close.
    - Subscribe to `onAuthStateChange` to keep React state in sync.
    - Provide a `useAuth()` hook returning `{ session, user, signOut }`.
    - Handle the case where a user already has a session in localStorage on mount (returning user) — don't trigger a new anonymous sign-in.
    - _Requirements: 19.2, 19.3, 19.4_

  - [ ] 21.2 Write property test for session persistence across page refresh
    - **Property 19: Session persistence across page refresh**
    - **Validates: Requirements 19.3**

  - [ ] 21.3 Write property test for protected endpoint authentication enforcement
    - **Property 20: Protected endpoint authentication enforcement**
    - **Validates: Requirements 19.5**

  - [ ] 21.4 Write integration tests for authentication flows
    - Test session creation after user registration
    - Test session persistence across page refresh
    - Test protected API routes require authentication
    - Test invalid session tokens are rejected

- [ ] 22. Implement Showcase Page layout and structure
  - [ ] 22.1 Create Showcase Page as Server Component with initial data fetching
    - Create app/showcase/page.tsx as Server Component
    - Fetch initial projects from GET /api/projects
    - Implement responsive grid layout (1 column mobile, 2-4 columns desktop)
    - Follow padlet.com-inspired card layout
    - _Requirements: 7.1, 7.4, 7.5, 15.1, 15.4, 17.2, 17.3_

  - [ ] 22.2 Write unit tests for Showcase Page layout
    - Test responsive grid columns at different viewports
    - Test initial projects are displayed
    - Test loading state while fetching projects

- [ ] 23. Implement ProjectCard component with reactions
  - [ ] 23.1 Create ProjectCard client component with all project fields
    - Implement ProjectCard as Client Component
    - Display title, description, author username, creation timestamp
    - Add hover animations with Framer Motion
    - Style according to design system (card-based layout)
    - _Requirements: 7.2, 16.1, 17.2, 17.3_

  - [ ] 23.2 Create ReactionButton component with optimistic updates
    - Implement ReactionButton as Client Component
    - Display reaction count
    - Show active/highlighted state if user has reacted
    - Handle click to create reaction (call POST /api/reactions)
    - Implement optimistic UI update (update count immediately)
    - Handle errors (revert optimistic update, show error message)
    - Provide immediate visual feedback on click
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 18.4_

  - [ ] 23.3 Write unit tests for ProjectCard and ReactionButton
    - Test all project fields are displayed
    - Test reaction button shows correct count
    - Test reaction button active state when user has reacted
    - Test reaction button click creates reaction
    - Test optimistic update on reaction click
    - Test error handling reverts optimistic update

- [ ] 24. Implement ProjectGrid component with staggered animations
  - Create ProjectGrid client component
  - Map projects to ProjectCard components
  - Implement staggered entrance animations with Framer Motion
  - Handle empty state (no projects)
  - _Requirements: 7.1, 16.4, 17.2_

- [ ] 25. Implement project creation functionality
  - [ ] 25.1 Create CreateProjectButton component with modal trigger
    - Implement CreateProjectButton as Client Component
    - Add "Create Project" or "Add Project" label
    - Handle click to open ProjectForm modal
    - Add hover animations
    - _Requirements: 8.1, 8.2, 16.1_

  - [ ] 25.2 Create ProjectForm client component with validation
    - Implement ProjectForm as Client Component in modal
    - Add title, description, and optional mediaUrl fields
    - Implement form validation (title and description required)
    - Handle form submission (call POST /api/projects)
    - Display loading state during submission
    - Handle success (close modal, refresh project list)
    - Handle errors (display error messages)
    - Add form animations
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 18.1, 18.2, 18.3_

  - [ ] 25.3 Write property test for API error message display
    - **Property 17: API error message display**
    - **Validates: Requirements 18.1**

  - [ ] 25.4 Write unit tests for project creation
    - Test form validation for required fields
    - Test form submission with valid data
    - Test project appears in grid after creation
    - Test error messages display on failure
    - Test loading state during submission

- [ ] 26. Implement design system and theming
  - [ ] 26.1 Create centralized theme configuration
    - Define color palette in Tailwind config
    - Define spacing scale (4px base unit: 4, 8, 16, 24, 32, 48, 64)
    - Define typography scale (font families, sizes, weights)
    - Define animation timing constants
    - _Requirements: 17.1, 17.2, 17.4, 17.5_

  - [ ] 26.2 Write property test for theme color constraint compliance
    - **Property 15: Theme color constraint compliance**
    - **Validates: Requirements 17.4**

  - [ ] 26.3 Write property test for spacing unit constraint compliance
    - **Property 16: Spacing unit constraint compliance**
    - **Validates: Requirements 17.5**

  - [ ] 26.4 Configure MagicUI components with custom theme
    - Install and configure MagicUI components
    - Apply custom theme to MagicUI components
    - Ensure compatibility with React 18+
    - _Requirements: 17.1, 17.2, 20.7_

- [ ] 27. Implement responsive design across all components
  - Audit all components for responsive behavior (320px-2560px)
  - Implement mobile-first responsive styles
  - Test responsive typography scaling
  - Test responsive spacing and layout
  - Ensure touch targets are appropriate size on mobile
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 28. Implement error handling and user feedback
  - [ ] 28.1 Create error boundary components for critical sections
    - Implement ErrorBoundary component for OnboardingModal
    - Implement ErrorBoundary component for Showcase page
    - Create ErrorFallback component with user-friendly message
    - _Requirements: 18.1_

  - [ ] 28.2 Create notification/toast system for user feedback
    - Implement toast notification component
    - Add success notifications for project creation
    - Add error notifications for API failures
    - Add loading indicators for async operations >200ms
    - _Requirements: 18.1, 18.3, 18.4, 18.5_

  - [ ] 28.3 Write unit tests for error handling
    - Test error boundaries catch component errors
    - Test error messages display for API failures
    - Test loading states display for async operations
    - Test success notifications display after actions

- [ ] 29. Checkpoint - Ensure all component and integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 30. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works for all components
  - Implement focus management for modals (trap focus, restore on close)
  - Test color contrast for WCAG AA compliance
  - Add ARIA live regions for dynamic error messages
  - Ensure all form inputs have associated labels
  - _Requirements: 17.2, 18.2_

- [ ] 31. Performance optimization
  - Implement code splitting for OnboardingModal (lazy load)
  - Implement code splitting for ProjectForm (lazy load)
  - Add Next.js Image component for project media URLs
  - Optimize database queries with proper indexes (already in schema)
  - Implement caching strategy for project listings
  - Ensure animations use GPU-accelerated properties (transform, opacity)
  - _Requirements: 16.5_

- [ ] 32. Security hardening
  - Audit all API routes for authentication checks
  - Implement rate limiting on API routes
  - Ensure environment variables are properly scoped (NEXT*PUBLIC* prefix)
  - Verify input sanitization on all user inputs
  - Test CSRF protection on API routes
  - Ensure service role key is never exposed to client
  - _Requirements: 19.5_

- [ ] 33. End-to-end testing
  - [ ] 33.1 Write E2E test for complete onboarding flow
    - Test landing page → click "Get Started" → complete all 4 steps → reach deploy steps
    - Test user information submission
    - Test marking setup steps as complete
    - Test session persistence after onboarding

  - [ ] 33.2 Write E2E test for project creation and interaction flow
    - Test authenticate → navigate to showcase → create project → verify in grid
    - Test react to another user's project
    - Test reaction count updates

  - [ ] 33.3 Write E2E test for session persistence flow
    - Test complete onboarding → refresh page → verify still authenticated
    - Test navigate to showcase → verify user data persists

- [ ] 34. Visual regression testing
  - [ ] 34.1 Set up visual regression testing with Playwright
    - Configure Playwright for visual regression tests
    - Set up baseline screenshots

  - [ ] 34.2 Create visual regression tests for key components
    - Test landing page at mobile, tablet, desktop viewports
    - Test onboarding modal at each step
    - Test showcase page with various project counts
    - Test project cards with different content lengths
    - Test error states and notifications

- [ ] 35. Deployment configuration
  - Configure Vercel project settings
  - Set up environment variables in Vercel dashboard
  - Configure build settings (Next.js build command)
  - Set up preview deployments for pull requests
  - Configure custom domain (if applicable)
  - Test production build locally
  - _Requirements: 20.1_

- [ ] 36. Documentation and final polish
  - Create README with setup instructions
  - Document environment variables
  - Document API endpoints
  - Add code comments for complex logic
  - Create deployment guide
  - Test complete user flows in production environment

- [ ] 37. Final checkpoint - Complete testing and deployment verification
  - Ensure all tests pass (property-based, unit, integration, E2E)
  - Verify all 21 requirements are met
  - Test complete application in production environment
  - Verify responsive design on real devices
  - Verify animations and performance
  - Ask the user if questions arise or if ready for production launch

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate API routes and database operations
- E2E tests validate complete user flows
- Checkpoints ensure incremental validation at key milestones
- The implementation follows a bottom-up approach: database → API → components → integration
- All code examples should use TypeScript 5.0+ with strict mode enabled
- Follow Next.js 15+ App Router conventions and best practices
- Refer to design document for detailed specifications and interfaces

## Decisions Log

A running log of implementation choices that diverge from or extend `design.md`. Each entry: date — decision — rationale.

- **2026-05-01 — Spec folder moved from `.kiro/specs/aws-community-showcase/` to project-root `aws-community-showcase/`.** User-initiated. No design impact; just a path change. Memory note + `MEMORY.md` updated to reference the new path.
- **2026-05-01 — MagicUI installed via shadcn CLI, not as a single npm package.** MagicUI publishes per-component registry URLs consumed by `shadcn add`. We ran `npx shadcn@latest init --defaults` (created `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`) and verified end-to-end with `npx shadcn@latest add https://magicui.design/r/blur-fade.json` (`src/components/ui/blur-fade.tsx`). Adds deps: `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `motion`, `tw-animate-css`, `@base-ui/react`, `shadcn`. Fulfills Req 20.7.
- **2026-05-01 — Linear.app palette migrated from `tailwind.config.ts` `extend.colors` to CSS custom properties in `src/app/globals.css`.** Tailwind v4's `@theme inline` block in CSS supersedes the JS config, so the JS `extend.colors` block was effectively dead. Now `--primary: #5E6AD2` etc. drive both shadcn tokens and Tailwind utilities. Follow-up: prune the dead block in `tailwind.config.ts`.
- **2026-05-01 — Inline `style` for all layout-critical padding/gap, not Tailwind `p-*` / `gap-*`.** Recurring issue across the build: the user reports paddings "don't work" even though the served CSS resolves correctly (`.px-N { padding-inline: calc(var(--spacing) * N) }` with `--spacing: 0.25rem` set on `:root`). The visual density of Tailwind's `p-N` scale doesn't match what the user expects, and bumping up + down via class names produced no visible change between iterations. Switching to inline `style={{ padding: ... }}` (often with `clamp(min, vw-fn, max)` for responsive scaling) makes the value explicit, bypasses any class-cascade weirdness, and let the user see the change land. Convention going forward: **use inline `style` for `padding`, `paddingInline`, `paddingBlock`, `gap`, `rowGap`, `columnGap`, `minWidth`, `minHeight` on layout-critical elements (cards, buttons, modals).** Color, typography, layout role, and other non-spacing concerns continue to use Tailwind classes. Applied retroactively to: CTAButton, CountdownTimer cells, OnboardingFlow modal panel (now removed), Step1 highlight cards, Step3 checklist items, Step4 CTA button, WelcomeClient "Back to home" link.
- **2026-05-01 — Onboarding became a page route (`/welcome`) instead of a modal.** The requirements call it `Onboarding_Modal` throughout, but a route is shareable, back-navigable, and survives refresh (localStorage already preserves the auth session per the anonymous-auth decision; only the in-progress step number is lost on refresh, which is fine). The 7-step flow itself is unchanged — same step components, same `useOnboardingState`, same property tests for navigation/form-preservation/indicator. The CTA on `/` now calls `router.push('/welcome')`. New files: [src/app/welcome/page.tsx](../src/app/welcome/page.tsx), [src/app/welcome/WelcomeClient.tsx](../src/app/welcome/WelcomeClient.tsx), [src/components/onboarding/OnboardingFlow.tsx](../src/components/onboarding/OnboardingFlow.tsx). Removed: `src/components/onboarding/OnboardingModal.tsx` and `tests/unit/components/OnboardingModal.test.tsx`. The modal-only test cases (Esc to close, X button, backdrop click, isOpen=false hides) were dropped — replaced with one new test asserting the labeled `<section role="region">`.
- **2026-05-01 — Poster fidelity pass + custom cursor + shooting stars.** Pulled in the actual poster copy (eyebrow `FROM VIBE TO LIVE:`, headline `Deploying your portfolio with AWS`, event details `May 2, 2026 · 1:00 PM – 6:00 PM · White Cloak Technologies, Pasig City`). Loaded **Bungee** as the display font via `next/font/google` and wired it to `--font-display` / `font-display` Tailwind utility through `@theme inline`. Headline uses a vertical white→magenta `bg-clip-text` with a magenta `WebkitTextStroke` for the poster's outlined look + a subtle 4s `cosmic-glow-pulse` drop-shadow loop. Added 5 `.cosmic-shooting-star` instances (CSS `linear-gradient` + 6s diagonal animation, randomized delay/duration). New `<CustomCursor />` in `src/components/cursor/CustomCursor.tsx` mounted in root layout: pointer-fine only, two-layer (sharp dot + lerping halo), grows on `[role="button"]` / `<a>` hover, honors `prefers-reduced-motion`, hides native cursor via `html.cosmic-cursor *` rule.
- **2026-05-01 — Theme rebrand: Linear.app → Cosmic ("From Vibe to Live").** User shared the event poster (deep purple + magenta glow) and a richer Figma file (`KQ5EAw4koMfow6jzJCHdDQ`, node 16:6) with the actual portfolio design. Pulled exact tokens via `mcp__plugin_figma_figma__get_design_context`. Replaced the Linear.app palette with: `--background: #0a0518`, `--card: #1a0b2e`, `--secondary: #2c1250`, `--primary: #a855f7`, `--accent: #ec4899`, plus `--glow-magenta/violet/deep` for decorations. Added pure-CSS decorative utilities (`.cosmic-bg`, `.cosmic-stars`, `.cosmic-planet`, `.cosmic-float`) — no image assets. See design.md Note 4 for the full token table. Tailwind v4 canonical class fixes applied (`bg-linear-to-r` not `bg-gradient-to-r`, bare token names like `via-primary` instead of `via-(--primary)` for tokens registered in `@theme`).
- **2026-05-01 — Property-test env loading uses `dotenv` + `tests/jest.setup.ts`.** Jest doesn't auto-load `.env.local` like Next.js does. Tried `@next/env`'s `loadEnvConfig` first; behaved correctly under `node` but not in Jest's `setupFiles` context (env vars stayed unset in the test process). Switched to a plain `dotenv.config({ path: <abs path> })` call, which works. Also wired via `setupFiles` (not `setupFilesAfterEach`) so env is available when test modules import.
- **2026-05-01 — Property 14 timestamp tolerance widened from 1s to 60s.** The trigger uses server-side `NOW()`; comparing against client-side `Date.now()` failed by ~9s due to clock skew. Widening the bracket preserves the spirit of the property (timestamp is set, valid ISO 8601, recent) without introducing brittleness from clock drift.
- **2026-05-01 — Linked Supabase project: `bkffopfnejyotqmhhgzu` (from-vibe-to-live).** All migrations 001–005 applied. Auth provider settings still need a Dashboard pass to enable email auth and (for dev) disable email confirmation.
- **2026-05-01 — Migration 006_extend_completed_at_trigger.sql.** Original `set_completed_at` trigger was `BEFORE UPDATE` only, which left `completed_at = NULL` when the upsert in `PATCH /api/users/[id]/progress` resulted in an INSERT with `is_completed = true`. Migration 006 extends the trigger to `BEFORE INSERT OR UPDATE`. Pushed to remote on 2026-05-01.
- **2026-05-01 — RTL + jsdom test setup.** Installed `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom`. Converted `jest.config.js` to a multi-project layout: a `server` project (testEnvironment: node) for property + integration + utility tests, and a `components` project (testEnvironment: jsdom) for `tests/unit/components/**/*.test.tsx`. Added a `PointerEvent` polyfill in `tests/jest.setup.dom.ts` because jsdom doesn't ship one and `motion-dom` synthesizes pointer events on keyboard activation. Note: the right Jest property for jest-dom matchers is `setupFilesAfterEnv`, not `setupFilesAfterEach`.
- **2026-05-01 — Test suite anon-signup rate limiting.** Supabase's default anonymous-signup rate limit (30 per 5 minutes per IP) bit the property + integration suite when each fast-check iteration created its own user. Two-pronged fix: (1) `signedInClient()` now retries with exponential backoff on rate-limit errors (~56s of total backoff), and (2) property tests reuse a single anonymous user across iterations wherever the property allows (Property 7, 11, 13). Total anon sign-ins for the full property run dropped from ~50 to ~14. If you want stronger iteration counts, raise the rate limit in Dashboard → Authentication → Rate Limits.
- **2026-05-01 — Auth strategy: anonymous Supabase sign-in + `localStorage` persistence.** One-time event, no passwords, no recovery flow. Step 2 of onboarding calls `supabase.auth.signInAnonymously()` first, then `POST /api/users` with the resulting bearer token. The Route Handler MUST set `users.id = auth.uid()` because the existing RLS policy `WITH CHECK (auth.uid() = id)` (in `005_enable_rls_and_policies.sql`) rejects inserts whose `id` doesn't match the caller's `auth.uid()`. The `gen_random_uuid()` default on `users.id` is therefore unsafe for the onboarding insert path. Lost localStorage = lost identity (acceptable trade-off for the event scale; duplicates by AWSCC ID can be deduped post-event if needed). The "enable email auth" dashboard step from Task 3 is consequently NOT required for this deployment — only "Allow anonymous sign-ins" was enabled (Authentication → Providers → Anonymous Sign-Ins → ON, confirmed by user 2026-05-01). Implementation impact: Tasks 6.1, 18.1, 21.1 updated with the explicit flow. Supabase warning acknowledged: anonymous users carry the `authenticated` role; existing RLS policies in `005` already restrict writes via `auth.uid() = ...` checks, so this is the intended behavior.

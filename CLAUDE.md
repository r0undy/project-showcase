# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev              # Next.js dev server at http://localhost:3000
npm run build            # Production build (use to verify type safety end-to-end)
npm run start            # Run the built app
npm run lint             # ESLint (flat config, eslint-config-next core-web-vitals + typescript)
npm test                 # Jest, ts-jest preset, node env, runs everything under tests/**/*.test.ts
npm run test:watch
npm run test:properties  # Only fast-check property tests (filename pattern *.property.test.ts)
```

Run a single test: `npx jest tests/properties/progress.property.test.ts -t "completion timestamp"`.

## Architecture

This is the **AWS Community Showcase**, a Next.js 16 App Router app backed by Supabase. The full spec lives in `.kiro/specs/aws-community-showcase/{requirements,design,tasks}.md` — read these before adding features rather than re-deriving intent from code, since the codebase is still being built out from `src/app/page.tsx` (the default Next starter).

**Two layers that must stay in sync:**
- `src/types/index.ts` — application/API types in **camelCase** (`awsccId`, `mediaUrl`, `createdAt`)
- `src/lib/supabase.ts` `Database` type and `supabase/migrations/*.sql` — DB schema in **snake_case** (`awscc_id`, `media_url`, `created_at`)

When adding a column, update the SQL migration, the `Database` type in `supabase.ts`, and the corresponding interface in `src/types/index.ts` together. API route handlers are the conversion boundary.

**Supabase clients** (`src/lib/supabase.ts`):
- `supabase` — anon-key client, safe for Client Components and the browser
- `supabaseAdmin()` — service-role client, **server-only**; use in API route handlers for privileged ops. Never import into a Client Component.

**Database** (see `supabase/migrations/`): four tables — `users`, `projects`, `reactions`, `onboarding_progress` — with RLS policies in `005_enable_rls_and_policies.sql`. Two triggers worth knowing:
- `update_updated_at_column()` auto-bumps `updated_at` on every row update
- `set_completed_at()` auto-stamps `completed_at` on `onboarding_progress` when `is_completed` flips false→true (Property 14 verifies this)

Migrations are applied manually via the Supabase dashboard or CLI; there is no automated migration runner in this repo.

**Tests** (`tests/`): property-based tests using `fast-check` with `numRuns: 100`. They **hit a live Supabase instance** using the service-role key from `.env.local` — they are not unit tests with mocks. Each test creates and cleans up its own data; use a dedicated test Supabase project. Convention from `tests/README.md`: tag each property with `Feature: aws-community-showcase, Property {N}: {description}` and reference the requirement it validates.

## Path alias

`@/*` → `./src/*` (configured in both `tsconfig.json` and `jest.config.js` `moduleNameMapper`).

## Required environment

`.env.local` must define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The Supabase clients throw at import time if these are missing, which means tests and dev server won't start without them.

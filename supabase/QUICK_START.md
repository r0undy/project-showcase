# Quick Start Guide: Supabase Setup

This guide helps you quickly set up Supabase authentication and RLS for the AWS Community Showcase.

## Prerequisites

- Supabase account and project created
- Node.js and npm installed
- Project dependencies installed (`npm install`)

## 5-Minute Setup

### Step 1: Get Supabase Credentials (2 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Configure Environment Variables (1 minute)

Create `.env.local` in project root:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local with your values
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 3: Apply Database Migrations (2 minutes)

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste each migration file in order:
   - `001_create_users_table.sql`
   - `002_create_projects_table.sql`
   - `003_create_reactions_table.sql`
   - `004_create_onboarding_progress_table.sql`
   - `005_enable_rls_and_policies.sql`
4. Click **Run** for each migration

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Step 4: Enable Email Authentication (1 minute)

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. For development, disable email confirmation:
   - **Confirm email**: OFF
4. For production, enable email confirmation and configure templates

### Step 5: Verify Setup (1 minute)

Run this query in SQL Editor to verify RLS is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Expected output:
```
tablename              | rowsecurity
-----------------------+-------------
users                  | t
projects               | t
reactions              | t
onboarding_progress    | t
```

## Test Your Setup

### Test 1: Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "awsccId": "AWSCC-001"
  }'
```

Expected: 201 status with user ID and session token

### Test 2: Read Projects (Public)

```bash
curl http://localhost:3000/api/projects
```

Expected: 200 status with array of projects (may be empty)

### Test 3: Create Project (Authenticated)

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "title": "My First Project",
    "description": "Testing the API"
  }'
```

Expected: 201 status with project data

## Common Issues

### Issue: "Missing Supabase environment variables"

**Solution**: Ensure `.env.local` exists and contains all required variables

### Issue: "relation 'users' does not exist"

**Solution**: Apply database migrations (Step 3)

### Issue: "new row violates row-level security policy"

**Solution**: 
1. Verify RLS policies are applied (run Step 5 verification)
2. Ensure you're authenticated when creating resources
3. Check that `auth.uid()` matches the user_id/author_id

### Issue: "Invalid JWT"

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
2. Check that the token hasn't expired
3. Ensure you're using the correct Supabase project

## Next Steps

- Read `AUTHENTICATION_SETUP.md` for detailed auth configuration
- Read `README_RLS.md` for RLS policy details and testing
- Read `TASK_3_SUMMARY.md` for complete implementation overview

## Development Workflow

### Starting Development

```bash
# Start Next.js dev server
npm run dev

# Open http://localhost:3000
```

### Making Database Changes

1. Create new migration file: `supabase/migrations/00X_description.sql`
2. Write SQL changes
3. Apply migration via Dashboard or CLI
4. Update TypeScript types in `src/lib/supabase.ts` if needed

### Testing RLS Policies

Use the test cases in `README_RLS.md` to verify policies work correctly.

## Production Checklist

Before deploying to production:

- [ ] Enable email confirmation in Supabase Auth settings
- [ ] Configure email templates (welcome, password reset, etc.)
- [ ] Set production Site URL and Redirect URLs
- [ ] Use HTTPS for all requests
- [ ] Rotate service role key if it was exposed
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up monitoring and alerts in Supabase Dashboard
- [ ] Test all RLS policies with production data
- [ ] Review and audit all security policies

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Support

If you encounter issues:

1. Check the troubleshooting sections in:
   - `AUTHENTICATION_SETUP.md`
   - `README_RLS.md`
2. Review Supabase logs in Dashboard → Logs
3. Check browser console for client-side errors
4. Verify environment variables are loaded correctly

---

**Quick Reference**: 
- Auth setup: `AUTHENTICATION_SETUP.md`
- RLS policies: `README_RLS.md`
- Task summary: `TASK_3_SUMMARY.md`
- Migrations: `supabase/migrations/`

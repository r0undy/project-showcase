# Row Level Security (RLS) Configuration

This document explains the Row Level Security policies implemented for the AWS Community Showcase platform.

## Overview

Row Level Security (RLS) is enabled on all tables to ensure users can only access and modify data they're authorized to access. The policies are designed to support the authentication flow where users create accounts during onboarding and then interact with projects and reactions.

## Authentication Flow

1. **User Registration**: During onboarding (Step 2), users provide username and AWSCC ID
2. **Session Creation**: The backend creates both a user record and a Supabase Auth session
3. **Session Persistence**: The session is stored client-side and persists across page refreshes
4. **Protected Operations**: All write operations require authentication via `auth.uid()`

## RLS Policies by Table

### Users Table

| Operation | Policy | Description |
|-----------|--------|-------------|
| SELECT | Public read | All users can read all user records (needed for displaying author info) |
| INSERT | Own record only | Authenticated users can insert their own record (auth.uid() = id) |
| UPDATE | Own record only | Users can update their own profile |
| DELETE | Admin only | No policy (only service role can delete) |

**Rationale**: Public read access allows displaying author information on projects. Users can only create and modify their own records.

### Projects Table

| Operation | Policy | Description |
|-----------|--------|-------------|
| SELECT | Public read | Anyone can read all projects (showcase is public) |
| INSERT | Authenticated only | Authenticated users can insert projects (auth.uid() = author_id) |
| UPDATE | Authors only | Project authors can update their own projects |
| DELETE | Authors only | Project authors can delete their own projects |

**Rationale**: The showcase is publicly viewable, but only authenticated users can submit projects, and only authors can modify/delete their own projects.

### Reactions Table

| Operation | Policy | Description |
|-----------|--------|-------------|
| SELECT | Public read | Anyone can read reactions (needed for displaying counts) |
| INSERT | Authenticated only | Authenticated users can insert their own reactions (auth.uid() = user_id) |
| UPDATE | No policy | Reactions are immutable (delete and re-create instead) |
| DELETE | Own reactions only | Users can delete their own reactions (un-like functionality) |

**Rationale**: Public read access allows displaying reaction counts. Users can add/remove their own reactions but cannot modify existing ones.

### Onboarding_Progress Table

| Operation | Policy | Description |
|-----------|--------|-------------|
| SELECT | Own records only | Users can read only their own progress (auth.uid() = user_id) |
| INSERT | Own records only | Users can insert their own progress records |
| UPDATE | Own records only | Users can update their own progress (mark steps complete) |
| DELETE | Own records only | Users can delete their own progress (reset functionality) |

**Rationale**: Onboarding progress is private to each user. No one else should see or modify another user's progress.

## Testing RLS Policies

### Prerequisites

1. Ensure migrations are applied:
   ```bash
   # If using Supabase CLI
   supabase db reset
   
   # Or apply migrations manually in Supabase Dashboard
   ```

2. Create test users in Supabase Auth dashboard or via API

### Test Cases

#### 1. Users Table

```sql
-- As authenticated user (user_id = 'abc-123')
-- ✅ Should succeed: Read all users
SELECT * FROM users;

-- ✅ Should succeed: Insert own record
INSERT INTO users (id, username, awscc_id) 
VALUES ('abc-123', 'testuser', 'AWSCC-001');

-- ✅ Should succeed: Update own record
UPDATE users SET awscc_id = 'AWSCC-002' WHERE id = 'abc-123';

-- ❌ Should fail: Update another user's record
UPDATE users SET awscc_id = 'AWSCC-003' WHERE id = 'xyz-789';

-- ❌ Should fail: Delete any record
DELETE FROM users WHERE id = 'abc-123';
```

#### 2. Projects Table

```sql
-- As anonymous user
-- ✅ Should succeed: Read all projects
SELECT * FROM projects;

-- ❌ Should fail: Insert project (not authenticated)
INSERT INTO projects (title, description, author_id) 
VALUES ('Test', 'Description', 'abc-123');

-- As authenticated user (user_id = 'abc-123')
-- ✅ Should succeed: Insert own project
INSERT INTO projects (title, description, author_id) 
VALUES ('My Project', 'Description', 'abc-123');

-- ✅ Should succeed: Update own project
UPDATE projects SET title = 'Updated' WHERE author_id = 'abc-123';

-- ❌ Should fail: Update another user's project
UPDATE projects SET title = 'Hacked' WHERE author_id = 'xyz-789';

-- ✅ Should succeed: Delete own project
DELETE FROM projects WHERE author_id = 'abc-123';
```

#### 3. Reactions Table

```sql
-- As anonymous user
-- ✅ Should succeed: Read all reactions
SELECT * FROM reactions;

-- ❌ Should fail: Insert reaction (not authenticated)
INSERT INTO reactions (user_id, project_id) 
VALUES ('abc-123', 'project-1');

-- As authenticated user (user_id = 'abc-123')
-- ✅ Should succeed: Insert own reaction
INSERT INTO reactions (user_id, project_id) 
VALUES ('abc-123', 'project-1');

-- ❌ Should fail: Insert reaction for another user
INSERT INTO reactions (user_id, project_id) 
VALUES ('xyz-789', 'project-1');

-- ❌ Should fail: Update reaction (no UPDATE policy)
UPDATE reactions SET reaction_type = 'heart' WHERE user_id = 'abc-123';

-- ✅ Should succeed: Delete own reaction
DELETE FROM reactions WHERE user_id = 'abc-123' AND project_id = 'project-1';

-- ❌ Should fail: Delete another user's reaction
DELETE FROM reactions WHERE user_id = 'xyz-789';
```

#### 4. Onboarding_Progress Table

```sql
-- As authenticated user (user_id = 'abc-123')
-- ✅ Should succeed: Read own progress
SELECT * FROM onboarding_progress WHERE user_id = 'abc-123';

-- ❌ Should fail: Read another user's progress
SELECT * FROM onboarding_progress WHERE user_id = 'xyz-789';

-- ✅ Should succeed: Insert own progress
INSERT INTO onboarding_progress (user_id, step_number, is_completed) 
VALUES ('abc-123', 1, true);

-- ✅ Should succeed: Update own progress
UPDATE onboarding_progress SET is_completed = true 
WHERE user_id = 'abc-123' AND step_number = 1;

-- ❌ Should fail: Update another user's progress
UPDATE onboarding_progress SET is_completed = true 
WHERE user_id = 'xyz-789' AND step_number = 1;
```

## Security Considerations

### 1. Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It should:
- **NEVER** be exposed to the client
- Only be used in server-side code (API routes)
- Be stored securely in environment variables
- Have restricted access in production

### 2. Anonymous Access

Some operations allow anonymous (unauthenticated) access:
- Reading users (for author display)
- Reading projects (public showcase)
- Reading reactions (for counts)

This is intentional for the public showcase functionality.

### 3. User ID Validation

All policies use `auth.uid()` to identify the current user. This is:
- Automatically set by Supabase Auth
- Tamper-proof (cannot be spoofed by client)
- NULL for anonymous users

### 4. Cascade Deletes

Foreign key constraints with `ON DELETE CASCADE` ensure:
- Deleting a user removes all their projects, reactions, and progress
- Deleting a project removes all its reactions
- This is enforced at the database level, independent of RLS

## Troubleshooting

### "new row violates row-level security policy"

This error occurs when trying to insert/update data that doesn't satisfy the policy's `WITH CHECK` clause.

**Common causes:**
1. Not authenticated (auth.uid() is NULL)
2. Trying to insert data for another user
3. Missing required fields in the INSERT/UPDATE

**Solution:** Ensure the user is authenticated and the data matches the policy conditions.

### "permission denied for table"

This error occurs when trying to perform an operation with no matching policy.

**Common causes:**
1. No policy exists for the operation (e.g., DELETE on users table)
2. RLS is enabled but no policies are defined
3. Using the wrong Supabase client (anon key vs service role)

**Solution:** Check that appropriate policies exist and you're using the correct client.

### Policies not taking effect

**Checklist:**
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. List policies: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Check auth.uid(): `SELECT auth.uid();` (should return your user ID when authenticated)
4. Verify migration was applied successfully

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Requirements: 19.1, 19.2, 19.5

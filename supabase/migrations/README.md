# Supabase Database Migrations

This directory contains SQL migration files for the AWS Community Showcase database schema.

## Migration Files

The migrations should be applied in numerical order:

1. **001_create_users_table.sql** - Creates the Users table with UUID primary key, unique username constraint, timestamps, and auto-update trigger
2. **002_create_projects_table.sql** - Creates the Projects table with foreign key to Users and cascade delete
3. **003_create_reactions_table.sql** - Creates the Reactions table with unique constraint on user_id + project_id
4. **004_create_onboarding_progress_table.sql** - Creates the Onboarding_Progress table with step tracking and completion timestamps

## Applying Migrations

### Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each migration file in order (001, 002, 003, 004)
4. Execute each migration

### Option 3: Manual Application

Connect to your PostgreSQL database and run each migration file in order:

```bash
psql -h your-host -U your-user -d your-database -f supabase/migrations/001_create_users_table.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/002_create_projects_table.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/003_create_reactions_table.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/004_create_onboarding_progress_table.sql
```

## Schema Overview

### Tables Created

- **users** - Stores AWS Community members with username and AWSCC ID
- **projects** - Stores community projects submitted by users
- **reactions** - Stores user reactions to projects (likes, hearts, etc.)
- **onboarding_progress** - Tracks which onboarding steps users have completed

### Triggers Created

- **update_updated_at_column()** - Function to auto-update updated_at timestamps
- **set_completed_at()** - Function to auto-set completed_at when onboarding steps are marked complete

### Key Features

- UUID v4 primary keys for all tables
- Automatic timestamp management (created_at, updated_at)
- Foreign key constraints with cascade delete
- Unique constraints to prevent duplicates
- Check constraints for data validation
- Indexes for query performance

## Verification

After applying migrations, verify the schema:

```sql
-- List all tables
\dt

-- Describe each table
\d users
\d projects
\d reactions
\d onboarding_progress

-- Verify triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Verify indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## Requirements Mapping

Each migration file includes comments mapping to specific requirements from the requirements document:

- 001_create_users_table.sql → Requirements 11.1-11.5
- 002_create_projects_table.sql → Requirements 12.1-12.5
- 003_create_reactions_table.sql → Requirements 13.1-13.5
- 004_create_onboarding_progress_table.sql → Requirements 14.1-14.5

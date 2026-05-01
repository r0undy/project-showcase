# AWS Community Showcase - Test Suite

This directory contains the test suite for the AWS Community Showcase application.

## Test Structure

```
tests/
├── properties/          # Property-based tests using fast-check
│   └── progress.property.test.ts
├── unit/               # Unit tests (to be added)
├── integration/        # Integration tests (to be added)
└── e2e/               # End-to-end tests (to be added)
```

## Property-Based Tests

Property-based tests use `fast-check` to verify universal properties across many generated inputs.

### Configuration
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: aws-community-showcase, Property {N}: {description}`

### Running Property Tests

```bash
# Run all property tests
npm run test:properties

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Environment Setup

Before running tests, ensure you have:

1. A Supabase project set up
2. Environment variables configured in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Database migrations applied:
   ```bash
   # Apply all migrations to your Supabase database
   # (Instructions depend on your Supabase setup)
   ```

## Test Database

Tests use the Supabase service role key to:
- Create test users
- Insert test data
- Clean up after each test

**Important**: Tests clean up their own data, but it's recommended to use a separate test database or project.

## Property 14: Completion Timestamp Automation

**Validates: Requirements 14.5**

This property test verifies that when an onboarding progress record's `is_completed` field changes from `false` to `true`, the `completed_at` field is automatically set to a valid ISO 8601 timestamp representing the current time.

### Test Coverage

The property test includes three scenarios:

1. **Main Property**: When `is_completed` changes from `false` to `true`:
   - `completed_at` is set (not null)
   - `completed_at` is a valid ISO 8601 timestamp
   - `completed_at` represents the current time (within 5 second tolerance)

2. **Edge Case**: When `is_completed` remains `true`:
   - `completed_at` is NOT modified

3. **Edge Case**: When `is_completed` remains `false`:
   - `completed_at` remains `null`

### Implementation Details

The test:
- Generates arbitrary step numbers (1-7) using fast-check
- Creates test users with unique usernames
- Tests the database trigger directly via Supabase client
- Validates ISO 8601 format using regex
- Checks timestamp is within 5 seconds of current time
- Cleans up all test data after each run
- Runs 100 iterations per property (as specified in design)

## Troubleshooting

### Missing Dependencies

If you see errors about missing packages, install them:

```bash
npm install
```

### Environment Variables

If tests fail with "Missing Supabase environment variables", ensure your `.env.local` file is properly configured.

### Database Connection

If tests fail to connect to the database:
1. Verify your Supabase URL and keys are correct
2. Check that your Supabase project is running
3. Ensure database migrations have been applied

## Adding New Tests

When adding new property tests:

1. Follow the naming convention: `{feature}.property.test.ts`
2. Include the property number and description in comments
3. Add the validation tag: `**Validates: Requirements X.Y**`
4. Use the tag format: `Feature: aws-community-showcase, Property N: description`
5. Set `numRuns: 100` for all property tests
6. Clean up test data in `finally` blocks

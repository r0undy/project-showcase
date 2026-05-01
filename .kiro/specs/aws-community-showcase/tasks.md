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
5. Onboarding modal (7 steps with accordions)
6. Showcase page (project grid, reactions, submissions)
7. Responsive design and animations
8. Comprehensive testing (property-based, unit, integration, E2E)

## Tasks

- [x] 1. Project setup and configuration
  - Initialize Next.js 15+ project with TypeScript and App Router
  - Configure Tailwind CSS 4.0+ with custom theme
  - Install and configure dependencies (Supabase client, Framer Motion, MagicUI)
  - Set up TypeScript strict mode and path aliases (@/*)
  - Create environment variable configuration file
  - _Requirements: 20.1, 20.3, 20.4, 20.5, 20.6, 20.7_

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

- [ ] 3. Supabase authentication and Row Level Security (RLS)
  - Configure Supabase Auth settings for email/password authentication
  - Create RLS policies for Users table (users can read all, insert own, update own)
  - Create RLS policies for Projects table (all can read, authenticated can insert, authors can update/delete)
  - Create RLS policies for Reactions table (all can read, authenticated can insert own, users can delete own)
  - Create RLS policies for Onboarding_Progress table (users can only access their own records)
  - _Requirements: 19.1, 19.2, 19.5_

- [ ] 4. Core TypeScript types and interfaces
  - Create TypeScript interfaces for all data models (User, Project, Reaction, OnboardingProgress)
  - Create API request/response type definitions
  - Create component prop type definitions
  - Create error response type definitions
  - Set up shared types directory structure (src/types/)
  - _Requirements: 20.4_

- [ ] 5. Supabase client configuration and utilities
  - Create Supabase client initialization for server-side usage
  - Create Supabase client initialization for client-side usage
  - Create authentication helper functions (getSession, requireAuth middleware)
  - Create database query helper functions with type safety
  - _Requirements: 19.1, 19.5, 20.3_

- [ ] 6. Implement API Route: POST /api/users
  - [ ] 6.1 Create Route Handler for user creation with validation
    - Implement POST handler in app/api/users/route.ts
    - Add request body validation (username pattern, awsccId required)
    - Create user record in Supabase database
    - Create Supabase Auth session
    - Return user ID and session token
    - Handle duplicate username error (409 Conflict)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.7, 10.8_

  - [ ] 6.2 Write property test for username validation pattern compliance
    - **Property 5: Username validation pattern compliance**
    - **Validates: Requirements 4.2**

  - [ ] 6.3 Write property test for user creation returns valid UUID
    - **Property 6: User creation returns valid UUID**
    - **Validates: Requirements 4.6, 11.5**

  - [ ] 6.4 Write property test for API error response format consistency
    - **Property 13: API error response format consistency**
    - **Validates: Requirements 10.7, 10.8**

  - [ ] 6.5 Write integration tests for POST /api/users
    - Test successful user creation with valid data
    - Test duplicate username returns 409 Conflict
    - Test invalid username pattern returns 400 Bad Request
    - Test missing awsccId returns 400 Bad Request
    - Verify user record exists in database after creation
    - Verify session token is valid

- [ ] 7. Implement API Route: GET /api/users/[id]
  - [ ] 7.1 Create Route Handler for user retrieval with onboarding progress
    - Implement GET handler in app/api/users/[id]/route.ts
    - Fetch user record from database
    - Fetch associated onboarding progress records
    - Return user data with progress array
    - Handle user not found (404 Not Found)
    - _Requirements: 10.2, 10.7, 10.8_

  - [ ] 7.2 Write integration tests for GET /api/users/[id]
    - Test successful user retrieval with existing user
    - Test 404 response for non-existent user
    - Verify onboarding progress is included in response
    - Test response format matches GetUserResponse interface

- [ ] 8. Implement API Route: PATCH /api/users/[id]/progress
  - [ ] 8.1 Create Route Handler for updating onboarding progress
    - Implement PATCH handler in app/api/users/[id]/progress/route.ts
    - Validate request body (stepNumber 1-7, isCompleted boolean)
    - Require authentication (validate session token)
    - Upsert onboarding progress record
    - Return updated progress record
    - _Requirements: 5.3, 10.6, 10.7, 10.8, 19.5_

  - [ ] 8.2 Write property test for completed step state persistence
    - **Property 7: Completed step state persistence**
    - **Validates: Requirements 5.4**

  - [ ] 8.3 Write integration tests for PATCH /api/users/[id]/progress
    - Test successful progress update with valid data
    - Test 401 response without authentication
    - Test 400 response with invalid step number
    - Verify completed_at is set when is_completed changes to true
    - Test idempotency (updating same step multiple times)

- [ ] 9. Implement API Route: POST /api/projects
  - [ ] 9.1 Create Route Handler for project creation
    - Implement POST handler in app/api/projects/route.ts
    - Validate request body (title, description required, mediaUrl optional)
    - Require authentication (get user ID from session)
    - Create project record with author_id
    - Return created project
    - _Requirements: 8.3, 8.4, 10.3, 10.7, 10.8_

  - [ ] 9.2 Write integration tests for POST /api/projects
    - Test successful project creation with authenticated user
    - Test 401 response without authentication
    - Test 400 response with missing required fields
    - Verify project record exists in database
    - Verify author_id matches authenticated user

- [ ] 10. Implement API Route: GET /api/projects
  - [ ] 10.1 Create Route Handler for retrieving all projects with author info and reactions
    - Implement GET handler in app/api/projects/route.ts
    - Fetch all projects with JOIN to users table for author username
    - Include reaction count for each project
    - Include hasReacted flag for current user (if authenticated)
    - Sort projects by created_at DESC (newest first)
    - Return projects array
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.3, 9.5, 10.4, 10.7, 10.8_

  - [ ] 10.2 Write property test for project card field completeness
    - **Property 8: Project card field completeness**
    - **Validates: Requirements 7.2**

  - [ ] 10.3 Write property test for project list chronological sorting
    - **Property 9: Project list chronological sorting**
    - **Validates: Requirements 7.3**

  - [ ] 10.4 Write property test for reaction count display accuracy
    - **Property 10: Reaction count display accuracy**
    - **Validates: Requirements 9.3**

  - [ ] 10.5 Write integration tests for GET /api/projects
    - Test successful retrieval of all projects
    - Test projects are sorted by created_at DESC
    - Test author username is included for each project
    - Test reaction count is accurate
    - Test hasReacted flag is correct for authenticated user
    - Test empty array returned when no projects exist

- [ ] 11. Implement API Route: POST /api/reactions
  - [ ] 11.1 Create Route Handler for creating reactions with duplicate prevention
    - Implement POST handler in app/api/reactions/route.ts
    - Validate request body (projectId required, reactionType defaults to 'like')
    - Require authentication (get user ID from session)
    - Check for existing reaction (user_id + project_id)
    - Return 409 Conflict if duplicate reaction exists
    - Create reaction record if not duplicate
    - Return created reaction
    - _Requirements: 9.2, 9.4, 10.5, 10.7, 10.8_

  - [ ] 11.2 Write property test for duplicate reaction prevention
    - **Property 11: Duplicate reaction prevention**
    - **Validates: Requirements 9.4**

  - [ ] 11.3 Write property test for reaction button active state consistency
    - **Property 12: Reaction button active state consistency**
    - **Validates: Requirements 9.5**

  - [ ] 11.4 Write integration tests for POST /api/reactions
    - Test successful reaction creation with authenticated user
    - Test 401 response without authentication
    - Test 409 response when user already reacted to project
    - Test 400 response with invalid projectId
    - Verify reaction record exists in database
    - Verify unique constraint prevents duplicate reactions

- [ ] 12. Checkpoint - Ensure all API routes and database tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement countdown timer utility and hook
  - [ ] 13.1 Create countdown calculation utility function
    - Write calculateTimeRemaining function (target date → days/hours/minutes/seconds)
    - Handle edge cases (past dates, invalid dates)
    - _Requirements: 2.5_

  - [ ] 13.2 Write property test for countdown time calculation accuracy
    - **Property 1: Countdown time calculation accuracy**
    - **Validates: Requirements 2.5**

  - [ ] 13.3 Create useCountdown custom hook with client-side timer
    - Implement useCountdown hook with setInterval for real-time updates
    - Return TimeRemaining object
    - Clean up interval on unmount
    - _Requirements: 1.1, 2.5_

  - [ ] 13.4 Write unit tests for countdown timer utility
    - Test correct calculation for various date differences
    - Test handling of past dates
    - Test edge cases (same date, far future dates)

- [ ] 14. Implement form validation utilities
  - Create validateUsername function (alphanumeric, hyphens, underscores only)
  - Create validateRequired function for required fields
  - Create validateUrl function for optional media URLs
  - Create useFormValidation custom hook for form state management
  - _Requirements: 4.2, 4.3, 8.3_

- [ ] 15. Implement Landing Page
  - [ ] 15.1 Create Landing Page layout and structure
    - Create app/page.tsx as Server Component
    - Fetch countdown target from environment variable
    - Implement responsive layout (mobile/desktop)
    - Follow Figma design specifications
    - _Requirements: 1.1, 1.5, 15.1, 15.2, 17.2, 17.3_

  - [ ] 15.2 Create CountdownTimer client component
    - Implement CountdownTimer as Client Component with 'use client'
    - Use useCountdown hook for real-time updates
    - Display days, hours, minutes, seconds with labels
    - Style according to design system
    - _Requirements: 1.1, 2.5, 17.1, 17.2_

  - [ ] 15.3 Create CTAButton component with modal trigger
    - Implement CTAButton as Client Component
    - Add "Get Started" label
    - Handle onClick to open OnboardingModal
    - Add hover animations with Framer Motion
    - _Requirements: 1.2, 1.3, 16.1, 17.1_

  - [ ] 15.4 Write unit tests for Landing Page components
    - Test CountdownTimer displays all time units
    - Test CTAButton opens modal on click
    - Test responsive layout at different viewports
    - Test countdown updates every second

- [ ] 16. Implement Onboarding Modal structure and navigation
  - [ ] 16.1 Create OnboardingModal client component with state management
    - Implement OnboardingModal as Client Component
    - Manage currentStep state (1-7)
    - Manage formData state (username, awsccId)
    - Manage completedSteps state (Set<number>)
    - Add modal open/close animations with Framer Motion
    - _Requirements: 3.1, 3.4, 16.1, 16.2, 16.3_

  - [ ] 16.2 Create StepNavigation component with progress indicator
    - Implement StepNavigation with Next/Back buttons
    - Display "Step N of 7" indicator
    - Allow clicking on step numbers to navigate
    - Disable Next button when canProceed is false
    - Add transition animations between steps
    - _Requirements: 3.2, 3.3, 3.5, 16.3_

  - [ ] 16.3 Write property test for onboarding navigation consistency
    - **Property 2: Onboarding navigation consistency**
    - **Validates: Requirements 3.3, 5.5**

  - [ ] 16.4 Write property test for form data preservation across navigation
    - **Property 3: Form data preservation across navigation**
    - **Validates: Requirements 3.4**

  - [ ] 16.5 Write property test for step indicator display accuracy
    - **Property 4: Step indicator display accuracy**
    - **Validates: Requirements 3.5**

  - [ ] 16.6 Write unit tests for OnboardingModal navigation
    - Test navigation from step 1 to step 7
    - Test back button navigation
    - Test step indicator click navigation
    - Test form data persists across navigation
    - Test modal animations

- [ ] 17. Implement Onboarding Modal steps 1, 3, 7 (non-form steps)
  - Create Step1 component (Welcome screen)
  - Create Step3 component (Information screen)
  - Create Step7 component (Completion screen with redirect)
  - Add content and styling according to design
  - _Requirements: 3.1, 17.2, 17.3_

- [ ] 18. Implement Onboarding Modal Step 2 (User Info Form)
  - [ ] 18.1 Create UserInfoForm client component with validation
    - Implement UserInfoForm with controlled inputs
    - Add username and awsccId input fields
    - Implement real-time validation with error messages
    - Handle form submission (call POST /api/users)
    - Display loading state during submission
    - Handle success (store session, proceed to step 3)
    - Handle errors (display inline error messages)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 18.2_

  - [ ] 18.2 Write property test for validation error inline display
    - **Property 18: Validation error inline display**
    - **Validates: Requirements 18.2**

  - [ ] 18.3 Write unit tests for UserInfoForm
    - Test username validation (valid and invalid patterns)
    - Test awsccId required validation
    - Test form submission with valid data
    - Test error display for duplicate username
    - Test loading state during submission

- [ ] 19. Implement Accordion component for setup steps
  - Create Accordion client component with expand/collapse functionality
  - Support multiple sections open simultaneously
  - Add smooth expand/collapse animations with Framer Motion
  - Style according to design system
  - _Requirements: 6.4, 6.5, 16.1, 17.2_

- [ ] 20. Implement Onboarding Modal Steps 4, 5, 6 (Setup Steps with Accordions)
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
    - Manage user session state
    - Provide useAuth hook for accessing current user
    - Handle session persistence across page refreshes
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
  - Ensure environment variables are properly scoped (NEXT_PUBLIC_ prefix)
  - Verify input sanitization on all user inputs
  - Test CSRF protection on API routes
  - Ensure service role key is never exposed to client
  - _Requirements: 19.5_

- [ ] 33. End-to-end testing
  - [ ] 33.1 Write E2E test for complete onboarding flow
    - Test landing page → click "Get Started" → complete all 7 steps → reach showcase
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

# Requirements Document

## Introduction

The AWS Community Showcase is a web platform designed to showcase AWS Community projects in a Linear.app-inspired interface. The platform enables community members to share their projects, track their onboarding progress through guided setup steps, and engage with other members' projects through reactions. The system consists of a Next.js frontend, Express.js backend API, and Supabase database, featuring smooth animations and a modern, professional aesthetic.

## Glossary

- **Platform**: The complete AWS Community Showcase web application system
- **Landing_Page**: The initial page users see with countdown timer and CTA
- **Onboarding_Modal**: The multi-step guided setup flow for new users
- **Showcase_Page**: The main page displaying all community projects with interaction capabilities
- **Frontend**: The Next.js client application with MagicUI components
- **Backend_API**: The Express.js REST API server
- **Database**: The Supabase database storing all application data
- **User**: A community member with username and AWSCC ID
- **Project**: A community member's submitted work displayed on the Showcase_Page
- **Reaction**: A user's engagement response to a Project (like, emoji, etc.)
- **Onboarding_Progress**: Tracking data for which onboarding steps a User has completed
- **Setup_Step**: An individual step in the Onboarding_Modal (Steps 4-6 use accordions)
- **Countdown_Timer**: A configurable timer component on the Landing_Page
- **CTA_Button**: Call-to-action button that triggers the Onboarding_Modal

## Requirements

### Requirement 1: Landing Page Display

**User Story:** As a visitor, I want to see an engaging landing page with event information, so that I understand when the event occurs and can get started.

#### Acceptance Criteria

1. THE Landing_Page SHALL display a Countdown_Timer showing time remaining until a configured event
2. THE Landing_Page SHALL display a CTA_Button labeled "Get Started"
3. WHEN the CTA_Button is clicked, THE Platform SHALL open the Onboarding_Modal at Step 1
4. THE Countdown_Timer SHALL use a configurable target date and time stored in the Database
5. THE Landing_Page SHALL follow the design specifications from the provided Figma file

### Requirement 2: Countdown Timer Configuration

**User Story:** As an administrator, I want to easily update the countdown timer target, so that I can configure it for different events without code changes.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint to retrieve the countdown target datetime
2. THE Backend_API SHALL provide an endpoint to update the countdown target datetime
3. THE Database SHALL store the countdown target datetime with timezone information
4. WHEN the countdown target datetime is updated, THE Landing_Page SHALL reflect the new target within 5 seconds
5. THE Countdown_Timer SHALL display days, hours, minutes, and seconds remaining

### Requirement 3: Onboarding Modal Navigation

**User Story:** As a new user, I want to navigate through onboarding steps at my own pace, so that I can review information and return to previous steps as needed.

#### Acceptance Criteria

1. THE Onboarding_Modal SHALL display exactly 4 sequential steps
2. THE Onboarding_Modal SHALL allow navigation to the next step via a "Next" or "Continue" button
3. THE Onboarding_Modal SHALL allow navigation to any previous step via a "Back" button or step indicator
4. WHEN a User navigates between steps, THE Onboarding_Modal SHALL preserve previously entered data
5. THE Onboarding_Modal SHALL display the current step number and total steps (e.g., "Step 2 of 4")

### Requirement 4: User Information Collection

**User Story:** As a new user, I want to provide my username and optional AWSCC ID during onboarding, so that I can create my profile and participate in the community.

#### Acceptance Criteria

1. THE Onboarding_Modal SHALL display a form at Step 2 with fields for username and optional AWSCC ID
2. THE Frontend SHALL validate that username contains only alphanumeric characters, hyphens, and underscores
3. THE Frontend SHALL accept AWSCC ID as optional
4. WHEN the User submits valid information, THE Backend_API SHALL create a User record in the Database
5. IF the username already exists, THEN THE Frontend SHALL display an error message "Username already taken"
6. THE Backend_API SHALL return a unique user identifier upon successful User creation

### Requirement 5: Onboarding Progress Tracking

**User Story:** As a user, I want my progress through onboarding steps to be saved, so that I can mark steps as complete while still being able to revisit them.

#### Acceptance Criteria

1. THE Database SHALL store Onboarding_Progress for each User indicating which steps are marked complete
2. THE Onboarding_Modal SHALL display a "Mark as Done" checkbox or button for setup steps (if present)
3. WHEN a User marks a Setup_Step as done, THE Backend_API SHALL update the Onboarding_Progress in the Database
4. WHEN a User returns to a previously completed Setup_Step, THE Onboarding_Modal SHALL display the step as marked complete
5. THE Onboarding_Modal SHALL allow Users to navigate to any step regardless of completion status

### Requirement 6: Setup Steps with Accordion Components

**User Story:** As a user, I want to view detailed setup instructions in an organized accordion format, so that I can focus on one section at a time.

#### Acceptance Criteria

1. THE Onboarding_Modal SHALL display setup steps with an accordion component when included
2. THE Frontend SHALL allow multiple accordion sections to be open simultaneously within a single step
3. WHEN a User clicks an accordion section header, THE Frontend SHALL expand that section and display its content

### Requirement 7: Showcase Page Display

**User Story:** As a user, I want to view all community projects in a showcase layout, so that I can discover what others have built.

#### Acceptance Criteria

1. THE Showcase_Page SHALL display all Projects from the Database in a grid or card layout
2. THE Showcase_Page SHALL display for each Project: title, description, author username, and creation timestamp
3. THE Showcase_Page SHALL display Projects in reverse chronological order (newest first)
4. WHEN the Showcase_Page loads, THE Frontend SHALL retrieve all Projects via the Backend_API
5. THE Showcase_Page SHALL follow a padlet.com-inspired layout with visual cards

### Requirement 8: Project Submission

**User Story:** As a user, I want to post my project to the showcase, so that I can share my work with the community.

#### Acceptance Criteria

1. THE Showcase_Page SHALL display a "Create Project" or "Add Project" button
2. WHEN the create button is clicked, THE Frontend SHALL display a project submission form
3. THE project submission form SHALL include fields for title, description, and optional media URL
4. WHEN a User submits a valid project, THE Backend_API SHALL create a Project record in the Database
5. WHEN a Project is successfully created, THE Showcase_Page SHALL display the new Project within 3 seconds

### Requirement 9: Project Reactions

**User Story:** As a user, I want to react to other users' projects, so that I can show appreciation and engagement.

#### Acceptance Criteria

1. THE Showcase_Page SHALL display a reaction button or icon on each Project card
2. WHEN a User clicks a reaction button, THE Backend_API SHALL create a Reaction record in the Database
3. THE Showcase_Page SHALL display the total count of Reactions for each Project
4. THE Backend_API SHALL prevent duplicate Reactions from the same User on the same Project
5. WHEN a User has already reacted to a Project, THE Frontend SHALL display the reaction button in an active or highlighted state

### Requirement 10: Backend API Structure

**User Story:** As a developer, I want a well-structured REST API, so that the frontend can reliably interact with the backend services.

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint POST /api/users to create User records
2. THE Backend_API SHALL provide an endpoint GET /api/users/:id to retrieve User information
3. THE Backend_API SHALL provide an endpoint POST /api/projects to create Project records
4. THE Backend_API SHALL provide an endpoint GET /api/projects to retrieve all Projects
5. THE Backend_API SHALL provide an endpoint POST /api/reactions to create Reaction records
6. THE Backend_API SHALL provide an endpoint PATCH /api/users/:id/progress to update Onboarding_Progress
7. THE Backend_API SHALL return appropriate HTTP status codes (200, 201, 400, 404, 500)
8. THE Backend_API SHALL return error responses in a consistent JSON format with error message

### Requirement 11: Database Schema for Users

**User Story:** As a developer, I want a properly structured Users table, so that user data is stored consistently and efficiently.

#### Acceptance Criteria

1. THE Database SHALL contain a Users table with columns: id (UUID primary key), username (unique text), awscc_id (text), created_at (timestamp), updated_at (timestamp)
2. THE Database SHALL enforce uniqueness constraint on the username column
3. THE Database SHALL automatically set created_at to current timestamp on User creation
4. THE Database SHALL automatically update updated_at to current timestamp on User modification
5. THE Database SHALL use UUID version 4 for the id column

### Requirement 12: Database Schema for Projects

**User Story:** As a developer, I want a properly structured Projects table, so that project data is stored with proper relationships and metadata.

#### Acceptance Criteria

1. THE Database SHALL contain a Projects table with columns: id (UUID primary key), title (text), description (text), media_url (nullable text), author_id (UUID foreign key to Users), created_at (timestamp), updated_at (timestamp)
2. THE Database SHALL enforce a foreign key constraint from author_id to Users.id
3. THE Database SHALL automatically set created_at to current timestamp on Project creation
4. THE Database SHALL automatically update updated_at to current timestamp on Project modification
5. WHEN a User is deleted, THE Database SHALL handle the cascade behavior for associated Projects

### Requirement 13: Database Schema for Reactions

**User Story:** As a developer, I want a properly structured Reactions table, so that user engagement is tracked without duplicates.

#### Acceptance Criteria

1. THE Database SHALL contain a Reactions table with columns: id (UUID primary key), user_id (UUID foreign key to Users), project_id (UUID foreign key to Projects), reaction_type (text), created_at (timestamp)
2. THE Database SHALL enforce a unique constraint on the combination of user_id and project_id
3. THE Database SHALL enforce foreign key constraints from user_id to Users.id and project_id to Projects.id
4. THE Database SHALL automatically set created_at to current timestamp on Reaction creation
5. THE reaction_type column SHALL store values such as "like", "heart", or other reaction identifiers

### Requirement 14: Database Schema for Onboarding Progress

**User Story:** As a developer, I want to track which onboarding steps users have completed, so that the UI can display accurate progress state.

#### Acceptance Criteria

1. THE Database SHALL contain an Onboarding_Progress table with columns: id (UUID primary key), user_id (UUID foreign key to Users), step_number (integer), is_completed (boolean), completed_at (nullable timestamp), updated_at (timestamp)
2. THE Database SHALL enforce a unique constraint on the combination of user_id and step_number
3. THE Database SHALL enforce a foreign key constraint from user_id to Users.id
4. THE step_number column SHALL store integer values from 1 to 4
5. WHEN is_completed changes from false to true, THE Backend_API SHALL set completed_at to current timestamp

### Requirement 15: Responsive Design

**User Story:** As a user on any device, I want the platform to work smoothly on my screen size, so that I can access it from desktop, tablet, or mobile.

#### Acceptance Criteria

1. THE Frontend SHALL render correctly on viewport widths from 320px to 2560px
2. THE Landing_Page SHALL adapt layout for mobile (single column) and desktop (multi-column) viewports
3. THE Onboarding_Modal SHALL be readable and functional on mobile devices with viewport width of 375px or greater
4. THE Showcase_Page SHALL adjust grid columns based on viewport width (1 column mobile, 2-4 columns desktop)
5. THE Frontend SHALL use responsive typography that scales appropriately across viewport sizes

### Requirement 16: Animation and Motion

**User Story:** As a user, I want smooth and professional animations throughout the interface, so that the experience feels polished and engaging.

#### Acceptance Criteria

1. THE Frontend SHALL use Framer Motion or a motion library for component animations
2. WHEN the Onboarding_Modal opens, THE Frontend SHALL animate the modal entrance with a fade and scale effect
3. WHEN navigating between onboarding steps, THE Frontend SHALL animate the transition with a slide or fade effect
4. WHEN Projects load on the Showcase_Page, THE Frontend SHALL stagger the card entrance animations
5. THE Frontend SHALL complete all animations within 300ms to maintain perceived performance

### Requirement 17: Design System Consistency

**User Story:** As a user, I want a consistent visual design throughout the platform, so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. THE Frontend SHALL use MagicUI components for all UI elements where applicable
2. THE Frontend SHALL follow the design specifications from the provided Figma file for colors, typography, and spacing
3. THE Frontend SHALL implement a Linear.app-inspired aesthetic with clean lines and minimal visual noise
4. THE Frontend SHALL use a consistent color palette defined in a central theme configuration
5. THE Frontend SHALL use consistent spacing units (4px, 8px, 16px, 24px, 32px) throughout the interface

### Requirement 18: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when errors occur, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a Backend_API request fails, THE Frontend SHALL display a user-friendly error message
2. WHEN form validation fails, THE Frontend SHALL display inline error messages next to the relevant fields
3. WHEN a Project is successfully created, THE Frontend SHALL display a success notification
4. WHEN a Reaction is successfully added, THE Frontend SHALL provide immediate visual feedback
5. THE Frontend SHALL display loading states during asynchronous operations lasting longer than 200ms

### Requirement 19: Authentication and Session Management

**User Story:** As a user, I want to remain logged in across page refreshes, so that I don't have to re-enter my information repeatedly.

#### Acceptance Criteria

1. THE Platform SHALL use Supabase authentication for user session management
2. WHEN a User completes onboarding, THE Platform SHALL create an authenticated session
3. THE Frontend SHALL persist the user session across page refreshes using secure storage
4. WHEN a User returns to the Platform, THE Frontend SHALL automatically restore their session if valid
5. THE Backend_API SHALL validate the user session token on protected endpoints

### Requirement 20: Technology Stack Compliance

**User Story:** As a developer, I want the platform built with modern, up-to-date technologies, so that it remains maintainable and secure.

#### Acceptance Criteria

1. THE Frontend SHALL use Next.js version 15.0 or later with App Router architecture
2. THE Backend_API SHALL use Express.js version 4.18 or later
3. THE Platform SHALL use Supabase client library version 2.0 or later
4. THE Frontend SHALL use TypeScript version 5.0 or later for type safety
5. THE Platform SHALL use React version 18.0 or later
6. THE Frontend SHALL use Tailwind CSS version 4.0 or later for styling
7. THE Frontend SHALL use MagicUI components compatible with React 18+

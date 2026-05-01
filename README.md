# AWS Community Showcase

A fullstack Next.js 15+ application that enables AWS community members to share projects, complete guided onboarding, and engage with each other's work. Features a Linear.app-inspired aesthetic with smooth animations and a comprehensive project showcase interface.

## Technology Stack

- **Framework**: Next.js 16.2.4 (15+) with App Router
- **Runtime**: React 19.2.4 (18+)
- **Language**: TypeScript 5.0+
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4.0+
- **Animation**: Framer Motion
- **Deployment**: Vercel

## Prerequisites

- Node.js v25.8.2 or later
- npm v11.11.1 or later
- Supabase account and project

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd project-showcase
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and update with your Supabase credentials:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Get these from your Supabase project settings (Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Configure your countdown timer target
NEXT_PUBLIC_COUNTDOWN_TARGET=2024-12-31T23:59:59Z
NEXT_PUBLIC_COUNTDOWN_TIMEZONE=America/New_York

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up Supabase database

Run the database migrations in your Supabase project (SQL Editor):

1. Create the `users` table
2. Create the `projects` table
3. Create the `reactions` table
4. Create the `onboarding_progress` table
5. Set up Row Level Security (RLS) policies
6. Configure authentication settings

See `.kiro/specs/aws-community-showcase/design.md` for complete SQL schema.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
project-showcase/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API Route Handlers
│   │   ├── showcase/          # Showcase page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── landing/          # Landing page components
│   │   ├── onboarding/       # Onboarding modal components
│   │   └── showcase/         # Showcase page components
│   ├── lib/                   # Utility functions
│   │   └── supabase.ts       # Supabase client configuration
│   └── types/                 # TypeScript type definitions
│       └── index.ts          # Core types and interfaces
├── .env.local                 # Environment variables (not in git)
├── .env.example              # Example environment variables
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Design System

The application follows a Linear.app-inspired design system with:

- **Colors**: Centralized theme configuration in `tailwind.config.ts`
- **Typography**: Consistent font families, sizes, and weights
- **Spacing**: 4px base unit system (4, 8, 16, 24, 32, 48, 64)
- **Animations**: Framer Motion for smooth, performant transitions (300ms duration)

See `src/app/globals.css` and `tailwind.config.ts` for complete design system configuration.

## Key Features

1. **Landing Page**: Countdown timer and call-to-action button
2. **Onboarding Modal**: 7-step guided setup with progress tracking
3. **User Authentication**: Supabase Auth integration with session management
4. **Project Showcase**: Grid layout with project cards and reactions
5. **Project Creation**: Form-based project submission
6. **Reactions**: Like/react to community projects
7. **Responsive Design**: Mobile-first approach (320px-2560px)
8. **Smooth Animations**: Framer Motion throughout

## Development

### TypeScript Configuration

The project uses TypeScript strict mode with path aliases:

- `@/*` maps to `./src/*`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

The application implements the following API endpoints as Next.js Route Handlers:

- `POST /api/users` - Create user account
- `GET /api/users/[id]` - Retrieve user information
- `PATCH /api/users/[id]/progress` - Update onboarding progress
- `POST /api/projects` - Create new project
- `GET /api/projects` - Retrieve all projects
- `POST /api/reactions` - Create reaction to project

See `.kiro/specs/aws-community-showcase/design.md` for complete API documentation.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables in Vercel project settings
4. Deploy

The application will automatically deploy on every push to the main branch.

## Documentation

- **Requirements**: `.kiro/specs/aws-community-showcase/requirements.md`
- **Design**: `.kiro/specs/aws-community-showcase/design.md`
- **Tasks**: `.kiro/specs/aws-community-showcase/tasks.md`

## License

Private project for AWS Community.

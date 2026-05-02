/**
 * Core TypeScript Types and Interfaces
 * AWS Community Showcase
 */

// ============================================================================
// Data Models
// ============================================================================

export interface User {
  id: string; // UUID — equals auth.uid() for users created via onboarding (anonymous sign-in)
  username: string;
  awsccId?: string;
  avatarUrl?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Project {
  id: string; // UUID
  title: string;
  description: string;
  url?: string;
  mediaUrl?: string;
  authorId: string; // UUID
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface EmojiReaction {
  emoji: string;
  count: number;
  hasReacted: boolean; // whether the current user reacted with this emoji
  reactors: Array<{ userId: string; username: string }>; // who reacted with this emoji
}

export interface ProjectWithAuthor extends Project {
  author: {
    username: string;
    avatarUrl?: string;
  };
  reactions: EmojiReaction[];
  reactionCount: number; // total across all emojis
  hasReacted: boolean; // any emoji by current user
  reactedEmojis: string[]; // all emojis the current user has reacted with
  commentCount: number;
  topComments: CommentWithAuthor[]; // up to 2 most recent comments
}

export interface Comment {
  id: string;
  userId: string;
  projectId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentWithAuthor extends Comment {
  author: { username: string; avatarUrl?: string };
}

export interface CreateCommentRequest { projectId: string; content: string; }
export interface CreateCommentResponse { comment: CommentWithAuthor; }
export interface GetCommentsResponse { comments: CommentWithAuthor[]; }

export interface Reaction {
  id: string; // UUID
  userId: string; // UUID
  projectId: string; // UUID
  reactionType: string; // 'like', 'heart', etc.
  createdAt: string; // ISO 8601
}

export interface OnboardingProgress {
  id: string; // UUID
  userId: string; // UUID
  stepNumber: number; // 1-7
  isCompleted: boolean;
  completedAt?: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// POST /api/users
export interface CreateUserRequest {
  username: string;
  awsccId?: string;
  avatarUrl?: string;
}

export interface CreateUserResponse {
  // No session token: the client signs in anonymously via supabase.auth.signInAnonymously()
  // before calling POST /api/users, and Supabase persists the session in localStorage.
  user: User;
}

// GET /api/users/[id]
export interface GetUserResponse {
  user: User;
  onboardingProgress: OnboardingProgress[];
}

// POST /api/projects
export interface CreateProjectRequest {
  title: string;
  description: string;
  url?: string;
  mediaUrl?: string;
}

export interface CreateProjectResponse {
  project: Project;
}

// GET /api/projects
export interface GetProjectsResponse {
  projects: ProjectWithAuthor[];
}

// POST /api/reactions
export interface CreateReactionRequest {
  projectId: string;
  reactionType?: string; // Defaults to 'like'
}

export interface CreateReactionResponse {
  reaction: Reaction;
}

// PATCH /api/users/[id]/progress
export interface UpdateProgressRequest {
  stepNumber: number;
  isCompleted: boolean;
}

export interface UpdateProgressResponse {
  progress: OnboardingProgress;
}

// Error Response
export interface ErrorResponse {
  error: string; // Error type/category
  message: string; // Human-readable description
  details?: unknown; // Optional additional context
}

// ============================================================================
// Component Props Types
// ============================================================================

// Countdown Timer
export interface CountdownTimerProps {
  targetDate: string; // ISO 8601 format
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// CTA Button
export interface CTAButtonProps {
  onClick: () => void;
  label: string;
}

// Onboarding Modal
export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string; // For returning users
}

export interface OnboardingState {
  currentStep: number; // 1-7
  formData: {
    username: string;
    awsccId?: string;
    avatarUrl?: string;
  };
  completedSteps: Set<number>;
}

// Step Navigation
export interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onStepClick: (step: number) => void;
  canProceed: boolean;
}

// User Info Form
export interface UserInfoFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  initialData?: UserFormData;
}

export interface UserFormData {
  username: string;
  awsccId?: string;
  avatarUrl?: string;
}

export interface ValidationErrors {
  username?: string;
  awsccId?: string;
  avatarUrl?: string;
}

// Setup Step
export interface SetupStepProps {
  stepNumber: number;
  title: string;
  sections: AccordionSection[];
  isCompleted: boolean;
  onMarkComplete: (stepNumber: number) => Promise<void>;
}

export interface AccordionSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

// Project Grid
export interface ProjectGridProps {
  initialProjects: Project[];
}

// Project Card
export interface ProjectCardProps {
  project: ProjectWithAuthor;
  currentUserId: string;
  onReact: (projectId: string) => Promise<void>;
}

// Create Project Button
export interface CreateProjectButtonProps {
  onClick: () => void;
}

// Project Form
export interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

export interface ProjectFormData {
  title: string;
  description: string;
  url: string;
  mediaUrl?: string;
}

// Reaction Button
export interface ReactionButtonProps {
  projectId: string;
  reactionCount: number;
  hasReacted: boolean;
  onReact: () => Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type ApiResponse<T> = {
  data?: T;
  error?: ErrorResponse;
};

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: ErrorResponse | null;
};

// ==========================================
// Question & Quiz Domain DTOs
// ==========================================

export type QuestionStatus = 'verified' | 'pending' | 'quarantined' | 'rejected';

export interface Question {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  created_by_user: string | null;
  status?: QuestionStatus;
  dispute_count?: number;
  created_at: string;
}

export interface ClientQuestion {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  status?: QuestionStatus;
  created_by?: string | null;
  created_at?: string;
}

export interface QuestionDispute {
  id: string;
  question_id: string;
  reason: string;
  created_at: string;
}

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CreateQuestionInput {
  prompt: string;
  options: string[];
  correctIndex: number;
  category?: string;
  explanation?: string;
}

export interface QuestionAnalytics {
  question_id: string;
  prompt: string;
  play_count: number;
  accuracy_rate: number;
}

export interface QuizResult {
  id: string;
  user_id: string;
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  answered_at: string;
}

export type AnswerNotSavedReason =
  | 'signed-out'
  | 'already-answered'
  | 'own-question'
  | 'rate-limited'
  | 'error';

export interface AnswerSubmissionResult {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string | null;
  recorded: boolean;
  notSavedReason?: AnswerNotSavedReason;
}

export interface HistoryItem {
  questionId: string;
  prompt: string;
  isCorrect: boolean;
}

// ==========================================
// User, Profile & Leaderboard DTOs
// ==========================================

export interface UserStats {
  score: number;
  streak: number;
  bestStreak: number;
  accuracy: number;
  totalAnswered: number;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  score: number;
  accuracy: number;
  rank: number;
}

export interface UserBackupData {
  accountId: string;
  exportedAt: string;
  version: string;
  quizzes: Question[];
  stats: QuizResult[];
  isTruncated?: boolean;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface GetUserQuizzesFilter extends PaginationParams {
  category?: string;
  status?: QuestionStatus;
}

export interface UserQuizzesResult {
  quizzes: ClientQuestion[];
  count: number;
}

// ==========================================
// Community & Social DTOs
// ==========================================

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface RatingSummary {
  average: number | null;
  count: number;
}

export interface CommentView {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  mine: boolean;
}

export interface SuggestionView {
  id: string;
  questionId: string;
  questionPrompt: string;
  body: string;
  senderName: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface DiscussionView {
  rating: RatingSummary;
  myRating: number | null;
  comments: CommentView[];
  hasMore: boolean;
}

export interface SearchResult {
  id: string;
  prompt: string;
  category: string;
  authorName: string;
  createdAt: string;
  score?: number;
}

export interface SearchResultPage {
  results: SearchResult[];
  hasMore: boolean;
}

export interface TopicInfo {
  name: string;
  questionCount: number;
  latestAt: string;
}

// ==========================================
// Auth DTOs
// ==========================================

export interface AuthSession {
  id: string;
  username: string;
}

export interface AuthResult {
  token: string;
  accountId: string;
}

export interface VerifyEmailResult {
  ok: boolean;
  token: string;
  accountId: string;
}

// ==========================================
// Common API & Result Contracts
// ==========================================

export type ActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_ALLOWED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: ActionErrorCode | string;
        message: string;
        details?: unknown;
      };
    };

export type ProfileErrorCode =
  | 'FETCH_FAILED'
  | 'EXPORT_FAILED'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR';

export type GetUserQuizzesResult =
  | { success: true; quizzes: ClientQuestion[]; count: number }
  | { success: false; error: string; code: ProfileErrorCode };

export type ExportUserDataResult =
  | { success: true; data: UserBackupData }
  | { success: false; error: string; code: ProfileErrorCode };

export type CommunityErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_ANSWERED'
  | 'NOT_ALLOWED'
  | 'INVALID'
  | 'RATE_LIMITED'
  | 'FAILED';

export type CommunityResult =
  | { ok: true }
  | { ok: false; code: CommunityErrorCode };

// Client & HTTP
export { QuickQuizClient, createClient } from './client';
export type { QuickQuizClientOptions } from './client';
export {
  HttpClient,
  setDefaultClient,
  getDefaultClient,
  isClient,
} from './http';
export type { HttpClientOptions, RequestOptions, ClientLike } from './http';

// Errors
export { QuickQuizError } from '../errors';

// Data contracts & types
export * from '../types';

// Auth
export {
  AuthResource,
  signUp,
  signIn,
  signInWithGoogle,
  requestEmailCode,
  verifyEmailCode,
  getSession,
  session,
  signOut,
} from './auth';

// Questions
export {
  QuestionsResource,
  getRandomQuestion,
  randomQuestion,
  getQuestionById,
  getQuestion,
  getQuestionCount,
  countQuestions,
  createQuestion,
  generateQuestion,
  disputeQuestion,
  get5050EliminatedIndices,
  fiftyFifty,
} from './questions';
export type { RandomQuestionOptions } from './questions';

// Quiz
export {
  QuizResource,
  submitQuizAnswer,
  submitAnswer,
  getAnswerHistory,
  getQuizHistory,
  getUserStats,
  getQuizStats,
} from './quiz';

// Leaderboard
export {
  LeaderboardResource,
  getGlobalLeaderboard,
  globalLeaderboard,
  getGroupLeaderboard,
  groupLeaderboard,
} from './leaderboard';

// Groups
export {
  GroupsResource,
  createGroup,
  listGroups,
  joinGroup,
  leaveGroup,
} from './groups';

// Community
export {
  CommunityResource,
  rateQuestion,
  addComment,
  commentQuestion,
  deleteComment,
  resolveSuggestion,
  getQuestionDiscussion,
  getDiscussion,
  getSuggestions,
} from './community';

// Discovery
export {
  DiscoveryResource,
  searchQuestions,
  search,
  getTopics,
  getTopicQuestions,
} from './discovery';
export type { SearchOptions } from './discovery';

// Profile
export {
  ProfileResource,
  getUserQuizzes,
  exportUserData,
  exportProfileData,
  getQuestionAnalytics,
} from './profile';

// Storage
export { StorageManager } from '../storage';
export type { StorageManagerOptions } from '../storage';

import type {
  ActionResult,
  ClientQuestion,
  CreateQuestionInput,
  LeaderboardEntry,
  Question,
  QuizResult,
  UserStats,
} from './types';

// ==========================================
// Runtime Type Guards
// ==========================================

export function isQuestion(val: unknown): val is Question {
  if (!val || typeof val !== 'object') return false;
  const q = val as Record<string, unknown>;
  return (
    typeof q.id === 'string' &&
    typeof q.category === 'string' &&
    typeof q.prompt === 'string' &&
    Array.isArray(q.options) &&
    typeof q.correct_index === 'number' &&
    typeof q.created_at === 'string'
  );
}

export function isClientQuestion(val: unknown): val is ClientQuestion {
  if (!val || typeof val !== 'object') return false;
  const q = val as Record<string, unknown>;
  return (
    typeof q.id === 'string' &&
    typeof q.category === 'string' &&
    typeof q.prompt === 'string' &&
    Array.isArray(q.options)
  );
}

export function isQuizResult(val: unknown): val is QuizResult {
  if (!val || typeof val !== 'object') return false;
  const r = val as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.question_id === 'string' &&
    typeof r.answer_index === 'number' &&
    typeof r.is_correct === 'boolean' &&
    typeof r.answered_at === 'string'
  );
}

export function isUserStats(val: unknown): val is UserStats {
  if (!val || typeof val !== 'object') return false;
  const s = val as Record<string, unknown>;
  return (
    typeof s.score === 'number' &&
    typeof s.streak === 'number' &&
    typeof s.bestStreak === 'number' &&
    typeof s.accuracy === 'number' &&
    typeof s.totalAnswered === 'number'
  );
}

export function isLeaderboardEntry(val: unknown): val is LeaderboardEntry {
  if (!val || typeof val !== 'object') return false;
  const e = val as Record<string, unknown>;
  return (
    typeof e.user_id === 'string' &&
    typeof e.score === 'number' &&
    typeof e.accuracy === 'number' &&
    typeof e.rank === 'number'
  );
}

export function isActionResult<T = void>(val: unknown): val is ActionResult<T> {
  if (!val || typeof val !== 'object') return false;
  const r = val as Record<string, unknown>;
  if (r.success === true) return 'data' in r;
  if (r.success === false) {
    return (
      typeof r.error === 'object' &&
      r.error !== null &&
      typeof (r.error as Record<string, unknown>).code === 'string' &&
      typeof (r.error as Record<string, unknown>).message === 'string'
    );
  }
  return false;
}

// ==========================================
// DTO Validators
// ==========================================

export interface ValidationOutcome {
  valid: boolean;
  errors: string[];
}

export function validateCreateQuestionInput(input: unknown): ValidationOutcome {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Input must be a non-null object'] };
  }

  const data = input as Partial<CreateQuestionInput>;

  if (typeof data.prompt !== 'string' || data.prompt.trim().length === 0) {
    errors.push('prompt is required and must be non-empty');
  }

  if (!Array.isArray(data.options) || data.options.length < 2) {
    errors.push('options must be an array of at least 2 items');
  } else if (!data.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0)) {
    errors.push('every option must be a non-empty string');
  }

  if (
    typeof data.correctIndex !== 'number' ||
    !Number.isInteger(data.correctIndex) ||
    data.correctIndex < 0 ||
    (Array.isArray(data.options) && data.correctIndex >= data.options.length)
  ) {
    errors.push('correctIndex must be an integer valid index within options');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==========================================
// Declarative JSON Schemas (standard Draft-07)
// ==========================================

export const QuestionJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Question',
  type: 'object',
  required: ['id', 'category', 'prompt', 'options', 'correct_index', 'created_at'],
  properties: {
    id: { type: 'string' },
    category: { type: 'string' },
    prompt: { type: 'string' },
    options: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
    },
    correct_index: { type: 'integer', minimum: 0 },
    explanation: { type: ['string', 'null'] },
    created_by_user: { type: ['string', 'null'] },
    status: {
      type: 'string',
      enum: ['verified', 'pending', 'quarantined', 'rejected'],
    },
    dispute_count: { type: 'integer', minimum: 0 },
    created_at: { type: 'string', format: 'date-time' },
  },
} as const;

export const CreateQuestionInputJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'CreateQuestionInput',
  type: 'object',
  required: ['prompt', 'options', 'correctIndex'],
  properties: {
    prompt: { type: 'string', minLength: 1 },
    options: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 2,
    },
    correctIndex: { type: 'integer', minimum: 0 },
    category: { type: 'string' },
    explanation: { type: 'string' },
  },
} as const;

export const QuizResultJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'QuizResult',
  type: 'object',
  required: ['id', 'user_id', 'question_id', 'answer_index', 'is_correct', 'answered_at'],
  properties: {
    id: { type: 'string' },
    user_id: { type: 'string' },
    question_id: { type: 'string' },
    answer_index: { type: 'integer', minimum: 0 },
    is_correct: { type: 'boolean' },
    answered_at: { type: 'string', format: 'date-time' },
  },
} as const;

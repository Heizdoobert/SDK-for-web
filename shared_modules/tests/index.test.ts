import { describe, expect, it } from 'vitest';
import {
  isActionResult,
  isClientQuestion,
  isLeaderboardEntry,
  isQuestion,
  isQuizResult,
  isUserStats,
  validateCreateQuestionInput,
} from '../src';

describe('@quizweb/sdk-core', () => {
  it('validates correct Question input', () => {
    const valid = validateCreateQuestionInput({
      prompt: 'What is 2 + 2?',
      options: ['3', '4', '5'],
      correctIndex: 1,
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });

  it('rejects invalid Question input', () => {
    const invalid = validateCreateQuestionInput({
      prompt: '',
      options: ['only one option'],
      correctIndex: 5,
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it('correctly identifies valid Question object with type guard', () => {
    const q = {
      id: 'q1',
      category: 'Math',
      prompt: 'What is 1 + 1?',
      options: ['1', '2'],
      correct_index: 1,
      explanation: null,
      created_by_user: null,
      created_at: new Date().toISOString(),
    };
    expect(isQuestion(q)).toBe(true);
    expect(isQuestion({ id: 'bad' })).toBe(false);
  });

  it('correctly identifies ClientQuestion', () => {
    const cq = {
      id: 'q1',
      category: 'Math',
      prompt: 'What is 1 + 1?',
      options: ['1', '2'],
    };
    expect(isClientQuestion(cq)).toBe(true);
    expect(isClientQuestion(null)).toBe(false);
  });

  it('correctly identifies QuizResult', () => {
    const qr = {
      id: 'res-1',
      user_id: 'u1',
      question_id: 'q1',
      answer_index: 1,
      is_correct: true,
      answered_at: new Date().toISOString(),
    };
    expect(isQuizResult(qr)).toBe(true);
    expect(isQuizResult({})).toBe(false);
  });

  it('correctly identifies UserStats and LeaderboardEntry', () => {
    const stats = {
      score: 100,
      streak: 5,
      bestStreak: 10,
      accuracy: 0.9,
      totalAnswered: 50,
    };
    expect(isUserStats(stats)).toBe(true);

    const entry = {
      user_id: 'u1',
      display_name: 'Player One',
      score: 100,
      accuracy: 0.9,
      rank: 1,
    };
    expect(isLeaderboardEntry(entry)).toBe(true);
  });

  it('correctly identifies ActionResult success and error', () => {
    expect(isActionResult({ success: true, data: { foo: 'bar' } })).toBe(true);
    expect(
      isActionResult({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Sign in required' },
      })
    ).toBe(true);
    expect(isActionResult({ success: false, error: 'string error' })).toBe(false);
  });
});

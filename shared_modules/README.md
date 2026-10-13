# @quizweb/sdk-core

Shared TypeScript types, DTOs, and schemas for Quick Quiz web and mobile clients.

## Features

- **Domain DTOs**: Question, QuizResult, UserStats, Leaderboard, Auth, Community.
- **API Contracts**: Standard `ActionResult<T>`, `ActionErrorCode`, pagination, profile export.
- **Runtime Guards**: `isQuestion`, `isQuizResult`, `isUserStats`, `isLeaderboardEntry`.
- **Validation**: Zero-dependency `validateCreateQuestionInput` and standard JSON Schemas.
- **Zero Runtime Dependencies**: Ultra-lightweight and compatible across Node.js, Web, and Mobile.

## Usage

```typescript
import {
  type Question,
  type QuizResult,
  validateCreateQuestionInput,
  isQuestion,
} from '@quizweb/sdk-core';
```

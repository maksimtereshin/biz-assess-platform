import { SurveyVariant } from './survey';

export interface User {
  id: string;
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  surveyVariant: SurveyVariant;
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
  isCompleted: boolean;
  currentCategory?: string;
  currentQuestionIndex: number;
}

export interface UserResponse {
  id: string;
  sessionId: string;
  questionId: string;
  answer: number;
  answeredAt: string;
}

export interface UserProgress {
  sessionId: string;
  categoryId: string;
  questionsCompleted: number;
  totalQuestions: number;
  isCompleted: boolean;
  completedAt?: string;
}
/**
 * Shared data models for the Business Assessment Platform
 * These interfaces ensure type safety between frontend and backend (DRY principle)
 * Based on TRD-39 specifications
 */

export interface User {
  telegramId: number;
  firstName: string;
  username?: string;
}

export enum SurveyType {
  EXPRESS = 'EXPRESS',
  FULL = 'FULL',
}

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  FREE = 'FREE',
  PAID = 'PAID',
}

// Represents an answer option for a survey question
export interface AnswerOption {
  id: number;
  text: string;
  value: number;
  color: string;
  range: string;
}

// Represents a single question within the survey structure
export interface SurveyQuestion {
  id: number;
  text: string;
  answers?: AnswerOption[];
}

// Represents a subcategory containing questions
export interface SurveySubcategory {
  id: string;
  name: string;
  questions: SurveyQuestion[];
}

// Represents a main category containing subcategories
export interface SurveyCategory {
  id: string;
  name: string;
  subcategories: SurveySubcategory[];
}

// The full structure of a survey
export interface Survey {
  id: number;
  type: SurveyType;
  name: string;
  structure: SurveyCategory[];
}

// Data required to start a new survey session
export interface StartSessionDto {
  telegramId: number;
  surveyType: SurveyType;
}

// Data for submitting a single answer
export interface SubmitAnswerDto {
  sessionId: string; // UUID
  questionId: number;
  score: number; // Must be an integer 1 ≤ score ≤ 10
}

// Data model for a user's survey session
export interface SurveySession {
  id: string; // UUID
  userId: number;
  surveyType: SurveyType;
  status: SessionStatus;
  answers: Record<number, number>; // { questionId: score }
  createdAt: string; // ISO 8601 Date
}

// Additional interfaces for payment and reporting functionality

export interface Payment {
  id: string; // UUID
  reportId?: string; // Optional - for report purchases
  surveySessionId?: string; // Optional - for survey retakes
  userTelegramId: number;
  telegramChargeId: string;
  amount: number; // Amount in smallest currency unit (e.g., cents)
  currency: string; // e.g., 'USD'
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  createdAt: string; // ISO 8601 Date
  updatedAt: string; // ISO 8601 Date
}

export interface Report {
  id: string; // UUID
  sessionId: string;
  paymentStatus: PaymentStatus;
  storageUrl?: string; // URL to the generated PDF file (e.g., S3)
  analyticsSummary: AnalyticsResult;
  createdAt: string; // ISO 8601 Date
}

export interface AnalyticsResult {
  overallScore: number; // Overall percentage score
  categoryScores: Record<string, number>; // { categoryId: percentage }
  subcategoryScores: Record<string, number>; // { subcategoryId: percentage }
  totalQuestions: number;
  answeredQuestions: number;
}

export interface ReferralCode {
  code: string; // Unique user-facing referral code
  userTelegramId: number;
  createdAt: string; // ISO 8601 Date
}

export interface ReferralUsage {
  id: number;
  referrerCode: string;
  newUserTelegramId: number;
  usedAt: string; // ISO 8601 Date
}

// DTOs for API communication

export interface CreateInvoiceDto {
  userId: number;
  reportId?: string;
  surveySessionId?: string;
  amount: number;
  currency: string;
}

export interface TelegramInvoice {
  title: string;
  description: string;
  payload: string;
  providerToken: string;
  currency: string;
  prices: Array<{
    label: string;
    amount: number;
  }>;
}

// Authentication related interfaces

export interface AuthToken {
  token: string;
  expiresAt: string; // ISO 8601 Date
  telegramId: number;
}

export interface TelegramWebhookPayload {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message: {
      message_id: number;
      from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username?: string;
      };
      chat: {
        id: number;
        type: string;
      };
      date: number;
    };
    data: string;
  };
}

// Error handling interfaces

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Report generation interfaces

export interface ReportEntry {
  category: string;
  subcategory: string;
  titleSummary: string;
  result: string;
  resultDescription: string;
  min: number;
  max: number;
  color: string;
}

export interface CategoryResult {
  name: string;
  score: number;
  content: ReportEntry;
  subcategories?: SubcategoryResult[];
}

export interface SubcategoryResult {
  name: string;
  score: number;
  content: ReportEntry;
}

export interface SurveyResults {
  sessionId: string;
  surveyType: 'express' | 'full';
  overallScore: number;
  overallContent: ReportEntry;
  categories: CategoryResult[];
}

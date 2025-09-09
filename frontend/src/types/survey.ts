// Local types for the frontend (separate from shared types for now)
export interface MockQuestion {
  id: number;
  text: string;
}

export interface MockSubcategory {
  id: string;
  name: string;
  questions: MockQuestion[];
}

export interface MockCategory {
  id: string;
  name: string;
  subcategories: MockSubcategory[];
}

export interface MockSurvey {
  id: number;
  type: string;
  name: string;
  structure: MockCategory[];
}

export interface SurveyState {
  currentCategoryIndex: number;
  currentSubcategoryIndex: number;
  currentQuestionIndex: number;
  answers: Record<number, number>;
  isSubmitting: boolean;
}

// Additional types from BusinessAssessmentPlatform
export interface AnswerOption {
  id: number;
  text: string;
  value: number;
  color: string;
  range: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  subcategory: string;
  hint?: string;
  answers: AnswerOption[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
  totalQuestions: number;
  completedQuestions: number;
}

export interface SurveyResponse {
  questionId: string;
  value: number;
}

export type SurveyVariant = 'express' | 'full';

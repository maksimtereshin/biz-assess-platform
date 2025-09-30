import { create } from 'zustand';
import { Survey, SurveySession, SurveyType } from 'bizass-shared';
import apiClient from '../services/api';

interface SurveyState {
  // Survey data
  survey: Survey | null;
  session: SurveySession | null;
  sessionToken: string | null;
  
  // Current position
  currentCategoryIndex: number;
  currentSubcategoryIndex: number;
  currentQuestionIndex: number;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  
  // Actions
  authenticate: (token: string, surveyType: SurveyType) => Promise<void>;
  loadSurvey: (type: string) => Promise<void>;
  loadSession: () => Promise<void>;
  submitAnswer: (questionId: number, score: number) => Promise<void>;
  completeSession: () => Promise<{ message: string; sessionId: string }>;
  setCurrentPosition: (categoryIndex: number, subcategoryIndex: number, questionIndex: number) => void;
  setCurrentPositionFromAnswers: () => void;
  moveToNextQuestion: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  // Initial state
  survey: null,
  session: null,
  sessionToken: null,
  currentCategoryIndex: 0,
  currentSubcategoryIndex: 0,
  currentQuestionIndex: 0,
  isLoading: false,
  error: null,
  isSubmitting: false,

  // Actions
  authenticate: async (token: string, surveyType: SurveyType) => {
    set({ isLoading: true, error: null });
    try {
      const { session, sessionToken } = await apiClient.authenticate(token, surveyType);
      set({ 
        session, 
        sessionToken,
        isLoading: false 
      });
      
      // Load the survey structure
      await get().loadSurvey(surveyType);
      
      // Set current position based on answered questions
      get().setCurrentPositionFromAnswers();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Authentication failed',
        isLoading: false 
      });
    }
  },

  loadSurvey: async (type: string) => {
    set({ isLoading: true, error: null });
    try {
      const survey = await apiClient.getSurveyStructure(type);
      set({ survey, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to load survey',
        isLoading: false 
      });
    }
  },

  // DEPRECATED: loadSession is no longer used - using useSurvey hook instead
  loadSession: async () => {
    set({ isLoading: true, error: null });
    // This method is deprecated and not used
    console.warn('loadSession is deprecated, use useSurvey hook instead');
    set({ isLoading: false });
  },

  submitAnswer: async (questionId: number, score: number) => {
    set({ isSubmitting: true, error: null });
    try {
      await apiClient.submitAnswer(questionId, score);
      
      // Update local session state
      const { session } = get();
      if (session) {
        const updatedSession = {
          ...session,
          answers: { ...session.answers, [questionId]: score }
        };
        set({ session: updatedSession, isSubmitting: false });
        
        // Move to next question
        get().moveToNextQuestion();
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to save answer',
        isSubmitting: false 
      });
    }
  },

  completeSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.completeSession();
      set({ isLoading: false });
      return result;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to complete session',
        isLoading: false 
      });
      throw error;
    }
  },

  setCurrentPosition: (categoryIndex: number, subcategoryIndex: number, questionIndex: number) => {
    set({ currentCategoryIndex: categoryIndex, currentSubcategoryIndex: subcategoryIndex, currentQuestionIndex: questionIndex });
  },

  setCurrentPositionFromAnswers: () => {
    const { session, survey } = get();
    if (!session || !survey) return;

    // Find the first unanswered question
    for (let categoryIndex = 0; categoryIndex < survey.structure.length; categoryIndex++) {
      const category = survey.structure[categoryIndex];
      for (let subcategoryIndex = 0; subcategoryIndex < category.subcategories.length; subcategoryIndex++) {
        const subcategory = category.subcategories[subcategoryIndex];
        for (let questionIndex = 0; questionIndex < subcategory.questions.length; questionIndex++) {
          const question = subcategory.questions[questionIndex];
          if (!session.answers[question.id]) {
            set({ 
              currentCategoryIndex: categoryIndex,
              currentSubcategoryIndex: subcategoryIndex,
              currentQuestionIndex: questionIndex
            });
            return;
          }
        }
      }
    }

    // If all questions are answered, set to the last question
    const lastCategory = survey.structure[survey.structure.length - 1];
    const lastSubcategory = lastCategory.subcategories[lastCategory.subcategories.length - 1];
    set({
      currentCategoryIndex: survey.structure.length - 1,
      currentSubcategoryIndex: lastCategory.subcategories.length - 1,
      currentQuestionIndex: lastSubcategory.questions.length - 1
    });
  },

  moveToNextQuestion: () => {
    const { survey, currentCategoryIndex, currentSubcategoryIndex, currentQuestionIndex } = get();
    if (!survey) return;

    const currentCategory = survey.structure[currentCategoryIndex];
    const currentSubcategory = currentCategory.subcategories[currentSubcategoryIndex];
    
    let nextCategoryIndex = currentCategoryIndex;
    let nextSubcategoryIndex = currentSubcategoryIndex;
    let nextQuestionIndex = currentQuestionIndex + 1;

    // Check if we've completed the current subcategory
    if (nextQuestionIndex >= currentSubcategory.questions.length) {
      nextQuestionIndex = 0;
      nextSubcategoryIndex += 1;
      
      // Check if we've completed the current category
      if (nextSubcategoryIndex >= currentCategory.subcategories.length) {
        nextSubcategoryIndex = 0;
        nextCategoryIndex += 1;
        
        // Check if we've completed the entire survey
        if (nextCategoryIndex >= survey.structure.length) {
          // Survey completed
          return;
        }
      }
    }

    set({
      currentCategoryIndex: nextCategoryIndex,
      currentSubcategoryIndex: nextSubcategoryIndex,
      currentQuestionIndex: nextQuestionIndex
    });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      survey: null,
      session: null,
      sessionToken: null,
      currentCategoryIndex: 0,
      currentSubcategoryIndex: 0,
      currentQuestionIndex: 0,
      isLoading: false,
      error: null,
      isSubmitting: false,
    });
    apiClient.clearSessionToken();
  },
}));

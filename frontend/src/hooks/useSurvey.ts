import { useState, useCallback, useEffect, useMemo } from 'react';
import { getCategoriesForVariant, getQuestionsForVariant } from '../data/surveyData';
import { SurveyVariant, Question, Category } from '../types/survey';
import { useUserSession } from './useUserSession';
import api from '../services/api';
import { SessionSyncService } from '../services/sessionSync';
import { LocalStorageService } from '../services/localStorage';
import ErrorHandler from '../utils/errorHandler';

interface SurveyState {
  responses: Record<string, number>;
  currentCategory: string | null;
  currentQuestionIndex: number;
}

export function useSurvey(initialVariant?: SurveyVariant | null) {
  const { session, createSession, getOrCreateSession, updateSessionActivity, completeSession } = useUserSession();
  const [surveyVariant, setSurveyVariant] = useState<SurveyVariant | null>(initialVariant || null);
  const [surveyState, setSurveyState] = useState<SurveyState>({
    currentCategory: null,
    currentQuestionIndex: 0,
    responses: {}
  });
  const [showResults, setShowResults] = useState<boolean>(false);

  // Get categories for current variant
  const categoriesData = useMemo(() => {
    if (!surveyVariant) return [];
    return getCategoriesForVariant(surveyVariant);
  }, [surveyVariant]);

  // Get questions for current variant
  const questionsData = useMemo(() => {
    if (!surveyVariant) return [];
    return getQuestionsForVariant(surveyVariant);
  }, [surveyVariant]);

  // Categories with completion status
  const [categoriesWithProgress, setCategoriesWithProgress] = useState<(Category & { 
    completedQuestions: number;
    questions: Question[];
  })[]>([]);

  // Initialize survey when variant is set
  useEffect(() => {
    const initializeSurvey = async () => {
      if (surveyVariant) {
        // Get or create session for this variant
        const variantSession = getOrCreateSession(surveyVariant);
        
        if (variantSession) {
          // First, try to restore from database if localStorage is empty or session is new
          const localResponses = LocalStorageService.getUserResponses(variantSession.id);
          const hasLocalData = Object.keys(localResponses).length > 0;
          
          if (!hasLocalData) {
            // Try to restore from database
            try {
              const user = LocalStorageService.getCurrentUser();
              if (user) {
                const restoredSession = await api.restoreSurveySession(user.id, surveyVariant);
                if (restoredSession) {
                  // Update local session with restored data
                  const updatedSession = {
                    ...variantSession,
                    id: restoredSession.id,
                  };
                  LocalStorageService.setCurrentSession(updatedSession);
                  
                  // Save restored answers to localStorage
                  Object.entries(restoredSession.answers).forEach(([questionId, answer]) => {
                    LocalStorageService.saveUserResponse(updatedSession.id, questionId, answer as number);
                  });
                  
                  setSurveyState(prev => ({
                    ...prev,
                    responses: restoredSession.answers
                  }));
                  return;
                }
              }
            } catch (error) {
              ErrorHandler.warn('Failed to restore session from database', {
                component: 'useSurvey',
                operation: 'restoreSession',
                sessionId: session?.id,
                additionalData: { error }
              });
            }
          }
          
          // Use local data if available or start fresh
          setSurveyState(prev => ({
            ...prev,
            responses: localResponses
          }));
        }
      }
    };

    initializeSurvey();
  }, [surveyVariant, getOrCreateSession]);

  // Load saved data when session or variant changes
  useEffect(() => {
    if (session && surveyVariant) {
      // Load responses from localStorage
      const savedResponses = LocalStorageService.getUserResponses(session.id);
      setSurveyState(prev => ({
        ...prev,
        responses: savedResponses
      }));
    }
  }, [session, surveyVariant]);

  // Memoized categories with progress calculation
  const categoriesWithProgressMemo = useMemo(() => {
    if (!surveyVariant || categoriesData.length === 0) return [];

    return categoriesData.map(category => {
      const categoryQuestions = questionsData.filter(q => q.category === category.name);
      const completedQuestions = categoryQuestions.filter(q =>
        surveyState.responses[q.id] !== undefined
      ).length;

      return {
        ...category,
        questions: categoryQuestions,
        completedQuestions,
        totalQuestions: categoryQuestions.length
      };
    });
  }, [surveyVariant, categoriesData, questionsData, surveyState.responses]);

  // Update categoriesWithProgress when memoized value changes
  useEffect(() => {
    setCategoriesWithProgress(categoriesWithProgressMemo);
  }, [categoriesWithProgressMemo]);

  const selectSurveyVariant = useCallback((variant: SurveyVariant | null) => {
    setSurveyVariant(variant);
    
    // Reset survey state when changing variant
    setSurveyState({
      currentCategory: null,
      currentQuestionIndex: 0,
      responses: {}
    });
    
    setShowResults(false);
    
    if (variant) {
      // Get or create session for the specific variant
      getOrCreateSession(variant);
    }
  }, [getOrCreateSession]);

  const startSurvey = useCallback((categoryId: string) => {
    if (!session || !surveyVariant) {
      // Create session if it doesn't exist
      if (surveyVariant) {
        createSession(surveyVariant);
      }
      return;
    }

    const category = categoriesWithProgress.find(c => c.id === categoryId);
    if (!category) return;

    // Check if this category is locked (previous categories not completed)
    const categoryIndex = categoriesWithProgress.findIndex(c => c.id === categoryId);
    if (categoryIndex > 0) {
      // Check if all previous categories are completed
      for (let i = 0; i < categoryIndex; i++) {
        const prevCategory = categoriesWithProgress[i];
        if (prevCategory.completedQuestions < prevCategory.totalQuestions) {
          // Previous category not completed, don't start this survey
          return;
        }
      }
    }

    // Find the first unanswered question
    let startIndex = 0;
    for (let i = 0; i < category.questions.length; i++) {
      if (!surveyState.responses[category.questions[i].id]) {
        startIndex = i;
        break;
      }
    }

    setSurveyState(prev => ({
      ...prev,
      currentCategory: categoryId,
      currentQuestionIndex: startIndex
    }));

    updateSessionActivity();
  }, [categoriesWithProgress, surveyState.responses, session, surveyVariant, createSession, updateSessionActivity]);

  const answerQuestion = useCallback(async (questionId: string, value: number) => {
    if (!session) return;

    const newResponses = {
      ...surveyState.responses,
      [questionId]: value
    };

    setSurveyState(prev => ({
      ...prev,
      responses: newResponses
    }));

    // Save to localStorage immediately
    LocalStorageService.saveUserResponse(session.id, questionId, value);

    // Save to database (async, don't block UI)
    try {
      if (session.id && !session.id.startsWith('demo-')) {
        await api.saveAnswer(session.id, questionId, value);
      }
    } catch (error) {
      ErrorHandler.warn('Failed to save answer to database', {
        component: 'useSurvey',
        operation: 'saveAnswer',
        sessionId: session?.id,
        additionalData: { questionId, value, error }
      });
      // Continue with localStorage only - this ensures the app works offline
    }
  }, [surveyState.responses, session]);

  const answerAndNext = useCallback(async (questionId: string, value: number) => {
    if (!surveyState.currentCategory || !session) return;

    const category = categoriesWithProgress.find(c => c.id === surveyState.currentCategory);
    if (!category) return;

    const currentQuestion = category.questions[surveyState.currentQuestionIndex];
    if (!currentQuestion) return;

    // Update the response (now async)
    await answerQuestion(questionId, value);

    // Calculate updated responses for checking completion
    const updatedResponses = { ...surveyState.responses, [questionId]: value };

    // Check if current category is completed after this answer
    const answeredQuestionsInCategory = category.questions.filter(q => 
      updatedResponses[q.id] !== undefined
    ).length;
    
    const isLastQuestionAndAnswered = (surveyState.currentQuestionIndex === category.questions.length - 1);
    const isCategoryCompleted = answeredQuestionsInCategory === category.questions.length;
    
    if (isLastQuestionAndAnswered || isCategoryCompleted) {
      // Category is completed, try to go to next category
      const currentIndex = categoriesWithProgress.findIndex(c => c.id === surveyState.currentCategory);
      if (currentIndex < categoriesWithProgress.length - 1) {
        // Start the next category immediately
        const nextCategory = categoriesWithProgress[currentIndex + 1];
        setTimeout(() => {
          setSurveyState(prev => ({
            ...prev,
            currentCategory: nextCategory.id,
            currentQuestionIndex: 0
          }));
        }, 100);
      } else {
        // No more categories, survey completed
        setTimeout(() => {
          setSurveyState(prev => ({
            ...prev,
            currentCategory: null,
            currentQuestionIndex: 0
          }));
          setShowResults(true);
          completeSession();
        }, 100);
      }
      return;
    }

    // Move to next question in the same category
    const nextIndex = surveyState.currentQuestionIndex + 1;
    
    if (nextIndex < category.questions.length) {
      setSurveyState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex
      }));
    }
  }, [surveyState, categoriesWithProgress, session, answerQuestion, completeSession]);

  const nextQuestion = useCallback(() => {
    if (!surveyState.currentCategory) return;
    
    const category = categoriesWithProgress.find(c => c.id === surveyState.currentCategory);
    if (!category) return;
    
    const currentQuestion = category.questions[surveyState.currentQuestionIndex];
    if (!currentQuestion || surveyState.responses[currentQuestion.id] === undefined) return;
    
    // Move to next question
    const nextIndex = surveyState.currentQuestionIndex + 1;
    if (nextIndex < category.questions.length) {
      setSurveyState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex
      }));
    }
  }, [surveyState, categoriesWithProgress]);

  const goBackToMain = useCallback(() => {
    setSurveyState(prev => ({
      ...prev,
      currentCategory: null,
      currentQuestionIndex: 0
    }));
    
    setShowResults(false);
  }, []);

  const getCurrentQuestion = useCallback(() => {
    if (!surveyState.currentCategory) return null;
    
    const category = categoriesWithProgress.find(c => c.id === surveyState.currentCategory);
    if (!category) return null;
    
    return category.questions[surveyState.currentQuestionIndex] || null;
  }, [surveyState.currentCategory, surveyState.currentQuestionIndex, categoriesWithProgress]);

  const getCurrentCategory = useCallback(() => {
    if (!surveyState.currentCategory) return null;
    return categoriesWithProgress.find(c => c.id === surveyState.currentCategory) || null;
  }, [surveyState.currentCategory, categoriesWithProgress]);

  const canGoNext = useCallback((pendingAnswer?: number) => {
    if (!surveyState.currentCategory) return false;
    
    const category = categoriesWithProgress.find(c => c.id === surveyState.currentCategory);
    if (!category) return false;
    
    const currentQuestion = category.questions[surveyState.currentQuestionIndex];
    if (!currentQuestion) return false;
    
    const isCurrentQuestionAnswered = surveyState.responses[currentQuestion.id] !== undefined || pendingAnswer !== undefined;
    
    return isCurrentQuestionAnswered;
  }, [surveyState, categoriesWithProgress]);

  const isCurrentCategoryCompleted = useCallback(() => {
    if (!surveyState.currentCategory) return false;
    
    const category = categoriesWithProgress.find(c => c.id === surveyState.currentCategory);
    if (!category) return false;
    
    const answeredQuestionsInCategory = category.questions.filter(q => 
      surveyState.responses[q.id] !== undefined
    ).length;
    
    return answeredQuestionsInCategory === category.questions.length;
  }, [surveyState.currentCategory, categoriesWithProgress, surveyState.responses]);

  const getNextCategory = useCallback(() => {
    if (!surveyState.currentCategory) return null;
    
    const currentIndex = categoriesWithProgress.findIndex(c => c.id === surveyState.currentCategory);
    if (currentIndex === -1 || currentIndex === categoriesWithProgress.length - 1) return null;
    
    return categoriesWithProgress[currentIndex + 1];
  }, [surveyState.currentCategory, categoriesWithProgress]);

  const goToNextCategory = useCallback(() => {
    if (!surveyState.currentCategory) return;
    
    const currentIndex = categoriesWithProgress.findIndex(c => c.id === surveyState.currentCategory);
    if (currentIndex === -1 || currentIndex === categoriesWithProgress.length - 1) return;
    
    const nextCategory = categoriesWithProgress[currentIndex + 1];
    if (!nextCategory) return;
    
    startSurvey(nextCategory.id);
  }, [surveyState.currentCategory, categoriesWithProgress, startSurvey]);

  const getTotalSurveyQuestions = useCallback(() => {
    return categoriesWithProgress.reduce((total, category) => total + category.totalQuestions, 0);
  }, [categoriesWithProgress]);

  const getCurrentOverallQuestionNumber = useCallback(() => {
    if (!surveyState.currentCategory) return 0;
    
    const currentCategoryIndex = categoriesWithProgress.findIndex(c => c.id === surveyState.currentCategory);
    if (currentCategoryIndex === -1) return 0;
    
    let questionNumber = 0;
    for (let i = 0; i < currentCategoryIndex; i++) {
      questionNumber += categoriesWithProgress[i].totalQuestions;
    }
    
    questionNumber += surveyState.currentQuestionIndex + 1;
    
    return questionNumber;
  }, [surveyState.currentCategory, surveyState.currentQuestionIndex, categoriesWithProgress]);

  const getOverallProgress = useCallback(() => {
    const totalQuestions = getTotalSurveyQuestions();
    const currentQuestion = getCurrentOverallQuestionNumber();
    const percentage = totalQuestions > 0 ? Math.round((currentQuestion / totalQuestions) * 100) : 0;
    
    return {
      currentQuestion,
      totalQuestions,
      percentage
    };
  }, [getTotalSurveyQuestions, getCurrentOverallQuestionNumber]);

  const getCategoryProgress = useCallback(() => {
    return categoriesWithProgress.map((category, index) => {
      const isCurrentCategory = category.id === surveyState.currentCategory;
      const isCompleted = category.completedQuestions === category.totalQuestions;
      const isCurrent = index === categoriesWithProgress.findIndex(c => c.id === surveyState.currentCategory);
      
      return {
        ...category,
        isCurrentCategory,
        isCompleted,
        isCurrent,
        stepNumber: index + 1
      };
    });
  }, [categoriesWithProgress, surveyState.currentCategory]);

  const isSurveyCompleted = useCallback(() => {
    if (categoriesWithProgress.length === 0) return false;
    
    return categoriesWithProgress.every(category => 
      category.completedQuestions === category.totalQuestions
    );
  }, [categoriesWithProgress]);

  const showSurveyResults = useCallback(() => {
    setShowResults(true);
  }, []);

  const hideSurveyResults = useCallback(() => {
    setShowResults(false);
  }, []);

  // Set up automatic session synchronization
  useEffect(() => {
    if (!session?.id || session.id.startsWith('demo-')) {
      return; // Skip sync for demo sessions
    }

    // Start auto-sync every 30 seconds
    const stopAutoSync = SessionSyncService.startAutoSync(session.id, 30000);
    
    // Set up visibility change sync
    const stopVisibilitySync = SessionSyncService.setupVisibilitySync(session.id);

    // Cleanup on unmount or session change
    return () => {
      stopAutoSync();
      stopVisibilitySync();
    };
  }, [session?.id]);

  // Check for newer session on startup
  useEffect(() => {
    const checkForNewerSession = async () => {
      if (!session || !surveyVariant || session.id.startsWith('demo-')) {
        return;
      }

      const user = LocalStorageService.getCurrentUser();
      if (!user) return;

      try {
        const hasNewer = await SessionSyncService.checkForNewerSession(
          user.id,
          surveyVariant,
          session.lastActivityAt
        );

        if (hasNewer) {
          // There's a newer session on the backend, restore it
          const restoredSession = await SessionSyncService.restoreFromBackend(user.id, surveyVariant);
          if (restoredSession) {
            // Update local session with restored data
            const updatedSession = {
              ...session,
              id: restoredSession.surveyId,
              lastActivityAt: restoredSession.lastActivityAt,
            };
            LocalStorageService.setCurrentSession(updatedSession);
            
            // Save restored answers to localStorage
            Object.entries(restoredSession.answers).forEach(([questionId, answer]) => {
              LocalStorageService.saveUserResponse(updatedSession.id, questionId, answer);
            });
            
            setSurveyState(prev => ({
              ...prev,
              responses: restoredSession.answers
            }));
          }
        }
      } catch (error) {
        ErrorHandler.warn('Failed to check for newer session', {
          component: 'useSurvey',
          operation: 'checkForUpdates',
          sessionId: session?.id,
          additionalData: { error }
        });
      }
    };

    checkForNewerSession();
  }, [session, surveyVariant]);

  return {
    surveyVariant,
    surveyState,
    categoriesData: categoriesWithProgress,
    showResults,
    selectSurveyVariant,
    startSurvey,
    answerQuestion,
    answerAndNext,
    nextQuestion,
    goBackToMain,
    getCurrentQuestion,
    getCurrentCategory,
    canGoNext,
    isCurrentCategoryCompleted,
    getNextCategory,
    goToNextCategory,
    getTotalSurveyQuestions,
    getCurrentOverallQuestionNumber,
    getOverallProgress,
    getCategoryProgress,
    isSurveyCompleted,
    showSurveyResults,
    hideSurveyResults
  };
}
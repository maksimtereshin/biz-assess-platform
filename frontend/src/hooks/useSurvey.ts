import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoriesForVariant, getQuestionsForVariant } from '../data/surveyData';
import { SurveyVariant } from '../types/adapters';
import { Question, Category } from '../types/survey';
import { Survey as BackendSurvey } from 'bizass-shared';
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

export function useSurvey(initialVariant?: SurveyVariant | null, sessionId?: string) {
  const navigate = useNavigate();
  const { session, createSession, getOrCreateSession, updateSessionActivity, completeSession } = useUserSession();
  const [surveyVariant, setSurveyVariant] = useState<SurveyVariant | null>(initialVariant || null);
  const [surveyState, setSurveyState] = useState<SurveyState>({
    currentCategory: null,
    currentQuestionIndex: 0,
    responses: {}
  });
  const [showResults, setShowResults] = useState<boolean>(false);
  const [backendSurvey, setBackendSurvey] = useState<BackendSurvey | null>(null);
  const [isFetchingSurvey, setIsFetchingSurvey] = useState<boolean>(false);

  // Get categories for current variant
  const categoriesData = useMemo(() => {
    if (!surveyVariant) return [];

    // Use backend data if available, otherwise fallback to local data
    if (backendSurvey) {
      return backendSurvey.structure.map(category => ({
        id: category.id,
        name: category.name,
        subcategories: category.subcategories.map(sub => sub.name),
        totalQuestions: category.subcategories.reduce((total, sub) => total + sub.questions.length, 0),
        completedQuestions: 0
      }));
    }

    return getCategoriesForVariant(surveyVariant);
  }, [surveyVariant, backendSurvey]);

  // Get questions for current variant
  const questionsData = useMemo(() => {
    if (!surveyVariant) return [];

    // Use backend data if available, otherwise fallback to local data
    if (backendSurvey) {
      const questions: Question[] = [];
      backendSurvey.structure.forEach(category => {
        category.subcategories.forEach(subcategory => {
          subcategory.questions.forEach(question => {
            questions.push({
              id: question.id.toString(), // Convert to string for compatibility
              text: question.text,
              category: category.name,
              subcategory: subcategory.name,
              answers: question.answers || []
            });
          });
        });
      });
      return questions;
    }

    return getQuestionsForVariant(surveyVariant);
  }, [surveyVariant, backendSurvey]);

  // Categories with completion status
  const [categoriesWithProgress, setCategoriesWithProgress] = useState<(Category & { 
    completedQuestions: number;
    questions: Question[];
  })[]>([]);

  // Fetch survey structure from backend
  useEffect(() => {
    const fetchSurveyStructure = async () => {
      if (surveyVariant && !isFetchingSurvey && !backendSurvey) {
        setIsFetchingSurvey(true);
        try {
          const survey = await api.getSurveyStructure(surveyVariant.toUpperCase());
          setBackendSurvey(survey);
        } catch (error) {
          console.error('Failed to fetch survey structure:', error);
          // Fallback to local data if backend fails
          setBackendSurvey(null);
        } finally {
          setIsFetchingSurvey(false);
        }
      }
    };

    fetchSurveyStructure();
  }, [surveyVariant, isFetchingSurvey, backendSurvey]);

  // Initialize survey when variant is set
  useEffect(() => {
    const initializeSurvey = async () => {
      if (surveyVariant) {
        // Use provided sessionId or get/create session for this variant
        let variantSession;

        if (sessionId) {
          // Use the provided sessionId - load existing session from backend

          console.log('=== USESURVY HOOK - LOADING SESSION ===');
          console.log('Session ID from URL:', sessionId);
          console.log('Survey variant:', initialVariant);

          // Restore session token from localStorage first
          let savedToken = LocalStorageService.getSessionToken(sessionId);
          console.log('Attempting to restore token from localStorage...');
          console.log('Found saved token:', savedToken ? `${savedToken.substring(0, 30)}...` : 'NULL');

          if (!savedToken) {
            // Fallback: Try to fetch session token using auth token
            console.warn('⚠️ No saved token found for session:', sessionId);
            console.log('Attempting to fetch session token from backend...');

            try {
              const fetchedToken = await api.getSessionToken(sessionId);
              LocalStorageService.setSessionToken(sessionId, fetchedToken);
              savedToken = fetchedToken;
              console.log('✓ Session token fetched and saved successfully');
            } catch (error) {
              console.error('Failed to fetch session token:', error);
              console.error('Redirecting to home page...');
              navigate('/');
              return;
            }
          }

          if (savedToken) {
            // Decode JWT to see what's inside
            try {
              const parts = savedToken.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('JWT Token Payload:', JSON.stringify(payload, null, 2));
                console.log('Token sessionId:', payload.sessionId);
                console.log('URL sessionId:', sessionId);
                console.log('SessionIds match:', payload.sessionId === sessionId);
              }
            } catch (e) {
              console.error('Failed to decode JWT:', e);
            }

            api.setSessionToken(savedToken);
            console.log('✓ Session token set in API client');
            console.log('Token length:', savedToken.length);
          }

          try {
            console.log('Making API request to load session...');
            const backendSession = await api.getCurrentSession(sessionId);
            console.log('✓ Successfully loaded session from backend');
            console.log('Backend session data:', JSON.stringify(backendSession, null, 2));

            if (backendSession) {
              // Create a UserSession from the backend session
              variantSession = {
                id: backendSession.id,
                userId: backendSession.userId.toString(),
                surveyVariant: initialVariant!,
                startedAt: backendSession.createdAt,
                lastActivityAt: new Date().toISOString(),
                isCompleted: backendSession.status === 'COMPLETED',
                currentQuestionIndex: 0
              };
              LocalStorageService.setCurrentSession(variantSession);
              console.log('✓ Session saved to localStorage');

              // Save answers from backend to localStorage and state immediately
              if (backendSession.answers && Object.keys(backendSession.answers).length > 0) {
                console.log('✓ Saving answers from backend to localStorage:', backendSession.answers);
                console.log(`Found ${Object.keys(backendSession.answers).length} answers in backend session`);

                // Save each answer to localStorage
                Object.entries(backendSession.answers).forEach(([questionId, score]) => {
                  LocalStorageService.saveUserResponse(backendSession.id, questionId.toString(), score as number);
                });

                // Set answers in state immediately to prevent "flickering" of UI
                setSurveyState(prev => ({
                  ...prev,
                  responses: backendSession.answers
                }));

                console.log(`✓ Saved ${Object.keys(backendSession.answers).length} answers to localStorage and state`);
                return; // Exit early - no need to continue with restoration logic below
              }
            }
          } catch (error: any) {
            console.error('=== FAILED TO LOAD SESSION FROM BACKEND ===');
            console.error('Error type:', error?.constructor?.name);
            console.error('Error message:', error?.message);
            console.error('Response status:', error?.response?.status);
            console.error('Response data:', JSON.stringify(error?.response?.data, null, 2));
            console.error('Request headers:', JSON.stringify(error?.config?.headers, null, 2));
            console.error('Full error:', error);
            // If can't load from backend, redirect to selection
            navigate('/');
            return;
          }
        } else {
          // Fallback to old behavior - get or create session for this variant
          variantSession = getOrCreateSession(surveyVariant);
        }

        // No need for restoration logic here - answers are already saved above
        // when sessionId is provided from URL (lines 182-199)
      }
    };

    initializeSurvey();
  }, [surveyVariant, sessionId, initialVariant, getOrCreateSession, navigate]);

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

    // Save to localStorage immediately for UI state
    LocalStorageService.saveUserResponse(session.id, questionId, value);

    // Note: Backend save now happens only when user clicks "Next" in answerAndNext
  }, [surveyState.responses, session]);

  // Helper function to save answer to backend
  const saveAnswerToBackend = useCallback(async (questionId: string, value: number) => {
    if (!session?.id || session.id.startsWith('demo-')) return;

    try {
      // Convert question ID to numeric for backend
      const numericQuestionId = backendSurvey ?
        parseInt(questionId) : // Backend survey already has numeric IDs
        parseInt(questionId.replace(/^\w+_q/, '')); // Extract number from "express_q1" format

      if (!isNaN(numericQuestionId)) {
        await api.submitAnswer(numericQuestionId, value);
      } else {
        console.error('Invalid question ID format:', questionId);
      }
    } catch (error) {
      ErrorHandler.warn('Failed to save answer to database', {
        component: 'useSurvey',
        operation: 'saveAnswerToBackend',
        sessionId: session?.id,
        additionalData: { questionId, value, error }
      });
      // Don't throw - continue with localStorage only
    }
  }, [session, backendSurvey]);

  const answerAndNext = useCallback(async (questionId: string, value: number) => {
    if (!surveyState.currentCategory || !session) return;

    const category = categoriesWithProgress.find(c => c.id === surveyState.currentCategory);
    if (!category) return;

    const currentQuestion = category.questions[surveyState.currentQuestionIndex];
    if (!currentQuestion) return;

    // Update the response (localStorage only)
    await answerQuestion(questionId, value);

    // Save to backend when user clicks "Next"
    await saveAnswerToBackend(questionId, value);

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
        setTimeout(async () => {
          setSurveyState(prev => ({
            ...prev,
            currentCategory: null,
            currentQuestionIndex: 0
          }));

          try {
            // Call backend API to complete session
            await api.completeSession();
            // Don't navigate - let user click "View Results" button instead
          } catch (error) {
            console.error('Error completing session:', error);
          }

          // Update local session state
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

  // Note: Auto-sync has been removed to prevent 429 rate limiting errors
  // Answers are now saved immediately when users respond


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
import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Play, RotateCcw } from 'lucide-react';
import { SurveyResults } from 'bizass-shared';
import { useSurvey } from '../hooks/useSurvey';
import { useUserSession } from '../hooks/useUserSession';
import { QuestionScreen } from '../components/QuestionScreen';
import { ResultsScreen } from '../components/ResultsScreen';
import { SurveyResultsOverview } from '../components/SurveyResultsOverview';
import { CategoryResultsList } from '../components/CategoryResultsList';
import { LocalStorageService } from '../services/localStorage';
import api from '../services/api';

export function ExpressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { hasCompletedSurvey } = useUserSession();
  const shouldAutoStart = location.state?.autoStart === true;
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [surveyStatus, setSurveyStatus] = useState<{
    hasCompleted: boolean;
    activeSessionId: string | null;
  } | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [surveyResults, setSurveyResults] = useState<SurveyResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  console.log('Session ID:', sessionId);

  // Initialize: load survey status if no sessionId
  React.useEffect(() => {
    const init = async () => {
      // If sessionId already in URL or creating session - skip
      if (sessionId || isCreatingSession) {
        return;
      }

      // Get telegramId from auth store
      const user = LocalStorageService.getCurrentUser();
      if (!user?.telegramId) {
        console.warn('No user found, redirecting to home');
        navigate('/');
        return;
      }

      try {
        // Load user surveys status
        const status = await api.getUserSurveysStatus(parseInt(user.telegramId));
        setSurveyStatus(status.express);

        // If there's an active session - get session token and redirect
        if (status.express.activeSessionId) {
          console.log('Found active session:', status.express.activeSessionId);

          try {
            // Get session token using Telegram initData
            console.log('Fetching session token for active session...');
            const sessionToken = await api.getSessionToken(status.express.activeSessionId);

            // Save session token to localStorage
            LocalStorageService.setSessionToken(status.express.activeSessionId, sessionToken);
            api.setSessionToken(sessionToken);

            console.log('✓ Session token obtained and saved for active session');
          } catch (tokenError: any) {
            console.error('Failed to get session token:', tokenError);

            // Check if running in Telegram WebApp context
            if (!(window as any).Telegram?.WebApp?.initData) {
              console.error('Not running in Telegram WebApp context');
              console.warn('Session token cannot be obtained outside Telegram');
              // Redirect to home - user needs to open via Telegram
              navigate('/');
              return;
            }

            // Other errors - continue anyway, useSurvey will try to fetch it
            console.warn('Continuing to session page, useSurvey will retry token fetch');
          }

          navigate(`/express/${status.express.activeSessionId}`, { replace: true });
        }
      } catch (error) {
        console.error('Failed to load survey status:', error);
      }
    };

    init();
  }, [sessionId, navigate, isCreatingSession]);

  const {
    surveyVariant,
    surveyState,
    categoriesData,
    showResults,
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
    // goToNextCategory,
    getOverallProgress,
    getCategoryProgress,
    isSurveyCompleted,
    showSurveyResults,
    hideSurveyResults
  } = useSurvey('express', sessionId);
  console.log('Survey Variant:', surveyVariant);
  console.log('Survey State:', surveyState);
  console.log('Categories Data:', categoriesData);
  console.log('Show Results:', showResults);
  const currentQuestion = getCurrentQuestion();
  const currentCategory = getCurrentCategory();
  
  // Определяем состояние опроса
  const hasAnsweredQuestions = categoriesData.some(cat => cat.completedQuestions > 0);
  const hasIncompleteSurvey = hasAnsweredQuestions && !isSurveyCompleted();
  const hasCompletedExpressSurvey = hasCompletedSurvey('express');

  // Load survey results when survey is completed
  React.useEffect(() => {
    const loadResults = async () => {
      if (isSurveyCompleted() && sessionId && !surveyResults && !isLoadingResults) {
        try {
          setIsLoadingResults(true);
          const data = await api.getSurveyResults(sessionId);
          setSurveyResults(data);
        } catch (error) {
          console.error('Error loading survey results:', error);
        } finally {
          setIsLoadingResults(false);
        }
      }
    };

    loadResults();
  }, [isSurveyCompleted(), sessionId, surveyResults, isLoadingResults]);

  const handleStartAssessment = async () => {
    // If we already have a sessionId, just start the survey
    if (sessionId) {
      const firstIncompleteCategory = categoriesData.find(category =>
        category.completedQuestions < category.totalQuestions
      );

      if (firstIncompleteCategory) {
        startSurvey(firstIncompleteCategory.id);
      }
      return;
    }

    // Create new session
    const user = LocalStorageService.getCurrentUser();
    if (!user?.telegramId) {
      console.error('No user found');
      return;
    }

    setIsCreatingSession(true);

    try {
      // Create new session via API
      const { session, sessionToken } = await api.startSurvey('express', parseInt(user.telegramId));
      api.setSessionToken(sessionToken);
      LocalStorageService.setSessionToken(session.id, sessionToken);

      // Redirect to new session
      navigate(`/express/${session.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to start survey:', error);
      setIsCreatingSession(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleViewResults = () => {
    // Navigate to results page with sessionId
    if (sessionId) {
      navigate(`/express/${sessionId}/results`);
    } else {
      // Fallback to old results screen if no sessionId
      showSurveyResults();
    }
  };

  const handleBackToVariantPage = () => {
    goBackToMain();
  };

  const handleBackToVariantFromResults = () => {
    hideSurveyResults();
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    LocalStorageService.clearAllData();
    setShowResetConfirm(false);
    // Перезагружаем страницу для полного сброса состояния
    window.location.reload();
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  // Auto-start survey ONLY when explicitly requested (new session from SurveySelectionScreen)
  React.useEffect(() => {
    // Only auto-start if:
    // 1. We have autoStart flag from navigation (new session created)
    // 2. We have a sessionId in URL
    // 3. We're not already in a survey (currentCategory is null)
    // 4. Categories data is loaded
    // 5. Survey is not completed
    if (shouldAutoStart && sessionId && !surveyState.currentCategory && categoriesData.length > 0 && !isSurveyCompleted()) {
      console.log('Auto-starting NEW survey for session:', sessionId);
      const firstIncompleteCategory = categoriesData.find(category =>
        category.completedQuestions < category.totalQuestions
      );

      if (firstIncompleteCategory) {
        console.log('Starting first incomplete category:', firstIncompleteCategory.name);
        startSurvey(firstIncompleteCategory.id);
      }
    }
  }, [shouldAutoStart, sessionId, surveyState.currentCategory, categoriesData, isSurveyCompleted, startSurvey]);

  // Handle navigation based on survey state
  React.useEffect(() => {
    if (surveyState.currentCategory && currentQuestion && currentCategory) {
      // We're in question mode, render QuestionScreen
    }
  }, [surveyState.currentCategory, currentQuestion, currentCategory]);

  React.useEffect(() => {
    if (showResults && surveyVariant) {
      // We're showing results, render ResultsScreen
    }
  }, [showResults, surveyVariant]);

  // Show question screen when in survey mode
  if (surveyState.currentCategory && currentQuestion && currentCategory) {
    const stepNumber = categoriesData.findIndex(cat => cat.id === currentCategory.id) + 1;
    const overallProgress = getOverallProgress();
    const categoryProgress = getCategoryProgress();
    
    return (
      <QuestionScreen
        category={currentCategory}
        currentQuestionIndex={surveyState.currentQuestionIndex}
        totalQuestions={currentCategory.totalQuestions}
        question={currentQuestion}
        currentAnswer={surveyState.responses[currentQuestion.id]}
        onAnswer={(value) => answerQuestion(currentQuestion.id, value)}
        onAnswerAndNext={answerAndNext}
        onNext={nextQuestion}
        onBack={handleBackToVariantPage}
        canGoNext={canGoNext}
        isCurrentCategoryCompleted={isCurrentCategoryCompleted()}
        nextCategory={getNextCategory()}
        stepNumber={stepNumber}
        overallProgress={overallProgress}
        categoryProgress={categoryProgress}
      />
    );
  }

  // Show results screen when viewing results
  if (showResults && surveyVariant) {
    return (
      <ResultsScreen
        categories={categoriesData}
        surveyVariant={surveyVariant}
        responses={surveyState.responses}
        onBackToMain={handleBackToVariantFromResults}
      />
    );
  }

  // Default survey selection/overview page
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="hidden md:block bg-teal-500 text-white p-4 flex items-center gap-3">
        <button
          onClick={handleBackToHome}
          className="p-1 hover:bg-teal-600 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-medium">Экспресс-опрос</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto">
          {/* Survey Results Overview or Survey Info */}
          {isSurveyCompleted() && surveyResults ? (
            <SurveyResultsOverview results={surveyResults} surveyType="express" />
          ) : (
            <div className="bg-white rounded-lg p-6 mb-6 border relative">
              {/* TODO: Remove after development is done (with relative) */}
              <button
                onClick={handleResetData}
                className="absolute right-4 transform -translate-y-1/2 hover:text-red-200 transition-colors"
                title="Сбросить все данные для повторного тестирования"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-3">
                  <span className="text-2xl">⚡</span>
                </div>
                <h2 className="text-lg font-medium text-slate-800 mb-2">Экспресс-опрос</h2>
                <p className="text-sm text-slate-600">
                  Полная оценка всех аспектов бизнеса в стандартном формате
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Время прохождения:</span>
                  <span className="font-medium">10-15 минут</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Количество вопросов:</span>
                  <span className="font-medium">60 вопросов</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Категории:</span>
                  <span className="font-medium">6 категорий</span>
                </div>
              </div>

              {/* Progress Indicator */}
              {hasAnsweredQuestions && !isSurveyCompleted() && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Прогресс:</span>
                    <span>
                      {categoriesData.reduce((acc, cat) => acc + cat.completedQuestions, 0)} / {categoriesData.reduce((acc, cat) => acc + cat.totalQuestions, 0)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(categoriesData.reduce((acc, cat) => acc + cat.completedQuestions, 0) / categoriesData.reduce((acc, cat) => acc + cat.totalQuestions, 0)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isSurveyCompleted() || !surveyResults ? (
            <div className="space-y-3">
              {/* Если есть незавершенный опрос */}
              {hasIncompleteSurvey && (
                <button
                  onClick={handleStartAssessment}
                  className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Продолжить с последнего места
                </button>
              )}

              {/* Если опроса нет или он не начат */}
              {!hasAnsweredQuestions && !surveyStatus?.hasCompleted && (
                <button
                  onClick={handleStartAssessment}
                  className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Начать чекап
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleBackToHome}
                className="w-full bg-slate-200 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                Назад на главную
              </button>
            </div>
          )}

          {/* Categories: Results or Overview */}
          {isSurveyCompleted() && surveyResults && sessionId ? (
            <CategoryResultsList
              categories={surveyResults.categories}
              sessionId={sessionId}
              surveyType="express"
            />
          ) : categoriesData.length > 0 ? (
            <div className="mt-8">
              <h3 className="font-medium text-slate-800 mb-4">Категории оценки</h3>
              <div className="space-y-2">
                {categoriesData.map((category, index) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg p-3 border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        category.completedQuestions === category.totalQuestions
                          ? 'bg-green-100 text-green-600'
                          : category.completedQuestions > 0
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800">{category.name}</p>
                        <p className="text-xs text-slate-500">
                          {category.completedQuestions}/{category.totalQuestions} вопросов
                        </p>
                      </div>
                    </div>

                    {category.completedQuestions === category.totalQuestions && (
                      <div className="text-green-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showResetConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Сбросить все данные?
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Это действие удалит все сохраненные ответы и прогресс. Вы сможете пройти опрос заново.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={cancelReset}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={confirmReset}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      Сбросить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
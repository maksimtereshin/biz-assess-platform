import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, RotateCcw, Eye, CreditCard } from 'lucide-react';
import { useSurvey } from '../hooks/useSurvey';
import { useUserSession } from '../hooks/useUserSession';
import { QuestionScreen } from '../components/QuestionScreen';
import { ResultsScreen } from '../components/ResultsScreen';

export function ExpressPage() {
  const navigate = useNavigate();
  const { hasCompletedSurvey } = useUserSession();
  
  const {
    surveyVariant,
    surveyState,
    categoriesData,
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
    getOverallProgress,
    getCategoryProgress,
    isSurveyCompleted,
    showSurveyResults,
    hideSurveyResults
  } = useSurvey('express');

  const currentQuestion = getCurrentQuestion();
  const currentCategory = getCurrentCategory();
  
  // Initialize survey variant
  React.useEffect(() => {
    selectSurveyVariant('express');
  }, [selectSurveyVariant]);
  
  // Определяем состояние опроса
  const hasAnsweredQuestions = categoriesData.some(cat => cat.completedQuestions > 0);
  const hasIncompleteSurvey = hasAnsweredQuestions && !isSurveyCompleted();
  const hasCompletedExpressSurvey = hasCompletedSurvey('express');

  const handleStartAssessment = () => {
    // Найти первую незавершенную категорию
    const firstIncompleteCategory = categoriesData.find(category => 
      category.completedQuestions < category.totalQuestions
    );
    
    if (firstIncompleteCategory) {
      startSurvey(firstIncompleteCategory.id);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleViewResults = () => {
    showSurveyResults();
  };

  const handleBackToVariantPage = () => {
    goBackToMain();
  };

  const handleBackToVariantFromResults = () => {
    hideSurveyResults();
  };

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
          {/* Survey Info */}
          <div className="bg-white rounded-lg p-6 mb-6 border">
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
            {hasAnsweredQuestions && (
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

          {/* Action Buttons */}
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
            {!hasAnsweredQuestions && (
              <button
                onClick={handleStartAssessment}
                className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Начать чекап
              </button>
            )}

            {/* Если опрос завершен */}
            {(isSurveyCompleted() || hasCompletedExpressSurvey) && (
              <>
                <button
                  onClick={handleViewResults}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Посмотреть результаты
                </button>
                
                <button
                  disabled
                  className="w-full bg-slate-300 text-slate-600 py-3 px-4 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Новый чекап (требуется оплата)
                </button>
                
                <p className="text-xs text-slate-500 text-center">
                  Для прохождения нового чекапа требуется оплата. Свяжитесь с нами для получения доступа.
                </p>
              </>
            )}
          </div>

          {/* Categories Overview */}
          {categoriesData.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
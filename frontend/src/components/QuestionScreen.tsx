import { useState, useEffect } from 'react';
import { Category, Question } from '../types/survey';
import { SyncIndicator, useSyncStatus } from './SyncIndicator';
import { SessionSyncService } from '../services/sessionSync';

interface OverallProgress {
  currentQuestion: number;
  totalQuestions: number;
  percentage: number;
}

interface CategoryProgressItem {
  id: string;
  name: string;
  subcategories: string[];
  totalQuestions: number;
  completedQuestions: number;
  isCurrentCategory: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  stepNumber: number;
}

interface QuestionScreenProps {
  category: Category;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: Question;
  currentAnswer?: number;
  onAnswer: (value: number) => Promise<void>;
  onAnswerAndNext: (questionId: string, value: number) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  canGoNext: (value: number | undefined) => boolean;
  isCurrentCategoryCompleted: boolean;
  nextCategory: Category | null;

  stepNumber: number;
  overallProgress: OverallProgress;
  categoryProgress: CategoryProgressItem[];
}

export function QuestionScreen({
  category,
  currentQuestionIndex,
  totalQuestions,
  question,
  currentAnswer,
  onAnswer,
  onAnswerAndNext,
  onNext,
  onBack,
  canGoNext,
  isCurrentCategoryCompleted,
  nextCategory,
  stepNumber,
  overallProgress,
  categoryProgress
}: QuestionScreenProps) {
  const [selectedValue, setSelectedValue] = useState<number | undefined>(currentAnswer);
  const syncStatus = useSyncStatus();

  // Set up sync status callbacks
  useEffect(() => {
    SessionSyncService.setStatusCallbacks({
      onSyncStart: syncStatus.markSyncStart,
      onSyncComplete: syncStatus.markSyncComplete,
      onSyncError: syncStatus.markSyncError,
    });
  }, [syncStatus]);

  // Reset selectedValue when question changes
  useEffect(() => {
    setSelectedValue(currentAnswer);
  }, [question.id, currentAnswer]);

  const handleRatingClick = async (value: number) => {
    setSelectedValue(value);
    // Save the answer immediately
    await onAnswer(value);
  };

  const handleNext = async () => {
    // Always use the atomic answerAndNext function to ensure proper state handling
    // If selectedValue is undefined, it means the answer is already saved
    const answerToUse = selectedValue !== undefined ? selectedValue : currentAnswer;
    if (answerToUse !== undefined) {
      await onAnswerAndNext(question.id, answerToUse);
    } else {
      // Fallback to regular next if no answer somehow
      onNext();
    }
  };



  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-slate-400 text-white px-4 py-2 text-center relative">
        <h2 className="text-lg">ШАГ {stepNumber}: {category.name}</h2>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <SyncIndicator 
            isOnline={syncStatus.isOnline}
            isSyncing={syncStatus.isSyncing}
            lastSyncTime={syncStatus.lastSyncTime || undefined}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mt-1">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-blue-800 leading-relaxed text-[20px]">
                {question.subcategory}
              </p>

              <p className="text-blue-800 leading-relaxed text-[16px]">
                {question.text}
              </p>
            </div>
          </div>
        </div>

        {/* Rating Scale with Color Coding */}
        <div className="bg-white rounded-lg p-4 mb-6">
          {/* Number Scale 1-10 */}
          <div className="flex justify-between items-center mb-4">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => {
              let buttonColor = 'border-slate-300 text-slate-600';
              let hoverColor = 'hover:border-slate-400';
              let bgColor = '';
              
              // Find which answer range this value belongs to for hover effects
              let matchingAnswer = null;
              if (question.answers) {
                matchingAnswer = question.answers.find(answer => {
                  const range = answer.range;
                  if (range.includes('-')) {
                    const [min, max] = range.split('-').map(n => parseInt(n));
                    return value >= min && value <= max;
                  }
                  return value === parseInt(range);
                });
                
                if (matchingAnswer) {
                  hoverColor = `hover:border-2`;
                }
              }
              
              if (selectedValue === value) {
                if (matchingAnswer) {
                  buttonColor = `border-2 text-white`;
                  bgColor = matchingAnswer.color;
                } else {
                  buttonColor = 'border-teal-500 bg-teal-500 text-white';
                  bgColor = '#14b8a6';
                }
              }
              
              return (
                <button
                  key={value}
                  onClick={() => handleRatingClick(value)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all ${buttonColor} ${hoverColor}`}
                  style={{
                    backgroundColor: selectedValue === value ? bgColor : undefined,
                    borderColor: selectedValue === value && bgColor ? bgColor : undefined,
                    '--hover-border-color': matchingAnswer ? matchingAnswer.color : undefined
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (selectedValue !== value && matchingAnswer) {
                      e.currentTarget.style.borderColor = matchingAnswer.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedValue !== value) {
                      e.currentTarget.style.borderColor = '';
                    }
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>

          {/* Color-coded Labels */}
          {question.answers ? (
            <div className="flex justify-between items-center text-sm">
              {question.answers.map((answer, index) => {
                let position = 'flex-1 text-center';
                let labelText = '';
                
                if (index === 0) {
                  position = 'flex-1 text-left';
                  labelText = 'Нет';
                } else if (index === question.answers!.length - 1) {
                  position = 'flex-1 text-right';
                  labelText = 'Да';
                } else {
                  labelText = 'Частично';
                }
                
                return (
                  <span 
                    key={index}
                    className={`font-medium ${position}`}
                    style={{ color: answer.color }}
                  >
                    {labelText}
                  </span>
                );
              })}
            </div>
          ) : (
            // Fallback labels
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-500 font-medium">Нет</span>
              <span className="text-orange-500 font-medium">Частично</span>
              <span className="text-teal-500 font-medium">Да</span>
            </div>
          )}

          {/* Visual range indicators */}
          {question.answers && (
            <div className="mt-3">
              <div className="flex h-2 rounded-full overflow-hidden">
                {question.answers.map((answer, index) => {
                  const range = answer.range;
                  let width = '33.33%'; // Default for 3 answers
                  
                  if (range.includes('-')) {
                    const [min, max] = range.split('-').map(n => parseInt(n));
                    width = `${((max - min + 1) / 10) * 100}%`;
                  } else {
                    width = '10%';
                  }
                  
                  return (
                    <div
                      key={index}
                      className="h-full"
                      style={{
                        backgroundColor: `${answer.color}30`,
                        width: width
                      }}
                    />
                  );
                })}
              </div>
              

            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleNext}
            disabled={!canGoNext(selectedValue)}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              canGoNext(selectedValue)
                ? isCurrentCategoryCompleted || (canGoNext(selectedValue) && currentQuestionIndex === totalQuestions - 1)
                  ? nextCategory
                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isCurrentCategoryCompleted || (canGoNext(selectedValue) && currentQuestionIndex === totalQuestions - 1)
              ? nextCategory
                ? `Далее → "${nextCategory.name}"`
                : 'Завершить опрос'
              : 'Далее'
            }
          </button>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          {/* Current Category Progress */}
          <div className="bg-pink-400 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">
                {question.subcategory}
              </span>
              <span className="text-white text-sm font-medium">
                {currentQuestionIndex + 1} / {category.totalQuestions}
              </span>
            </div>
            
            {/* Category Progress Bar */}
            <div className="bg-pink-600 rounded-full h-2">
              <div 
                className="h-2 bg-pink-200 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((currentQuestionIndex + 1) / category.totalQuestions) * 100)}%` }}
              />
            </div>
          </div>

          {/* Overall Survey Progress with Step Separators */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 text-sm">
                Общий прогресс
              </span>
              <span className="text-slate-700 text-sm font-medium">
                {overallProgress.currentQuestion} / {overallProgress.totalQuestions}
              </span>
            </div>
            
            {/* Segmented Progress bar */}
            <div className="flex gap-0.5 h-2">
              {categoryProgress.map((cat, index) => {
                const segmentWidth = (cat.totalQuestions / overallProgress.totalQuestions) * 100;
                const progressPercentage = cat.totalQuestions > 0 ? (cat.completedQuestions / cat.totalQuestions) * 100 : 0;
                
                let progressColor = 'bg-slate-300'; // Дефолтный цвет прогресса
                
                if (cat.isCompleted) {
                  progressColor = 'bg-teal-500'; // Завершённая категория
                } else if (cat.isCurrent) {
                  progressColor = 'bg-pink-400'; // Активная категория
                }
                
                return (
                  <div
                    key={cat.id}
                    className={`relative h-full bg-slate-200 transition-all duration-300 ${
                      index === 0 ? 'rounded-l-full' : ''
                    } ${
                      index === categoryProgress.length - 1 ? 'rounded-r-full' : ''
                    } overflow-hidden`}
                    style={{ width: `${segmentWidth}%` }}
                  >
                    {/* Внутренний прогресс */}
                    <div
                      className={`h-full transition-all duration-300 ${progressColor} ${
                        index === 0 ? 'rounded-l-full' : ''
                      } ${
                        index === categoryProgress.length - 1 ? 'rounded-r-full' : ''
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Completion Message */}
        {isCurrentCategoryCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <div className="text-green-600 mb-2">
              ✅ Категория "{category.name}" завершена!
            </div>
            {nextCategory ? (
              <p className="text-green-700 text-sm">
                Теперь можете перейти к следующей категории
              </p>
            ) : (
              <p className="text-green-700 text-sm">
                Поздравляем! Вы завершили весь опрос
              </p>
            )}
          </div>
        )}

      </div>

      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={onBack}
          className="w-full bg-slate-200 text-slate-600 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
        >
          Назад к категориям
        </button>
      </div>
    </div>
  );
}
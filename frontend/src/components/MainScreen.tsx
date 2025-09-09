import { useState } from 'react';
import { CategoryCard } from './CategoryCard';
import { Category } from '../types/survey';

interface MainScreenProps {
  categories: Category[];
  onStartSurvey: (categoryId: string) => void;
  onStartAssessment: () => void;
  hasAnsweredQuestions: boolean;
  onBackToSelection?: () => void;
  surveyVariant?: string;
  isSurveyCompleted?: boolean;
  onViewResults?: () => void;
}

export function MainScreen({ categories, onStartSurvey, onStartAssessment, hasAnsweredQuestions, onBackToSelection, surveyVariant, isSurveyCompleted, onViewResults }: MainScreenProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const getCategoryLockStatus = (categoryIndex: number) => {
    // First category is never locked
    if (categoryIndex === 0) return false;
    
    // Check if all previous categories are completed
    for (let i = 0; i < categoryIndex; i++) {
      const prevCategory = categories[i];
      if (prevCategory.completedQuestions < prevCategory.totalQuestions) {
        return true; // Previous category not completed, so this one is locked
      }
    }
    
    return false; // All previous categories completed
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="p-6 text-center">
        <h1 className="text-lg text-slate-600 mb-2">Давайте начнем!</h1>
        {surveyVariant && (
          <p className="text-sm text-slate-500 mb-4">
            Выбран: {surveyVariant === 'express' ? 'Экспресс-опрос' : 'Полный чек-ап'}
          </p>
        )}
        {!isSurveyCompleted ? (
          <button
            onClick={onStartAssessment}
            className="bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors mb-3"
          >
            {hasAnsweredQuestions ? 'Продолжить ЧЕК АП' : 'Начать ЧЕК АП'}
          </button>
        ) : (
          <div className="space-y-3 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-600 mb-2">
                ✅ Опрос завершен!
              </div>
              <p className="text-green-700 text-sm">
                Поздравляем! Вы успешно прошли весь чек-ап
              </p>
            </div>
            
            {onViewResults && (
              <button
                onClick={onViewResults}
                className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors w-full"
              >
                📊 Посмотреть результаты
              </button>
            )}
            
            <button
              onClick={onStartAssessment}
              className="bg-slate-400 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-500 transition-colors w-full"
            >
              Пересмотреть ответы
            </button>
          </div>
        )}
        
        {onBackToSelection && (
          <div>
            <button
              onClick={onBackToSelection}
              className="text-slate-500 text-sm hover:text-slate-700 transition-colors underline"
            >
              Изменить формат опроса
            </button>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="px-4 pb-6">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            isExpanded={expandedCategory === category.id}
            onToggle={() => handleToggleCategory(category.id)}
            onStartSurvey={onStartSurvey}
            isLocked={getCategoryLockStatus(index)}
            stepNumber={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
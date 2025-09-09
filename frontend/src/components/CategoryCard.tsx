import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Category } from '../types/survey';



interface CategoryCardProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onStartSurvey: (categoryId: string) => void;
  isLocked: boolean;
  stepNumber: number;
}

export function CategoryCard({ category, isExpanded, onToggle, onStartSurvey, isLocked, stepNumber }: CategoryCardProps) {
  const progressPercentage = Math.round((category.completedQuestions / category.totalQuestions) * 100);
  const isCompleted = category.completedQuestions === category.totalQuestions;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={onToggle}
          className="flex items-center gap-2 text-muted-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="text-sm">ШАГ {stepNumber}</span>
        </button>
      </div>
      
      <div className={`rounded-lg overflow-hidden ${
        isLocked ? 'bg-slate-300' : isCompleted ? 'bg-pink-400' : 'bg-slate-500'
      }`}>
        <div className={`px-4 py-3 text-center font-medium ${
          isLocked ? 'text-slate-400' : 'text-white'
        }`}>
          {category.name}
          {isLocked && (
            <span className="ml-2">🔒</span>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-white border border-slate-200 rounded-b-lg p-4 mt-1">
          <div className="text-sm text-slate-600 mb-3">
            <strong>Подкатегории:</strong> {category.subcategories.join(', ')}
          </div>
          
          {isLocked ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 mb-2">
                Завершите предыдущую категорию, чтобы разблокировать эту
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-500">
                  {category.completedQuestions} / {category.totalQuestions}
                </div>
                {category.completedQuestions > 0 && (
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                )}
              </div>
              
              {category.completedQuestions === 0 && (
                <button
                  onClick={() => onStartSurvey(category.id)}
                  className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors"
                >
                  Начать опрос
                </button>
              )}
              
              {category.completedQuestions > 0 && category.completedQuestions < category.totalQuestions && (
                <button
                  onClick={() => onStartSurvey(category.id)}
                  className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors"
                >
                  Продолжить
                </button>
              )}
              
              {isCompleted && (
                <button
                  onClick={() => onStartSurvey(category.id)}
                  className="w-full bg-slate-400 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-500 transition-colors"
                >
                  Пересмотреть ответы
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CategoryResult } from 'bizass-shared';
import api from '@/services/api';

/**
 * CategoryDetailPage Component
 *
 * Displays detailed information for a specific category following REPORT_RULES.md:
 * - Category name and overall score
 * - Content from CSV based on score range
 * - Subcategories (for full reports only)
 * - Navigation back to results overview
 *
 * Follows clean code principles:
 * - Single responsibility: displays category details
 * - Interface segregation: focused CategoryResult interface
 * - Error handling with graceful degradation
 */

interface ScoreIndicatorProps {
  score: number;
  color: string;
  label: string;
  showDescription?: boolean;
  description?: string;
}

function ScoreIndicator({ score, color, label, showDescription = false, description }: ScoreIndicatorProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-bold text-gray-900">{Math.round(score)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {showDescription && description && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

interface SubcategoryListProps {
  subcategories: CategoryResult['subcategories'];
}

function SubcategoryList({ subcategories }: SubcategoryListProps) {
  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
        Подкатегории
      </h2>

      <div className="space-y-4">
        {subcategories.map((subcategory, index) => (
          <motion.div
            key={subcategory.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <ScoreIndicator
              score={subcategory.score}
              color={subcategory.content.color}
              label={subcategory.name}
              showDescription={true}
              description={subcategory.content.resultDescription}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function CategoryDetailPage() {
  const { sessionId, categoryName, surveyType } = useParams<{ sessionId: string; categoryName: string; surveyType?: string }>();
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const [categoryData, setCategoryData] = useState<CategoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !categoryName) {
      navigate('/');
      return;
    }

    const loadCategoryDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getCategoryDetails(decodeURIComponent(categoryName), sessionId);
        setCategoryData(data);
      } catch (error) {
        console.error('Error loading category details:', error);
        setError('Не удалось загрузить детали категории');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoryDetails();
  }, [sessionId, categoryName, navigate]);

  const handleBack = () => {
    haptic.selection();
    if (surveyType && sessionId) {
      // Navigate back to survey page with results view
      navigate(`/${surveyType}/${sessionId}`);
    } else {
      // Fallback to home
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка деталей категории...</p>
        </div>
      </div>
    );
  }

  if (error || !categoryData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Категория недоступна</h2>
            <p className="text-gray-600 mb-6">
              {error || 'Не удалось найти информацию по этой категории'}
            </p>
          </div>
          <button
            onClick={handleBack}
            className="w-full btn-primary"
          >
            Вернуться к результатам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Назад к результатам
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {categoryData.name}
            </h1>
            <p className="text-lg text-gray-600">
              Результат: <span className="font-semibold">{Math.round(categoryData.score)}%</span>
            </p>
          </div>
        </motion.div>

        {/* Category Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8"
        >
          <ScoreIndicator
            score={categoryData.score}
            color={categoryData.content.color}
            label={categoryData.name}
          />
        </motion.div>

        {/* Category Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {categoryData.content.titleSummary}
          </h2>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {categoryData.content.result}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {categoryData.content.resultDescription}
            </p>
          </div>

          {/* Color indicator */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: categoryData.content.color }}
            />
            <span>
              Диапазон: {categoryData.content.min}% - {categoryData.content.max}%
            </span>
          </div>
        </motion.div>

        {/* Subcategories (for full reports) */}
        <SubcategoryList subcategories={categoryData.subcategories} />

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 space-y-4"
        >
          <button
            onClick={handleBack}
            className="w-full bg-gray-100 text-gray-700 py-3 px-8 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
          >
            Вернуться к результатам
          </button>
        </motion.div>
      </div>
    </div>
  );
}
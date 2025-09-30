import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { ArrowLeftIcon, ChevronRightIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { SurveyResults } from 'bizass-shared';
import api from '@/services/api';

/**
 * ResultsPage Component
 *
 * Displays comprehensive survey results following the REPORT_RULES.md specifications:
 * - Overall score with circular chart visualization
 * - Categories with scores and CSV color scheme
 * - Summary content from CSV data
 * - Navigation to category detail pages
 *
 * Follows clean code principles:
 * - Single responsibility: displays results overview
 * - DRY: reuses utility functions for color mapping
 * - Type safety: uses shared TypeScript interfaces
 */

interface CircularProgressProps {
  percentage: number;
  color: string;
  size?: number;
}

function CircularProgress({ percentage, color, size = 120 }: CircularProgressProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  name: string;
  score: number;
  color: string;
  onClick: () => void;
}

function CategoryCard({ name, score, color, onClick }: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-md border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{Math.round(score)}%</p>
          </div>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-1000 ease-out"
          style={{
            backgroundColor: color,
            width: `${Math.min(score, 100)}%`
          }}
        />
      </div>
    </motion.div>
  );
}

export default function ResultsPage() {
  const { sessionId, surveyType } = useParams<{ sessionId: string; surveyType?: string }>();
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const loadResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getSurveyResults(sessionId);
        setResults(data);
      } catch (error) {
        console.error('Error loading survey results:', error);
        setError('Не удалось загрузить результаты опроса');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [sessionId, navigate]);

  const handleBack = () => {
    haptic.selection();
    navigate('/');
  };

  const handleCategoryClick = (categoryName: string) => {
    haptic.impact('light');
    if (surveyType) {
      navigate(`/${surveyType}/${sessionId}/results/category/${encodeURIComponent(categoryName)}`);
    } else {
      // Fallback for old route pattern
      navigate(`/results/${sessionId}/category/${encodeURIComponent(categoryName)}`);
    }
  };

  const handleDownloadPdf = async () => {
    if (!sessionId) return;

    try {
      setIsPdfLoading(true);
      haptic.impact('medium');

      // Download the PDF (this handles both generation and download)
      const blob = await api.downloadReport(sessionId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizass-report-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      haptic.notification('success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      haptic.notification('error');
      // You could add a toast notification here
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Результаты недоступны</h2>
            <p className="text-gray-600 mb-6">
              {error || 'Не удалось найти результаты для этого опроса'}
            </p>
          </div>
          <button
            onClick={handleBack}
            className="w-full btn-primary"
          >
            Вернуться на главную
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
            На главную
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Результаты чекапа
            </h1>
            <p className="text-lg text-gray-600">
              {results.surveyType === 'express' ? 'Экспресс-аудит' : 'Полный аудит'} завершен
            </p>
          </div>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-8"
        >
          <div className="text-center">
            <CircularProgress
              percentage={results.overallScore}
              color={results.overallContent.color}
            />
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {results.overallContent.titleSummary}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {results.overallContent.resultDescription}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Сводный отчет
          </h2>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {results.overallContent.result}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {results.overallContent.resultDescription}
            </p>
          </div>
        </motion.div>

        {/* PDF Download Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <button
            onClick={handleDownloadPdf}
            disabled={isPdfLoading}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-2xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPdfLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Генерация отчета...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-5 h-5" />
                Скачать PDF отчет
              </>
            )}
          </button>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Детализация по категориям
          </h2>

          <div className="space-y-4">
            {results.categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <CategoryCard
                  name={category.name}
                  score={category.score}
                  color={category.content.color}
                  onClick={() => handleCategoryClick(category.name)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={handleBack}
            className="w-full bg-gray-100 text-gray-700 py-3 px-8 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
          >
            Вернуться на главную
          </button>
        </motion.div>
      </div>
    </div>
  );
}
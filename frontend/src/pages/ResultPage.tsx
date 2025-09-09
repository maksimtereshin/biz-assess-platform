import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { ArrowLeftIcon, ChartBarIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';

interface SurveyResult {
  id: string;
  surveyId: string;
  answers: Record<string, number>;
  timeSpent: number;
  completedAt: string;
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const loadResult = async () => {
      try {
        const data = await api.getReport(id);
        setResult(data);
      } catch (error) {
        console.error('Error loading result:', error);
        // Создаем демо-результат
        setResult({
          id,
          surveyId: 'demo-survey',
          answers: {},
          timeSpent: 1200,
          completedAt: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [id, navigate]);

  const handleBack = () => {
    haptic.selection();
    navigate('/');
  };

  const handlePayment = () => {
    haptic.impact('medium');
    navigate(`/payment/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Результаты не найдены</p>
          <button
            onClick={handleBack}
            className="mt-4 btn-primary"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
              Результаты ЧЕК АП
            </h1>
            <p className="text-lg text-gray-600">
              Ваш бизнес-аудит завершен
            </p>
          </div>
        </motion.div>

        {/* Основная информация */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(result.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Время прохождения</div>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(result.answers).length}
              </div>
              <div className="text-sm text-gray-600">Вопросов отвечено</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <div className="text-sm text-gray-600">
              Завершено: {formatDate(result.completedAt)}
            </div>
          </div>
        </motion.div>

        {/* Краткий отчет */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Краткий отчет
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Общий балл</span>
              <span className="font-bold text-gray-900">75/100</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Уровень развития</span>
              <span className="font-bold text-green-600">Средний</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Оценка стоимости</span>
              <span className="font-bold text-gray-900">50,000 ₽</span>
            </div>
          </div>
        </motion.div>

        {/* Рекомендации */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Основные рекомендации
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <span className="text-gray-700">
                Улучшить продуктовую линейку и позиционирование
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <span className="text-gray-700">
                Оптимизировать маркетинговую стратегию
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <span className="text-gray-700">
                Автоматизировать бизнес-процессы
              </span>
            </div>
          </div>
        </motion.div>

        {/* Кнопки действий */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ChartBarIcon className="w-6 h-6 inline mr-2" />
            Получить детальный отчет
          </button>
          
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
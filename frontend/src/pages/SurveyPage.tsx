import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurveyStore } from '@/store/survey';
import { useTelegram } from '@/hooks/useTelegram';
import toast from 'react-hot-toast';
import CategoryList from '@/components/CategoryList';
import QuestionView from '@/components/QuestionView';

export default function SurveyPage() {
  const { version } = useParams<{ version: 'express' | 'full' }>();
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton, showConfirm } = useTelegram();
  
  const {
    surveyId,
    questions,
    answers,
    currentQuestionIndex,
    isLoading,
    startSurvey,
    loadQuestions,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    completeSurvey,
    getCurrentQuestion,
    getProgress,
    getCategoriesWithProgress,
    getCurrentCategory,
    getCurrentSubcategory,
    reset,
  } = useSurveyStore();

  const [isCompleting, setIsCompleting] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const categories = getCategoriesWithProgress();
  const currentCategory = getCurrentCategory();
  const currentSubcategory = getCurrentSubcategory();

  useEffect(() => {
    if (!version || (version !== 'express' && version !== 'full')) {
      navigate('/');
      return;
    }

    // Если есть активный опрос, показываем вопросы
    if (surveyId && questions.length > 0) {
      setShowQuestions(true);
    }

    // Показываем кнопку назад
    showBackButton(() => handleCancel());

    return () => {
      hideBackButton();
    };
  }, [version, surveyId, questions.length]);

  const handleCancel = async () => {
    const confirmed = await showConfirm('Вы уверены, что хотите прервать опрос? Прогресс будет потерян.');
    if (confirmed) {
      reset();
      navigate('/');
    }
  };

  const handleStartSurvey = async () => {
    try {
      await startSurvey(version!);
      setShowQuestions(true);
    } catch (error) {
      console.error('Error starting survey:', error);
      toast.error('Ошибка при начале опроса');
    }
  };

  const handleContinueSurvey = () => {
    setShowQuestions(true);
  };

  const handleAnswer = (value: number) => {
    if (!currentQuestion) return;
    
    haptic.selection();
    answerQuestion(currentQuestion.id, value);
  };

  const handleNext = () => {
    if (!currentAnswer) {
      toast.error('Пожалуйста, выберите ответ');
      return;
    }
    
    haptic.impact('light');
    
    if (currentQuestionIndex === questions.length - 1) {
      handleCompleteSurvey();
    } else {
      nextQuestion();
    }
  };

  const handleCompleteSurvey = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      const result = await completeSurvey();
      toast.success('Опрос завершен!');
      
      // Переходим на страницу результатов
      navigate(`/result/${result.id}`);
      
    } catch (error) {
      console.error('Error completing survey:', error);
      toast.error('Ошибка при завершении опроса');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleBackToCategories = () => {
    setShowQuestions(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Показываем список категорий
  if (!showQuestions) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <CategoryList
          categories={categories}
          onStartSurvey={handleStartSurvey}
          onContinueSurvey={handleContinueSurvey}
          hasProgress={Object.keys(answers).length > 0}
        />
      </div>
    );
  }

  // Показываем вопросы
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Нет доступных вопросов</p>
          <button
            onClick={handleBackToCategories}
            className="mt-4 btn-primary"
          >
            Вернуться к категориям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AnimatePresence mode="wait">
        <QuestionView
          key={currentQuestion.id}
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
          onNext={handleNext}
          progress={`${currentQuestionIndex + 1} / ${questions.length}`}
          categoryName={currentCategory || ''}
          subcategoryName={currentSubcategory || ''}
        />
      </AnimatePresence>
      
      {/* Кнопка возврата к категориям */}
      <div className="text-center mt-6">
        <button
          onClick={handleBackToCategories}
          className="text-gray-500 hover:text-gray-700 underline"
        >
          Вернуться к категориям
        </button>
      </div>
    </div>
  );
}
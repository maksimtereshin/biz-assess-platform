import { useNavigate } from 'react-router-dom';
import { SurveyVariant } from '../types/survey';

export function SurveySelectionScreen() {
  const navigate = useNavigate();
  
  const handleSelectVariant = (variant: SurveyVariant) => {
    navigate(`/${variant}`);
  };
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-slate-400 text-white p-4 text-center">
        <h1 className="font-medium">Выберите формат опроса</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* Express Version */}
          <div className="bg-white rounded-lg p-6 border-2 border-transparent hover:border-teal-300 transition-colors">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="text-lg font-medium text-slate-800 mb-2">Экспресс-опрос</h2>
              <p className="text-sm text-slate-600 mb-4">
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

            <button
              onClick={() => handleSelectVariant('express')}
              className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors"
            >
              Выбрать экспресс-опрос
            </button>
          </div>

          {/* Full Version */}
          <div className="bg-white rounded-lg p-6 border-2 border-transparent hover:border-pink-300 transition-colors">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="text-lg font-medium text-slate-800 mb-2">Полный чек-ап</h2>
              <p className="text-sm text-slate-600 mb-4">
                Детальный анализ всех бизнес-процессов и компетенций
              </p>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Время прохождения:</span>
                <span className="font-medium">25-30 минут</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Количество вопросов:</span>
                <span className="font-medium">96 вопросов</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Категории:</span>
                <span className="font-medium">7 категорий</span>
              </div>
            </div>

            <button
              onClick={() => handleSelectVariant('full')}
              className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-600 transition-colors"
            >
              Выбрать полный чек-ап
            </button>
          </div>

          {/* Info */}
          <div className="text-center text-sm text-slate-500 mt-6">
            <p>💡 Экспресс-опрос содержит ключевые вопросы, полный чек-ап — максимально детальный анализ.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
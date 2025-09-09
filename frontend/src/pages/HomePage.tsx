import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { ClockIcon, ChartBarIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const [selectedVersion, setSelectedVersion] = useState<'express' | 'full' | null>(null);

  const surveyVersions = [
    {
      id: 'express' as const,
      title: 'Экспресс ЧЕК АП',
      description: 'Быстрая оценка ключевых аспектов бизнеса',
      time: '15-20 минут',
      questions: '~30 вопросов',
      icon: ClockIcon,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'full' as const,
      title: 'Полный ЧЕК АП',
      description: 'Комплексная оценка всех направлений бизнеса',
      time: '45-60 минут',
      questions: '~95 вопросов',
      icon: ChartBarIcon,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  const handleVersionSelect = (version: 'express' | 'full') => {
    haptic.selection();
    setSelectedVersion(version);
  };

  const handleStartSurvey = () => {
    if (!selectedVersion) return;
    
    haptic.impact('medium');
    navigate(`/survey/${selectedVersion}`);
  };

  const handleInstructions = (version: 'express' | 'full') => {
    haptic.selection();
    navigate(`/instructions/${version}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Бизнес ЧЕК АП
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Оцените состояние вашего бизнеса и получите персональные рекомендации по развитию
          </p>
        </motion.div>

        {/* Выбор версии опроса */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {surveyVersions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative cursor-pointer transition-all duration-300 ${
                selectedVersion === version.id
                  ? 'scale-105 shadow-xl'
                  : 'hover:scale-102 hover:shadow-lg'
              }`}
              onClick={() => handleVersionSelect(version.id)}
            >
              <div className={`${version.bgColor} ${version.borderColor} border-2 rounded-2xl p-6 h-full`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${version.color} rounded-xl flex items-center justify-center`}>
                    <version.icon className="w-6 h-6 text-white" />
                  </div>
                  {selectedVersion === version.id && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {version.title}
                </h3>

                <p className="text-gray-600 mb-4">
                  {version.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>{version.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>{version.questions}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInstructions(version.id);
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Подробнее
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Кнопка начала */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleStartSurvey}
            disabled={!selectedVersion}
            className={`px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
              selectedVersion
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <RocketLaunchIcon className="w-6 h-6 inline mr-2" />
            Начать ЧЕК АП
          </button>
        </motion.div>

        {/* Дополнительная информация */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center text-gray-500"
        >
          <p className="text-sm">
            Выберите подходящую версию опроса для получения точной оценки вашего бизнеса
          </p>
        </motion.div>
      </div>
    </div>
  );
}
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { ArrowLeftIcon, CheckIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function InstructionsPage() {
  const { version } = useParams<{ version: 'express' | 'full' }>();
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  if (!version || (version !== 'express' && version !== 'full')) {
    navigate('/');
    return null;
  }

  const versionInfo = {
    express: {
      title: 'Экспресс ЧЕК АП',
      description: 'Быстрая оценка ключевых аспектов бизнеса',
      time: '15-20 минут',
      questions: '~30 вопросов',
      categories: ['Продукт', 'Маркетинг', 'HR', 'Продажи', 'Автоматизация', 'Компетенции'],
    },
    full: {
      title: 'Полный ЧЕК АП',
      description: 'Комплексная оценка всех направлений бизнеса',
      time: '45-60 минут',
      questions: '~95 вопросов',
      categories: ['Продукт', 'Маркетинг', 'HR', 'Продажи', 'Автоматизация', 'Метрики', 'Компетенции'],
    },
  };

  const info = versionInfo[version];

  const instructions = [
    {
      icon: CheckIcon,
      title: 'Честные ответы',
      description: 'Отвечайте максимально честно на все вопросы. Это поможет получить точную оценку вашего бизнеса.',
    },
    {
      icon: ClockIcon,
      title: 'Время прохождения',
      description: `Время прохождения: ${info.time}. Вы можете прервать опрос в любой момент и продолжить позже.`,
    },
    {
      icon: ChartBarIcon,
      title: 'Детальный анализ',
      description: 'После завершения вы получите персональный отчет с анализом и рекомендациями по развитию.',
    },
  ];

  const handleStartSurvey = () => {
    haptic.impact('medium');
    navigate(`/survey/${version}`);
  };

  const handleBack = () => {
    haptic.selection();
    navigate('/');
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
            Назад
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {info.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {info.description}
            </p>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{info.time}</div>
                  <div className="text-sm text-gray-600">Время прохождения</div>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <ChartBarIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{info.questions}</div>
                  <div className="text-sm text-gray-600">Количество вопросов</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Категории */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Категории оценки
          </h2>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              {info.categories.map((category, index) => (
                <div
                  key={category}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-700 font-medium">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Инструкции */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Как проходить опрос
          </h2>
          <div className="space-y-4">
            {instructions.map((instruction, index) => (
              <motion.div
                key={instruction.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-md border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <instruction.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {instruction.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {instruction.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Кнопка начала */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={handleStartSurvey}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Начать {info.title}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

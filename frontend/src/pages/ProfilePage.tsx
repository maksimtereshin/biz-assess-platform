import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { ArrowLeftIcon, UserIcon, ChartBarIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { haptic, user: tgUser } = useTelegram();

  const handleBack = () => {
    haptic.selection();
    navigate('/');
  };

  const stats = [
    {
      label: 'Пройдено опросов',
      value: '3',
      icon: ChartBarIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Детальных отчетов',
      value: '1',
      icon: StarIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Время в системе',
      value: '2ч 30м',
      icon: ClockIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

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
              Профиль
            </h1>
            <p className="text-lg text-gray-600">
              Информация о вашей активности
            </p>
          </div>
        </motion.div>

        {/* Профиль пользователя */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {tgUser?.first_name || 'Пользователь'} {tgUser?.last_name || ''}
              </h2>
              <p className="text-gray-600">
                ID: {tgUser?.id || 'Неизвестно'}
              </p>
              {tgUser?.username && (
                <p className="text-blue-600">
                  @{tgUser.username}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Статистика */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
            Статистика активности
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`${stat.bgColor} rounded-xl p-4 text-center border border-gray-200`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl mb-3 shadow-md`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* История опросов */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
            История опросов
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Полный ЧЕК АП</div>
                <div className="text-sm text-gray-600">15 марта 2024</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">75/100</div>
                <div className="text-xs text-gray-500">Средний уровень</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Экспресс ЧЕК АП</div>
                <div className="text-sm text-gray-600">10 марта 2024</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">68/100</div>
                <div className="text-xs text-gray-500">Средний уровень</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Полный ЧЕК АП</div>
                <div className="text-sm text-gray-600">5 марта 2024</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-600">62/100</div>
                <div className="text-xs text-gray-500">Начинающий</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Действия */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-8 rounded-2xl font-bold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Пройти новый опрос
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
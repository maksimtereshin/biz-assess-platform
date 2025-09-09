import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';
import { ArrowLeftIcon, CreditCardIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function PaymentPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  const handleBack = () => {
    haptic.selection();
    navigate(`/result/${reportId}`);
  };

  const handlePayment = () => {
    haptic.impact('medium');
    // В реальном приложении здесь будет интеграция с платежной системой
    alert('Демо-режим: Платеж успешно обработан!');
    navigate(`/result/${reportId}`);
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
            Назад к результатам
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Детальный отчет
            </h1>
            <p className="text-lg text-gray-600">
              Получите полный анализ с персональными рекомендациями
            </p>
          </div>
        </motion.div>

        {/* Информация о продукте */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Что включено в отчет
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckIcon className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">Детальный анализ по каждой категории</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckIcon className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Персональные рекомендации</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <CheckIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-gray-700">Пошаговый план действий</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <CheckIcon className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">Оценка стоимости бизнеса</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
              <CheckIcon className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-700">Скачивание в PDF формате</span>
            </div>
          </div>
        </motion.div>

        {/* Цена */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Стоимость</h3>
            <div className="text-4xl font-bold mb-2">2,990 ₽</div>
            <p className="text-green-100">
              Вместо <span className="line-through">4,990 ₽</span>
            </p>
            <p className="text-sm text-green-100 mt-2">
              Экономия 2,000 ₽ при заказе сейчас
            </p>
          </div>
        </motion.div>

        {/* Способы оплаты */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Способы оплаты
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CreditCardIcon className="w-6 h-6 text-gray-600" />
              <span className="text-gray-700">Банковские карты (Visa, MasterCard, МИР)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <span className="text-gray-700">Telegram Pay</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="text-gray-700">СБП (Система быстрых платежей)</span>
            </div>
          </div>
        </motion.div>

        {/* Гарантии */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-6"
        >
          <h3 className="text-lg font-bold text-blue-900 mb-3 text-center">
            Гарантии
          </h3>
          
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-600" />
              <span>Безопасная оплата через защищенное соединение</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-600" />
              <span>Возврат средств в течение 7 дней</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-600" />
              <span>Техническая поддержка 24/7</span>
            </div>
          </div>
        </motion.div>

        {/* Кнопка оплаты */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <CreditCardIcon className="w-6 h-6 inline mr-2" />
            Оплатить 2,990 ₽
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Нажимая кнопку, вы соглашаетесь с условиями использования
          </p>
        </motion.div>
      </div>
    </div>
  );
}
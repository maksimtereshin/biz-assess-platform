
interface AuthPromptProps {
  isVisible: boolean;
  onDismiss: () => void;
  onOpenTelegram: () => void;
}

export function AuthPrompt({ isVisible, onDismiss, onOpenTelegram }: AuthPromptProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Telegram Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.333-.372-.12L9.837 13.18l-2.958-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.834.677z"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
          Необходима авторизация
        </h2>

        {/* Message */}
        <div className="text-gray-600 text-center mb-6 space-y-3">
          <p>
            Для прохождения бизнес-оценки необходимо войти через Telegram.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-left">
            <p className="font-medium mb-2">Как войти:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Откройте приложение Telegram</li>
              <li>Найдите бота Business Assessment</li>
              <li>Нажмите "Начать" или отправьте /start</li>
              <li>Следуйте инструкциям для авторизации</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onOpenTelegram}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Открыть Telegram
          </button>
        </div>
      </div>
    </div>
  );
}
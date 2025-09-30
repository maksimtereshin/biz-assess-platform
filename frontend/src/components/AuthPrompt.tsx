
interface AuthPromptProps {
  isVisible: boolean;
  onDismiss: () => void;
  onOpenTelegram: () => void;
  errorType?: 'token_expired' | 'service_unavailable' | 'auth_required';
}

export function AuthPrompt({ isVisible, onDismiss, onOpenTelegram, errorType = 'auth_required' }: AuthPromptProps) {
  if (!isVisible) return null;

  const getErrorContent = () => {
    switch (errorType) {
      case 'token_expired':
        return {
          title: 'Сессия истекла',
          message: 'Ваша сессия истекла. Необходимо повторно войти через Telegram.',
          instructions: [
            'Откройте приложение Telegram',
            'Найдите бота Business Assessment',
            'Нажмите "Начать опрос" снова',
            'Получите новую ссылку для входа'
          ]
        };
      case 'service_unavailable':
        return {
          title: 'Сервис временно недоступен',
          message: 'Сервер временно недоступен. Пожалуйста, попробуйте через несколько минут.',
          instructions: [
            'Подождите 1-2 минуты',
            'Обновите страницу',
            'Если проблема сохраняется, перейдите в Telegram',
            'Получите новую ссылку от бота'
          ]
        };
      default:
        return {
          title: 'Необходима авторизация',
          message: 'Для прохождения бизнес-оценки необходимо войти через Telegram.',
          instructions: [
            'Откройте приложение Telegram',
            'Найдите бота Business Assessment',
            'Нажмите "Начать" или отправьте /start',
            'Следуйте инструкциям для авторизации'
          ]
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Icon - different colors for different error types */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            errorType === 'service_unavailable' ? 'bg-yellow-500' :
            errorType === 'token_expired' ? 'bg-orange-500' : 'bg-blue-500'
          }`}>
            {errorType === 'service_unavailable' ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : errorType === 'token_expired' ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.333-.372-.12L9.837 13.18l-2.958-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.834.677z"/>
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
          {content.title}
        </h2>

        {/* Message */}
        <div className="text-gray-600 text-center mb-6 space-y-3">
          <p>
            {content.message}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-left">
            <p className="font-medium mb-2">Что делать:</p>
            <ol className="list-decimal list-inside space-y-1">
              {content.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
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
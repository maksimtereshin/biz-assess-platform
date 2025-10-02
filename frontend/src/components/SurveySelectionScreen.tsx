import { useNavigate } from 'react-router-dom';
import { SurveyType } from 'bizass-shared';
import { surveyTypeToVariant } from '../types/adapters';
import { useState } from 'react';
import { LocalStorageService } from '../services/localStorage';
import api from '../services/api';

export function SurveySelectionScreen() {
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectVariant = async (variant: SurveyType) => {
    // Convert SurveyType enum to local variant for API compatibility
    const surveyVariant = surveyTypeToVariant(variant);

    try {
      setIsLoading(true);

      // Clear any existing session data
      LocalStorageService.clearCurrentSession();

      // Get current user for telegram ID
      const user = LocalStorageService.getCurrentUser();
      const telegramId = user?.telegramId ? parseInt(user.telegramId) : undefined;
      console.log('User:', user);
      console.log('Telegram ID:', telegramId);

      // Create new session via API
      const response = await api.startSurvey(surveyVariant, telegramId);
      console.log('Survey start response:', response);
      console.log('Session:', response.session);
      console.log('Session Token:', response.sessionToken);

      const { session, sessionToken } = response;

      console.log('=== SESSION CREATION DEBUG ===');
      console.log('Created session ID:', session.id);
      console.log('Session token (first 30 chars):', sessionToken.substring(0, 30) + '...');
      console.log('Full session object:', JSON.stringify(session, null, 2));

      // Create a UserSession object from the API session
      const userSession = {
        id: session.id,
        userId: session.userId?.toString() || 'unknown', // Safe conversion with fallback
        surveyVariant: surveyVariant,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        isCompleted: false,
        currentQuestionIndex: 0
      };
      console.log('User Session object created:', JSON.stringify(userSession, null, 2));

      // Store new session info
      LocalStorageService.setCurrentSession(userSession);
      console.log('✓ Session saved to localStorage');

      api.setSessionToken(sessionToken);
      console.log('✓ Session token set in API client');

      LocalStorageService.setSessionToken(session.id, sessionToken);
      console.log('✓ Session token saved to localStorage for session:', session.id);

      // Verify token was saved correctly
      const savedToken = LocalStorageService.getSessionToken(session.id);
      console.log('Verification - Token retrieved from localStorage:', savedToken ? savedToken.substring(0, 30) + '...' : 'NULL');
      console.log('Tokens match:', savedToken === sessionToken);

      console.log('=== NAVIGATING TO:', `/${surveyVariant}/${session.id}`, '===');

      // Navigate to survey with session ID and autoStart flag
      navigate(`/${surveyVariant}/${session.id}`, {
        state: { autoStart: true }
      });
    } catch (error) {
      console.error('Error starting survey:', error);
      // Fallback to old navigation if session creation fails
      navigate(`/${surveyVariant}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    LocalStorageService.clearAllData();
    setShowResetConfirm(false);
    // Reload page for complete state reset
    window.location.reload();
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };
  
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-slate-400 text-white p-4 text-center relative">
        <h1 className="font-medium">Выберите формат опроса</h1>

        {/* TODO: Remove after development is done (with relative) */}
        <button
          onClick={handleResetData}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-red-200 transition-colors"
          title="Сбросить все данные для повторного тестирования"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
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
              onClick={() => handleSelectVariant(SurveyType.EXPRESS)}
              disabled={isLoading}
              className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Создание сессии...' : 'Выбрать экспресс-опрос'}
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
              onClick={() => handleSelectVariant(SurveyType.FULL)}
              disabled={isLoading}
              className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Создание сессии...' : 'Выбрать полный чек-ап'}
            </button>
          </div>

          {/* Info */}
          <div className="text-center text-sm text-slate-500 mt-6">
            <p>💡 Экспресс-опрос содержит ключевые вопросы, полный чек-ап — максимально детальный анализ.</p>
          </div>
        </div>
      </div>
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Сбросить все данные?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Это действие удалит все сохраненные ответы и прогресс. Вы сможете пройти опрос заново.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelReset}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmReset}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
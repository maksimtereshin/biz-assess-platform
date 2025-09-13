import { Routes, Route } from 'react-router-dom';
import { SurveySelectionScreen } from './components/SurveySelectionScreen';
import { ExpressPage } from './pages/ExpressPage';
import { FullPage } from './pages/FullPage';
import { AuthLoader } from './components/AuthLoader';
import { AuthPrompt } from './components/AuthPrompt';
import { useAuthStore } from './store/auth';
import { useAuthPrompt } from './hooks/useAuthPrompt';

export default function App() {
  const { isLoading, isAuthenticated } = useAuthStore();
  const { showPrompt, promptTelegramAuth, dismissPrompt, openTelegram } = useAuthPrompt();

  if (isLoading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthLoader message="Необходима авторизация через Telegram" />
        <AuthPrompt
          isVisible={showPrompt}
          onDismiss={dismissPrompt}
          onOpenTelegram={openTelegram}
        />
        {!showPrompt && (
          <div className="fixed bottom-4 right-4">
            <button
              onClick={promptTelegramAuth}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Войти через Telegram
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<SurveySelectionScreen />} />
      <Route path="/express/*" element={<ExpressPage />} />
      <Route path="/full/*" element={<FullPage />} />
    </Routes>
  );
}
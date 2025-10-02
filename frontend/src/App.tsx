import { Routes, Route } from 'react-router-dom';
import { SurveySelectionScreen } from './components/SurveySelectionScreen';
import { ExpressPage } from './pages/ExpressPage';
import { FullPage } from './pages/FullPage';
import ResultsPage from './pages/ResultsPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
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
      {/* Direct routes from Telegram (without sessionId) */}
      <Route path="/express" element={<ExpressPage />} />
      <Route path="/full" element={<FullPage />} />
      {/* Routes with sessionId */}
      <Route path="/express/:sessionId" element={<ExpressPage />} />
      <Route path="/full/:sessionId" element={<FullPage />} />
      <Route path="/:surveyType/:sessionId/results" element={<ResultsPage />} />
      <Route path="/:surveyType/:sessionId/results/category/:categoryName" element={<CategoryDetailPage />} />
      {/* Keep old routes for backward compatibility temporarily */}
      <Route path="/express/*" element={<ExpressPage />} />
      <Route path="/full/*" element={<FullPage />} />
      <Route path="/results/:sessionId" element={<ResultsPage />} />
      <Route path="/results/:sessionId/category/:categoryName" element={<CategoryDetailPage />} />
    </Routes>
  );
}
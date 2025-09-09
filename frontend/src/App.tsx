import { Routes, Route } from 'react-router-dom';
import { SurveySelectionScreen } from './components/SurveySelectionScreen';
import { ExpressPage } from './pages/ExpressPage';
import { FullPage } from './pages/FullPage';
import { AuthLoader } from './components/AuthLoader';
import { useAuthStore } from './store/auth';

export default function App() {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return <AuthLoader message="Не удалось аутентифицироваться" />;
  }

  return (
    <Routes>
      <Route path="/" element={<SurveySelectionScreen />} />
      <Route path="/express/*" element={<ExpressPage />} />
      <Route path="/full/*" element={<FullPage />} />
    </Routes>
  );
}
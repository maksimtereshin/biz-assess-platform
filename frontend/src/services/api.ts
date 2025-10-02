import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Survey, SurveySession, SurveyType, SurveyResults, CategoryResult } from 'bizass-shared';
import { SurveyVariant } from '../types/adapters';
import { useAuthStore } from '../store/auth';

// API client configuration - always use VITE_API_URL (set at build time)
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

class ApiClient {
  private client: AxiosInstance;
  private sessionToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      // Prioritize sessionToken for survey operations, fallback to auth store
      const authToken = useAuthStore.getState().token;
      const token = this.sessionToken || authToken;

      console.log('=== API REQUEST INTERCEPTOR ===');
      console.log('Method:', config.method?.toUpperCase());
      console.log('URL:', config.url);
      console.log('Base URL:', config.baseURL);
      console.log('Full URL:', `${config.baseURL}${config.url}`);
      console.log('Session token in memory:', this.sessionToken ? `${this.sessionToken.substring(0, 30)}...` : 'NULL');
      console.log('Auth token from store:', authToken ? `${authToken.substring(0, 30)}...` : 'NULL');
      console.log('Final token to use:', token ? `${token.substring(0, 30)}...` : 'NULL');
      console.log('Token source:', this.sessionToken ? 'SESSION_TOKEN' : authToken ? 'AUTH_STORE' : 'NONE');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✓ Authorization header set');
      } else {
        console.warn('⚠️ No token available for this request!');
      }

      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // In development mode, be more lenient with auth errors during initial setup
          const isDevelopment = import.meta.env.DEV;
          const { isLoading } = useAuthStore.getState();

          if (isDevelopment && isLoading) {
            // Auth might be in progress, don't logout immediately
            console.warn('Authentication error during auth initialization in development mode');
          } else {
            console.warn('Authentication required - prompting user to login via Telegram');
            this.clearSessionToken();
            useAuthStore.getState().logout();

            // Show user-friendly authentication prompt
            this.promptTelegramAuth();
          }
        }

        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        });
        return Promise.reject(error);
      }
    );
  }

  setSessionToken(token: string) {
    this.sessionToken = token;
  }

  clearSessionToken() {
    this.sessionToken = null;
  }

  private async promptTelegramAuth() {
    // Check if we're running inside Telegram WebApp
    if (window.Telegram?.WebApp) {
      // Use Telegram WebApp's showAlert to prompt user
      window.Telegram.WebApp.showAlert(
        'Для продолжения опроса необходимо войти через Telegram. Пожалуйста, откройте приложение Telegram и авторизуйтесь.',
        () => {
          // Redirect to main Telegram app or refresh
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
          }
        }
      );
    } else {
      // For web browsers, automatically redirect to bot
      try {
        // Get bot info to construct proper deep link
        let botUsername = import.meta.env.VITE_BOT_USERNAME;

        // If no bot username in env, try to get it from the backend
        if (!botUsername) {
          try {
            const response = await this.client.get('/telegram/bot-info');
            botUsername = response.data.username;
          } catch (error) {
            console.warn('Could not get bot username:', error);
          }
        }

        if (botUsername) {
          // Direct deep link to specific bot with start command
          const botUrl = `https://t.me/${botUsername}?start=webapp`;
          const appUrl = `tg://resolve?domain=${botUsername}&start=webapp`;

          // Try native app first
          window.location.href = appUrl;

          // Fallback to web version after short delay
          setTimeout(() => {
            window.open(botUrl, '_blank');
          }, 1500);
        } else {
          // Generic Telegram opening as fallback
          const telegramAppUrl = 'tg://';
          const fallbackUrl = 'https://t.me/';

          window.location.href = telegramAppUrl;
          setTimeout(() => {
            window.open(fallbackUrl, '_blank');
          }, 1500);
        }
      } catch (error) {
        console.error('Error opening Telegram:', error);
        // Final fallback
        window.open('https://t.me/', '_blank');
      }
    }
  }

  // Authentication endpoints
  async authenticate(token: string, surveyType: SurveyType): Promise<{ session: SurveySession; sessionToken: string }> {
    const response: AxiosResponse<{ session: SurveySession; sessionToken: string }> = 
      await this.client.post('/auth/authenticate', { token, surveyType });
    
    this.setSessionToken(response.data.sessionToken);
    return response.data;
  }

  async validateToken(token: string): Promise<{ telegramId: number; sessionId: string }> {
    const response = await this.client.get(`/auth/validate?token=${token}`);
    return response.data;
  }

  // Survey endpoints
  async getSurveyStructure(type: string): Promise<Survey> {
    const response: AxiosResponse<Survey> = await this.client.get(`/surveys/${type}`);
    return response.data;
  }

  async getSessionToken(sessionId: string): Promise<string> {
    const response = await this.client.post(`/surveys/session/${sessionId}/token`);
    return response.data.sessionToken;
  }

  async getCurrentSession(sessionId: string): Promise<SurveySession> {
    const response: AxiosResponse<SurveySession> = await this.client.get(`/surveys/session/${sessionId}`);
    return response.data;
  }

  async submitAnswer(questionId: number, score: number): Promise<void> {
    await this.client.post('/surveys/answer', {
      questionId,
      score,
    });
  }

  async completeSession(): Promise<{ message: string; sessionId: string }> {
    const response = await this.client.post('/surveys/session/complete');
    return response.data;
  }

  // Additional methods from BusinessAssessmentPlatform
  async startSurvey(version: SurveyVariant, telegramId?: number): Promise<{ session: SurveySession; sessionToken: string }> {
    const surveyType = version.toUpperCase(); // 'express' → 'EXPRESS', 'full' → 'FULL'

    const response = await this.client.post('/surveys/start', {
      telegramId: telegramId || Date.now(), // Fallback to timestamp if no telegramId
      surveyType: surveyType
    });

    if (response.data.sessionToken) {
      this.setSessionToken(response.data.sessionToken);
    }

    return response.data;
  }

  async restoreSurveySession(_userId: string, _version: SurveyVariant, sessionId?: string): Promise<SurveySession | null> {
    // Try to get the specific session if we have both a token and session ID
    if (this.sessionToken && sessionId) {
      try {
        return await this.getCurrentSession(sessionId);
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.clearSessionToken();
      }
    }
    return null;
  }

  async saveAnswer(_surveyId: string, questionId: string, answer: number): Promise<void> {
    // Use the submitAnswer method which expects questionId as a number
    await this.submitAnswer(parseInt(questionId), answer);
  }

  async getReport(reportId: string): Promise<any> {
    const response = await this.client.get(`/reports/${reportId}`);
    return response.data;
  }

  // New results endpoints following clean architecture
  async getSurveyResults(sessionId: string): Promise<SurveyResults> {
    const response: AxiosResponse<SurveyResults> = await this.client.get(`/surveys/results/${sessionId}`);
    return response.data;
  }

  async getCategoryDetails(categoryName: string, sessionId: string): Promise<CategoryResult> {
    const response: AxiosResponse<CategoryResult> = await this.client.get(`/surveys/category/${categoryName}/${sessionId}`);
    return response.data;
  }

  // PDF Report endpoints
  async generateReport(sessionId: string): Promise<{ id: string; storage_url: string }> {
    const response = await this.client.post(`/reports/generate/${sessionId}`);
    return response.data;
  }

  async downloadReport(sessionId: string): Promise<Blob> {
    // First generate the report to get the reportId
    const report = await this.generateReport(sessionId);

    // Then download the PDF using the reportId
    const response = await this.client.get(`/reports/download/${report.id}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // User surveys status
  async getUserSurveysStatus(telegramId: number): Promise<{
    express: { hasCompleted: boolean; activeSessionId: string | null; lastCompletedAt: string | null };
    full: { hasCompleted: boolean; activeSessionId: string | null; lastCompletedAt: string | null };
  }> {
    const response = await this.client.get(`/surveys/user/${telegramId}/status`);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Survey, SurveySession, SurveyType } from 'bizass-shared';
import { useAuthStore } from '../store/auth';

// API client configuration - use relative URLs for production, full URL for development
const API_BASE_URL = import.meta.env.DEV 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  : '/api'; // In production, nginx will proxy /api to backend

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
      // Get token from auth store first, fallback to sessionToken
      const authToken = useAuthStore.getState().token;
      const token = authToken || this.sessionToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Authentication required - prompting user to login via Telegram');
          this.clearSessionToken();
          useAuthStore.getState().logout();

          // Show user-friendly authentication prompt
          this.promptTelegramAuth();
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

  private promptTelegramAuth() {
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
      // For web browsers, show a more detailed prompt
      const shouldOpenTelegram = window.confirm(
        'Для использования этого сервиса необходима авторизация через Telegram.\n\n' +
        'Откройте приложение Telegram на вашем устройстве и:\n' +
        '1. Найдите бота Business Assessment\n' +
        '2. Нажмите "Начать" или отправьте /start\n' +
        '3. Следуйте инструкциям для прохождения опроса\n\n' +
        'Открыть Telegram?'
      );

      if (shouldOpenTelegram) {
        // Try to open Telegram app
        const telegramAppUrl = 'tg://resolve';
        const fallbackUrl = 'https://t.me/'; // Replace with your actual bot username

        // Try to open Telegram app
        window.location.href = telegramAppUrl;

        // Fallback to web Telegram after a short delay
        setTimeout(() => {
          window.open(fallbackUrl, '_blank');
        }, 1000);
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

  async getCurrentSession(): Promise<SurveySession> {
    const response: AxiosResponse<SurveySession> = await this.client.get('/surveys/session/current');
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

  // Utility method for generating test tokens (development only)
  async generateTestToken(telegramId: number): Promise<{ token: string; expiresAt: string; telegramId: number }> {
    const response = await this.client.post('/auth/generate-token', { telegramId });
    return response.data;
  }

  // Additional methods from BusinessAssessmentPlatform
  async startSurvey(version: 'express' | 'full', telegramId?: number): Promise<{ session: SurveySession; sessionToken: string }> {
    // Use the authenticate method if we have a telegram ID, otherwise start a new session
    if (telegramId) {
      // Generate a token for the telegram user and authenticate
      const tokenResponse = await this.generateTestToken(telegramId);
      return this.authenticate(tokenResponse.token, version as SurveyType);
    }
    // For non-telegram users, start a session with a default ID
    const response = await this.client.post('/surveys/start', {
      telegramId: Date.now(), // Use timestamp as a temporary ID
      surveyType: version
    });
    if (response.data.sessionToken) {
      this.setSessionToken(response.data.sessionToken);
    }
    return response.data;
  }

  async restoreSurveySession(_userId: string, _version: 'express' | 'full'): Promise<SurveySession | null> {
    // Try to get the current session if we have a token
    if (this.sessionToken) {
      try {
        return await this.getCurrentSession();
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
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

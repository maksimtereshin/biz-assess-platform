import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Survey, SurveySession, SurveyType } from 'bizass-shared';

// API client configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      if (this.sessionToken) {
        config.headers.Authorization = `Bearer ${this.sessionToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
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
  async startSurvey(version: 'express' | 'full'): Promise<{ surveyId: string; answers: Record<string, number> }> {
    const response = await this.client.post('/surveys', { version });
    return response.data;
  }

  async restoreSurveySession(userId: string, version: 'express' | 'full'): Promise<any> {
    const response = await this.client.get(`/surveys?version=${version}&status=in_progress&userId=${userId}`);
    return response.data;
  }

  async saveAnswer(surveyId: string, questionId: string, answer: number): Promise<any> {
    const response = await this.client.put(`/surveys/${surveyId}/answer`, {
      questionId,
      answer,
    });
    return response.data;
  }

  async getReport(reportId: string): Promise<any> {
    const response = await this.client.get(`/reports/${reportId}`);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

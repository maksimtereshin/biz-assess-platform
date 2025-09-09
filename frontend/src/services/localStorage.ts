import { User, UserSession, UserProgress } from '../types/user';
import { SurveyVariant } from '../types/survey';

const STORAGE_KEYS = {
  CURRENT_USER: 'business_assessment_current_user',
  CURRENT_SESSION: 'business_assessment_current_session',
  USER_RESPONSES: 'business_assessment_user_responses',
  USER_PROGRESS: 'business_assessment_user_progress',
} as const;

export class LocalStorageService {
  // User management
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static clearCurrentUser(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Session management
  static getCurrentSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  static setCurrentSession(session: UserSession): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  static updateSessionActivity(sessionId: string): void {
    const session = this.getCurrentSession();
    if (session && session.id === sessionId) {
      const updatedSession = {
        ...session,
        lastActivityAt: new Date().toISOString()
      };
      this.setCurrentSession(updatedSession);
    }
  }

  static completeSession(sessionId: string): void {
    const session = this.getCurrentSession();
    if (session && session.id === sessionId) {
      const updatedSession = {
        ...session,
        completedAt: new Date().toISOString(),
        isCompleted: true,
        lastActivityAt: new Date().toISOString()
      };
      this.setCurrentSession(updatedSession);
    }
  }

  static clearCurrentSession(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }

  // Responses management
  static getUserResponses(sessionId: string): Record<string, number> {
    try {
      const allResponses = localStorage.getItem(STORAGE_KEYS.USER_RESPONSES);
      const responses = allResponses ? JSON.parse(allResponses) : {};
      return responses[sessionId] || {};
    } catch {
      return {};
    }
  }

  static saveUserResponse(sessionId: string, questionId: string, answer: number): void {
    try {
      const allResponses = localStorage.getItem(STORAGE_KEYS.USER_RESPONSES);
      const responses = allResponses ? JSON.parse(allResponses) : {};
      
      if (!responses[sessionId]) {
        responses[sessionId] = {};
      }
      
      responses[sessionId][questionId] = answer;
      localStorage.setItem(STORAGE_KEYS.USER_RESPONSES, JSON.stringify(responses));
      
      // Update session activity
      this.updateSessionActivity(sessionId);
    } catch (error) {
      console.error('Failed to save user response:', error);
    }
  }

  static clearUserResponses(sessionId: string): void {
    try {
      const allResponses = localStorage.getItem(STORAGE_KEYS.USER_RESPONSES);
      const responses = allResponses ? JSON.parse(allResponses) : {};
      
      if (responses[sessionId]) {
        delete responses[sessionId];
        localStorage.setItem(STORAGE_KEYS.USER_RESPONSES, JSON.stringify(responses));
      }
    } catch (error) {
      console.error('Failed to clear user responses:', error);
    }
  }

  // Progress management
  static getUserProgress(sessionId: string): UserProgress[] {
    try {
      const allProgress = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
      const progress = allProgress ? JSON.parse(allProgress) : {};
      return progress[sessionId] || [];
    } catch {
      return [];
    }
  }

  static saveUserProgress(sessionId: string, categoryProgress: UserProgress[]): void {
    try {
      const allProgress = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
      const progress = allProgress ? JSON.parse(allProgress) : {};
      
      progress[sessionId] = categoryProgress;
      localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save user progress:', error);
    }
  }

  static clearUserProgress(sessionId: string): void {
    try {
      const allProgress = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
      const progress = allProgress ? JSON.parse(allProgress) : {};
      
      if (progress[sessionId]) {
        delete progress[sessionId];
        localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
      }
    } catch (error) {
      console.error('Failed to clear user progress:', error);
    }
  }

  // Get session by variant
  static getSessionByVariant(userId: string, surveyVariant: SurveyVariant): UserSession | null {
    try {
      const allSessions = localStorage.getItem(`${STORAGE_KEYS.CURRENT_SESSION}_${userId}_${surveyVariant}`);
      return allSessions ? JSON.parse(allSessions) : null;
    } catch {
      return null;
    }
  }

  // Save session by variant
  static saveSessionByVariant(session: UserSession): void {
    const key = `${STORAGE_KEYS.CURRENT_SESSION}_${session.userId}_${session.surveyVariant}`;
    localStorage.setItem(key, JSON.stringify(session));
  }

  // Create new session
  static createNewSession(userId: string, surveyVariant: SurveyVariant): UserSession {
    const session: UserSession = {
      id: `session_${surveyVariant}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      surveyVariant,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      isCompleted: false,
      currentQuestionIndex: 0
    };

    this.setCurrentSession(session);
    this.saveSessionByVariant(session);
    return session;
  }

  // Create or get user from Telegram data
  static createOrGetUser(telegramData?: any): User {
    let user = this.getCurrentUser();
    
    if (!user) {
      user = {
        id: telegramData?.id ? `tg_${telegramData.id}` : `user_${Date.now()}`,
        telegramId: telegramData?.id?.toString(),
        username: telegramData?.username,
        firstName: telegramData?.first_name,
        lastName: telegramData?.last_name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.setCurrentUser(user);
    }
    
    return user;
  }

  // Clear all data
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
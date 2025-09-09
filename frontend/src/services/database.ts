import { User, UserSession, UserProgress } from '../types/user';
import { SurveyVariant } from '../types/survey';
import { LocalStorageService } from './localStorage';

// Abstract interface for database operations
// This interface will be implemented by both localStorage and Supabase services
export interface DatabaseService {
  // User operations
  getCurrentUser(): Promise<User | null>;
  createOrGetUser(telegramData?: any): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | null>;

  // Session operations
  createSession(userId: string, surveyVariant: SurveyVariant): Promise<UserSession>;
  getCurrentSession(): Promise<UserSession | null>;
  updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession | null>;
  completeSession(sessionId: string): Promise<void>;

  // Response operations
  saveResponse(sessionId: string, questionId: string, answer: number): Promise<void>;
  getResponses(sessionId: string): Promise<Record<string, number>>;
  
  // Progress operations
  saveProgress(sessionId: string, progress: UserProgress[]): Promise<void>;
  getProgress(sessionId: string): Promise<UserProgress[]>;

  // Utility operations
  clearUserData(userId: string): Promise<void>;
}

// Local storage implementation (current solution)
export class LocalDatabaseService implements DatabaseService {
  async getCurrentUser(): Promise<User | null> {
    return LocalStorageService.getCurrentUser();
  }

  async createOrGetUser(telegramData?: any): Promise<User> {
    return LocalStorageService.createOrGetUser(telegramData);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const currentUser = LocalStorageService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser = {
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      LocalStorageService.setCurrentUser(updatedUser);
      return updatedUser;
    }
    return null;
  }

  async createSession(userId: string, surveyVariant: SurveyVariant): Promise<UserSession> {
    return LocalStorageService.createNewSession(userId, surveyVariant);
  }

  async getCurrentSession(): Promise<UserSession | null> {
    return LocalStorageService.getCurrentSession();
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession | null> {
    const currentSession = LocalStorageService.getCurrentSession();
    if (currentSession && currentSession.id === sessionId) {
      const updatedSession = {
        ...currentSession,
        ...updates,
        lastActivityAt: new Date().toISOString()
      };
      LocalStorageService.setCurrentSession(updatedSession);
      return updatedSession;
    }
    return null;
  }

  async completeSession(sessionId: string): Promise<void> {
    LocalStorageService.completeSession(sessionId);
  }

  async saveResponse(sessionId: string, questionId: string, answer: number): Promise<void> {
    LocalStorageService.saveUserResponse(sessionId, questionId, answer);
  }

  async getResponses(sessionId: string): Promise<Record<string, number>> {
    return LocalStorageService.getUserResponses(sessionId);
  }

  async saveProgress(sessionId: string, progress: UserProgress[]): Promise<void> {
    LocalStorageService.saveUserProgress(sessionId, progress);
  }

  async getProgress(sessionId: string): Promise<UserProgress[]> {
    return LocalStorageService.getUserProgress(sessionId);
  }

  async clearUserData(userId: string): Promise<void> {
    const session = LocalStorageService.getCurrentSession();
    if (session && session.userId === userId) {
      LocalStorageService.clearUserResponses(session.id);
      LocalStorageService.clearUserProgress(session.id);
      LocalStorageService.clearCurrentSession();
    }
    LocalStorageService.clearCurrentUser();
  }
}

// TODO: Implement SupabaseDatabaseService
// export class SupabaseDatabaseService implements DatabaseService {
//   private supabase: SupabaseClient;
//   
//   constructor(supabaseUrl: string, supabaseKey: string) {
//     this.supabase = createClient(supabaseUrl, supabaseKey);
//   }
//   
//   // Implement all methods using Supabase operations
//   // ...
// }

// Export singleton instance
export const databaseService = new LocalDatabaseService();
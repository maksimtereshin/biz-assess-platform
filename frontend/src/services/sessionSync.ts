import { SurveyVariant } from '../types/survey';
import { LocalStorageService } from './localStorage';
import api from './api';

export interface SyncedSession {
  surveyId: string;
  version: SurveyVariant;
  answers: Record<string, number>;
  startedAt: string;
  lastActivityAt: string;
  currentCategory?: string;
  currentQuestionIndex?: number;
}

export interface SyncStatusCallbacks {
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export class SessionSyncService {
  private static statusCallbacks: SyncStatusCallbacks = {};

  static setStatusCallbacks(callbacks: SyncStatusCallbacks) {
    this.statusCallbacks = callbacks;
  }

  /**
   * Sync local session data to the backend
   */
  static async syncToBackend(sessionId: string): Promise<boolean> {
    this.statusCallbacks.onSyncStart?.();
    
    try {
      const session = LocalStorageService.getCurrentSession();
      const responses = LocalStorageService.getUserResponses(sessionId);
      
      if (!session || Object.keys(responses).length === 0) {
        this.statusCallbacks.onSyncComplete?.();
        return false;
      }

      // Sync each answer that hasn't been synced yet
      const syncPromises = Object.entries(responses).map(async ([questionId, answer]) => {
        try {
          await api.saveAnswer(sessionId, questionId, answer);
          return true;
        } catch (error) {
          console.warn(`Failed to sync answer ${questionId}:`, error);
          return false;
        }
      });

      const results = await Promise.allSettled(syncPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      console.log(`Synced ${successCount}/${Object.keys(responses).length} answers to backend`);
      
      this.statusCallbacks.onSyncComplete?.();
      return successCount > 0;
    } catch (error) {
      console.error('Failed to sync session to backend:', error);
      this.statusCallbacks.onSyncError?.(error as Error);
      return false;
    }
  }

  /**
   * Restore session from backend and merge with local data
   */
  static async restoreFromBackend(userId: string, version: SurveyVariant): Promise<SyncedSession | null> {
    try {
      const restoredSession = await api.restoreSurveySession(userId, version);
      if (!restoredSession) {
        return null;
      }

      // Get current local session
      const localSession = LocalStorageService.getCurrentSession();
      const localResponses = localSession ? LocalStorageService.getUserResponses(localSession.id) : {};

      // Merge backend and local data (backend takes precedence for conflicts)
      const mergedAnswers = {
        ...localResponses,
        ...restoredSession.answers,
      };

      return {
        surveyId: restoredSession.surveyId,
        version: restoredSession.version,
        answers: mergedAnswers,
        startedAt: restoredSession.startedAt,
        lastActivityAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to restore session from backend:', error);
      return null;
    }
  }

  /**
   * Auto-sync session data periodically
   */
  static startAutoSync(sessionId: string, intervalMs: number = 30000): () => void {
    const interval = setInterval(async () => {
      await this.syncToBackend(sessionId);
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Handle app visibility change to sync when user switches tabs/apps
   */
  static setupVisibilitySync(sessionId: string): () => void {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // App is being hidden, sync current state
        await this.syncToBackend(sessionId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also sync before page unload
    const handleBeforeUnload = async () => {
      await this.syncToBackend(sessionId);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }

  /**
   * Check if there's a newer session on the backend
   */
  static async checkForNewerSession(userId: string, version: SurveyVariant, localLastActivity: string): Promise<boolean> {
    try {
      const backendSession = await api.restoreSurveySession(userId, version);
      if (!backendSession) {
        return false;
      }

      const backendLastActivity = new Date(backendSession.startedAt).getTime();
      const localLastActivityTime = new Date(localLastActivity).getTime();

      return backendLastActivity > localLastActivityTime;
    } catch (error) {
      console.warn('Failed to check for newer session:', error);
      return false;
    }
  }
}

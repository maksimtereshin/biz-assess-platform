import { SurveyVariant } from '../types/survey';
import { LocalStorageService } from './localStorage';
import api from './api';
import ErrorHandler from '../utils/errorHandler';

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
          ErrorHandler.warn(`Failed to sync answer ${questionId}`, {
            component: 'SessionSyncService',
            operation: 'syncAnswersToBackend',
            additionalData: { questionId, answer: responses[questionId], error }
          });
          return false;
        }
      });

      const results = await Promise.allSettled(syncPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      ErrorHandler.info(`Synced ${successCount}/${Object.keys(responses).length} answers to backend`, {
        component: 'SessionSyncService',
        operation: 'syncAnswersToBackend',
        additionalData: { successCount, totalCount: Object.keys(responses).length }
      });
      
      this.statusCallbacks.onSyncComplete?.();
      return successCount > 0;
    } catch (error) {
      ErrorHandler.log(error, {
        component: 'SessionSyncService',
        operation: 'syncAnswersToBackend',
        additionalData: { sessionId }
      }, 'error');
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
        surveyId: restoredSession.id,
        version: restoredSession.surveyType === 'EXPRESS' ? 'express' : 'full',
        answers: mergedAnswers,
        startedAt: restoredSession.createdAt,
        lastActivityAt: new Date().toISOString(),
      };
    } catch (error) {
      ErrorHandler.log(error, {
        component: 'SessionSyncService',
        operation: 'restoreFromBackend',
        additionalData: { userId, version }
      }, 'error');
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

      const backendLastActivity = new Date(backendSession.createdAt).getTime();
      const localLastActivityTime = new Date(localLastActivity).getTime();

      return backendLastActivity > localLastActivityTime;
    } catch (error) {
      ErrorHandler.warn('Failed to check for newer session', {
        component: 'SessionSyncService',
        operation: 'hasNewerSession',
        additionalData: { userId, localLastActivity, error }
      });
      return false;
    }
  }
}

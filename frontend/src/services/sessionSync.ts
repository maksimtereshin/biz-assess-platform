import { SurveyVariant } from '../types/adapters';
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
  // Note: Sync status callbacks are deprecated but kept for backwards compatibility

  static setStatusCallbacks(_callbacks: SyncStatusCallbacks) {
    // No-op: sync callbacks are no longer used
  }

  /**
   * Sync local session data to the backend (DEPRECATED - answers are now saved immediately)
   * This method is kept for backwards compatibility but does nothing
   */
  static async syncToBackend(_sessionId: string): Promise<boolean> {
    // No-op: answers are now saved immediately when users respond
    // This prevents the 429 rate limiting errors
    return true;
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
   * Auto-sync session data periodically (DEPRECATED - no longer needed)
   * This method is kept for backwards compatibility but does nothing
   */
  static startAutoSync(_sessionId: string, _intervalMs: number = 30000): () => void {
    // No-op: answers are now saved immediately when users respond
    return () => {}; // Return empty cleanup function
  }

  /**
   * Handle app visibility change to sync when user switches tabs/apps (DEPRECATED - no longer needed)
   * This method is kept for backwards compatibility but does nothing
   */
  static setupVisibilitySync(_sessionId: string): () => void {
    // No-op: answers are now saved immediately when users respond
    return () => {}; // Return empty cleanup function
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

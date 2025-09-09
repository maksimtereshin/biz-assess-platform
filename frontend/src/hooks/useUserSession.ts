import { useState, useEffect, useCallback } from 'react';
import { User, UserSession } from '../types/user';
import { SurveyVariant } from '../types/survey';
import { LocalStorageService } from '../services/localStorage';
import api from '../services/api';

// Telegram Web Apps interface
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  ready: () => void;
  close: () => void;
  expand: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useUserSession() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from Telegram or localStorage
  const initializeUser = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for existing user session first
      const existingUser = LocalStorageService.getCurrentUser();
      const existingSession = LocalStorageService.getCurrentSession();

      if (existingUser && existingSession && !existingSession.isCompleted) {
        setUser(existingUser);
        setSession(existingSession);
        setIsLoading(false);
        return;
      }

      // Try to get Telegram user data
      let telegramData = null;
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        if (tg.initDataUnsafe.user) {
          telegramData = tg.initDataUnsafe.user;
        }
      }

      // Create or get user
      const userData = LocalStorageService.createOrGetUser(telegramData);
      setUser(userData);

      // If there's a completed session, we keep it but don't set as current
      if (existingSession && existingSession.isCompleted) {
        setSession(null);
      } else if (existingSession) {
        setSession(existingSession);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get or create session for specific variant
  const getOrCreateSession = useCallback((surveyVariant: SurveyVariant): UserSession | null => {
    if (!user) {
      setError('No user found');
      return null;
    }

    try {
      setError(null);
      
      // Check if session for this variant already exists
      const existingSession = LocalStorageService.getSessionByVariant(user.id, surveyVariant);
      
      if (existingSession && !existingSession.isCompleted) {
        setSession(existingSession);
        return existingSession;
      }
      
      // Create new session locally first
      const newSession = LocalStorageService.createNewSession(user.id, surveyVariant);
      
      // Try to create backend session asynchronously (don't block UI)
      const telegramId = user.telegramId ? parseInt(user.telegramId) : undefined;
      api.startSurvey(surveyVariant, telegramId).then(() => {
        // Backend session created successfully
        console.log('Backend session created for variant:', surveyVariant);
      }).catch((error: any) => {
        console.warn('Failed to create backend session, continuing with local session:', error);
      });
      
      setSession(newSession);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    }
  }, [user]);

  // Create new survey session (legacy method for compatibility)
  const createSession = useCallback((surveyVariant: SurveyVariant): UserSession | null => {
    return getOrCreateSession(surveyVariant);
  }, [getOrCreateSession]);

  // Update session activity
  const updateSessionActivity = useCallback(() => {
    if (!session) return;

    try {
      LocalStorageService.updateSessionActivity(session.id);
      setSession(prev => prev ? {
        ...prev,
        lastActivityAt: new Date().toISOString()
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session activity');
    }
  }, [session]);

  // Complete current session
  const completeSession = useCallback(() => {
    if (!session) return;

    try {
      LocalStorageService.completeSession(session.id);
      setSession(prev => prev ? { 
        ...prev, 
        isCompleted: true, 
        completedAt: new Date().toISOString() 
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
    }
  }, [session]);

  // Clear current session (for starting new assessment)
  const clearSession = useCallback(() => {
    if (session) {
      LocalStorageService.clearCurrentSession();
    }
    setSession(null);
  }, [session]);

  // Save response
  const saveResponse = useCallback((questionId: string, answer: number) => {
    if (!session) return;

    try {
      LocalStorageService.saveUserResponse(session.id, questionId, answer);
      updateSessionActivity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save response');
    }
  }, [session, updateSessionActivity]);

  // Get responses
  const getResponses = useCallback(() => {
    if (!session) return {};

    try {
      return LocalStorageService.getUserResponses(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get responses');
      return {};
    }
  }, [session]);

  // Clear all user data
  const clearAllData = useCallback(() => {
    try {
      LocalStorageService.clearAllData();
      setUser(null);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear user data');
    }
  }, []);

  // Check if user has completed survey for specific variant
  const hasCompletedSurvey = useCallback((surveyVariant: SurveyVariant) => {
    if (!user) return false;
    
    const variantSession = LocalStorageService.getSessionByVariant(user.id, surveyVariant);
    return variantSession?.isCompleted || false;
  }, [user]);

  // Check if user has completed any surveys
  const hasCompletedSurveys = useCallback(() => {
    // Check if there are any responses saved
    const currentSession = LocalStorageService.getCurrentSession();
    if (currentSession?.isCompleted) return true;
    
    // In future, could check for multiple completed sessions
    return false;
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  return {
    user,
    session,
    isLoading,
    error,
    
    // Actions
    createSession,
    getOrCreateSession,
    updateSessionActivity,
    completeSession,
    clearSession,
    saveResponse,
    getResponses,
    clearAllData,
    
    // Utilities
    hasCompletedSurvey,
    hasCompletedSurveys,
    
    // Telegram specific
    isTelegramApp: !!window.Telegram?.WebApp,
  };
}
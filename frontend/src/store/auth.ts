import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  stats: {
    totalSurveys: number;
    paidReports: number;
    referrals: number;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  init: (initData?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  initDemo: () => void;
  initDevelopmentAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,

      init: async () => {
        set({ isLoading: true });
        
        try {
          // Проверяем, есть ли уже сохраненный токен
          const currentToken = get().token;
          if (currentToken && !currentToken.startsWith('demo-token-')) {
            // Проверяем валидность токена
            try {
              const response = await fetch(`${import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : ''}/api/auth/verify`, {
                headers: {
                  'Authorization': `Bearer ${currentToken}`
                }
              });
              
              if (response.ok) {
                set({
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              }
            } catch (error) {
              console.warn('Token validation failed:', error);
              // Continue to re-authenticate
            }
          }

          // Пытаемся аутентифицироваться через Telegram
          if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            const telegramInitData = tg.initData;
            
            if (telegramInitData) {
              try {
                const response = await fetch(`${import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : ''}/api/auth/telegram`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    initData: telegramInitData,
                  }),
                });

                if (response.ok) {
                  const { token, user } = await response.json();
                  
                  set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                  return;
                }
              } catch (error) {
                console.warn('Telegram authentication failed:', error);
              }
            }
          }

          // В режиме разработки, если Telegram недоступен, попробуем создать тестовый токен
          if (import.meta.env.DEV) {
            await get().initDevelopmentAuth();
          } else {
            // В продакшене без Telegram аутентификации возвращаем ошибку
            throw new Error('Telegram authentication required');
          }
          
        } catch (error: any) {
          console.error('Auth error:', error);
          // При ошибке также инициализируем демо-режим
          get().initDemo();
        }
      },

      initDemo: async () => {
        try {
          // For demo mode, we need to bypass authentication since token generation is disabled in production
          // Instead, we'll try to authenticate with Telegram WebApp or fallback to a basic demo mode

          // Check if we can authenticate through Telegram WebApp
          if (window.Telegram?.WebApp?.initData) {
            // Try Telegram authentication first
            try {
              const response = await fetch(`${import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : ''}/api/auth/telegram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
              });

              if (response.ok) {
                const { token, user } = await response.json();
                set({
                  token,
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              }
            } catch (error) {
              console.warn('Telegram auth failed in demo mode:', error);
            }
          }

          // Fallback: create a local demo user without backend authentication
          // Note: API calls will fail until proper authentication is implemented
          const demoUser: User = {
            id: 1,
            telegramId: 123456789,
            username: 'demo_user',
            firstName: 'Демо',
            lastName: 'Пользователь',
            isAdmin: false,
            stats: {
              totalSurveys: 3,
              paidReports: 1,
              referrals: 0,
            },
          };

          console.warn('Demo mode: Running without backend authentication. API calls will fail.');

          set({
            token: null, // No valid token in demo mode
            user: demoUser,
            isAuthenticated: false, // Not really authenticated
            isLoading: false,
          });
        } catch (error) {
          console.error('Demo initialization failed:', error);
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      initDevelopmentAuth: async () => {
        try {
          console.log('Development mode: Attempting to generate test token...');

          // Generate a test token using development endpoint
          const testTelegramId = 123456789; // Fixed test ID for development

          const tokenResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/generate-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: testTelegramId }),
          });

          if (tokenResponse.ok) {
            const { token: authToken } = await tokenResponse.json();

            // Now use this token to authenticate and create a session
            const authResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/authenticate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: authToken,
                surveyType: 'EXPRESS' // Default to express for development
              }),
            });

            if (authResponse.ok) {
              const { sessionToken } = await authResponse.json();

              // Create a development user
              const devUser: User = {
                id: 1,
                telegramId: testTelegramId,
                username: 'dev_user',
                firstName: 'Dev',
                lastName: 'User',
                isAdmin: false,
                stats: {
                  totalSurveys: 0,
                  paidReports: 0,
                  referrals: 0,
                },
              };

              set({
                token: sessionToken, // Use session token for API calls
                user: devUser,
                isAuthenticated: true,
                isLoading: false,
              });

              console.log('Development authentication successful with session token');
              return;
            }
          }
        } catch (error) {
          console.warn('Development token generation failed:', error);
        }

        // Fallback to demo mode if development auth fails
        get().initDemo();
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
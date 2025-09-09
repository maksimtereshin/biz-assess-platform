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
              const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/verify`, {
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
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/telegram`, {
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

          // Если аутентификация через Telegram не удалась, используем демо-режим
          get().initDemo();
          
        } catch (error: any) {
          console.error('Auth error:', error);
          // При ошибке также инициализируем демо-режим
          get().initDemo();
        }
      },

      initDemo: () => {
        // Создаем демо-пользователя для тестирования
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

        const demoToken = 'demo-token-' + Date.now();

        set({
          token: demoToken,
          user: demoUser,
          isAuthenticated: true,
          isLoading: false,
        });
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
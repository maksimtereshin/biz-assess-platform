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
          // Проверяем URL параметры на наличие токена
          const urlParams = new URLSearchParams(window.location.search);
          const urlToken = urlParams.get('token');
          const tgWebAppData = urlParams.get('tgWebAppData');

          console.log('🔍 URL параметры:', {
            token: urlToken ? 'present' : 'absent',
            tgWebAppData: tgWebAppData ? 'present' : 'absent',
            allParams: Object.fromEntries(urlParams.entries())
          });

          // Если есть токен в URL, используем его для прямой авторизации
          if (urlToken) {
            console.log('🎫 Found token in URL, attempting direct authentication...');
            try {
              const response = await fetch(`${import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : ''}/api/auth/verify`, {
                headers: {
                  'Authorization': `Bearer ${urlToken}`
                }
              });

              if (response.ok) {
                // Создаем пользователя из токена
                const user = {
                  id: 1,
                  telegramId: 123456789, // Временно
                  username: 'url_user',
                  firstName: 'URL',
                  lastName: 'User',
                  isAdmin: false,
                  stats: {
                    totalSurveys: 0,
                    paidReports: 0,
                    referrals: 0,
                  },
                };

                set({
                  token: urlToken,
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                });

                // Очищаем URL от токена
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('token');
                window.history.replaceState({}, document.title, newUrl.toString());

                console.log('✅ URL token authentication successful!');
                return;
              }
            } catch (error) {
              console.warn('❌ URL token authentication failed:', error);
            }
          }

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
          console.log('🔍 Checking Telegram WebApp availability...');
          console.log('window.Telegram:', window.Telegram);
          console.log('window.Telegram?.WebApp:', window.Telegram?.WebApp);

          // Проверяем альтернативные источники данных из URL
          if (tgWebAppData) {
            console.log('📱 Found tgWebAppData in URL, attempting authentication...');
            try {
              const response = await fetch(`${import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : ''}/api/auth/telegram`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  initData: tgWebAppData,
                }),
              });

              if (response.ok) {
                const { token, user } = await response.json();
                console.log('✅ tgWebAppData authentication successful!');

                set({
                  token,
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                });

                // Очищаем URL от параметров
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('tgWebAppData');
                window.history.replaceState({}, document.title, newUrl.toString());

                return;
              } else {
                const errorText = await response.text();
                console.error('❌ tgWebAppData authentication failed:', response.status, errorText);
              }
            } catch (error) {
              console.error('❌ tgWebAppData authentication error:', error);
            }
          }

          if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            console.log('📱 Telegram WebApp object:', tg);
            console.log('📱 Telegram WebApp version:', (tg as any).version);
            console.log('📱 Telegram WebApp platform:', (tg as any).platform);
            console.log('📱 Raw initData:', tg.initData);
            console.log('📱 initData length:', tg.initData?.length || 0);

            const telegramInitData = tg.initData;

            if (telegramInitData && telegramInitData.trim()) {
              console.log('✅ InitData available, attempting authentication...');
              try {
                const apiUrl = `${import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : ''}/api/auth/telegram`;
                console.log('📡 API URL:', apiUrl);

                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    initData: telegramInitData,
                  }),
                });

                console.log('📡 Response status:', response.status);
                console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

                if (response.ok) {
                  const { token, user } = await response.json();
                  console.log('✅ Telegram authentication successful!');
                  console.log('👤 User:', user);

                  set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                  return;
                } else {
                  const errorText = await response.text();
                  console.error('❌ Authentication failed:', response.status, errorText);
                }
              } catch (error) {
                console.error('❌ Telegram authentication error:', error);
              }
            } else {
              console.warn('⚠️ No initData available in Telegram WebApp');
              console.log('📱 Checking if we need to wait for WebApp to be ready...');

              // Попробуем подождать и повторить
              setTimeout(async () => {
                const retryInitData = tg.initData;
                console.log('🔄 Retry - initData after timeout:', retryInitData);
                if (retryInitData && retryInitData.trim()) {
                  console.log('🔄 Retrying authentication with delayed initData...');
                  await get().init(); // Recursive retry
                }
              }, 1000);
            }
          } else {
            console.warn('⚠️ Telegram WebApp not available');
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
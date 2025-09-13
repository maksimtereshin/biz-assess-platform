import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export function useAuthPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();

  // Auto-show prompt when not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Show prompt immediately for unauthenticated users
      setShowPrompt(true);
    }
  }, [isAuthenticated, isLoading]);

  const promptTelegramAuth = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const openTelegram = useCallback(async () => {
    // Check if we're running inside Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
      return;
    }

    try {
      // Get bot info to construct proper deep link
      let botUsername: string | undefined = import.meta.env.VITE_BOT_USERNAME;

      // If no bot username in env, try to get it from the backend
      if (!botUsername) {
        try {
          const response = await fetch('/api/telegram/bot-info');
          const botInfo = await response.json();
          botUsername = botInfo.username;
        } catch (error) {
          console.warn('Could not get bot username:', error);
          // Fallback to generic bot opening
          botUsername = undefined;
        }
      }

      if (botUsername) {
        // Direct deep link to specific bot with start command
        const botUrl = `https://t.me/${botUsername}?start=webapp`;
        const appUrl = `tg://resolve?domain=${botUsername}&start=webapp`;

        // Try native app first
        window.location.href = appUrl;

        // Fallback to web version after short delay
        setTimeout(() => {
          window.open(botUrl, '_blank');
        }, 1500);
      } else {
        // Generic Telegram opening as fallback
        const telegramAppUrl = 'tg://';
        const fallbackUrl = 'https://t.me/';

        window.location.href = telegramAppUrl;
        setTimeout(() => {
          window.open(fallbackUrl, '_blank');
        }, 1500);
      }
    } catch (error) {
      console.error('Error opening Telegram:', error);
      // Final fallback
      window.open('https://t.me/', '_blank');
    }

    dismissPrompt();
  }, [dismissPrompt]);

  return {
    showPrompt,
    isAuthenticated,
    promptTelegramAuth,
    dismissPrompt,
    openTelegram,
  };
}
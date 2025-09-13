import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export function useAuthPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();

  // Auto-show prompt when not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000); // Show after 2 seconds to let user see the loading message

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  const promptTelegramAuth = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const openTelegram = useCallback(() => {
    // Check if we're running inside Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      // Try to open Telegram app
      const telegramAppUrl = 'tg://resolve';
      const fallbackUrl = 'https://t.me/'; // Replace with your actual bot username

      // Try to open Telegram app
      window.location.href = telegramAppUrl;

      // Fallback to web Telegram after a short delay
      setTimeout(() => {
        window.open(fallbackUrl, '_blank');
      }, 1000);
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
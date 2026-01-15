import React, { useEffect, useState } from "react";
import { Box, H2, Text, Button } from "@adminjs/design-system";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

const TelegramLogin: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      try {
        // Check if running in Telegram WebApp context
        if (!window.Telegram?.WebApp?.initData) {
          setError("Эта страница должна открываться через Telegram бот");
          setIsLoading(false);
          return;
        }

        const initData = window.Telegram.WebApp.initData;

        // Notify Telegram that WebApp is ready
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        // Send initData to backend for validation
        const response = await fetch("/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ initData }),
        });

        if (!response.ok) {
          throw new Error("Ошибка авторизации");
        }

        // Authentication successful - redirect to dashboard
        window.location.href = "/admin";
      } catch (err: any) {
        console.error("Authentication error:", err);
        setError(err.message || "Ошибка авторизации");
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);

  if (isLoading) {
    return (
      <Box variant="white" p="xxl" textAlign="center">
        <H2>Авторизация...</H2>
        <Text mt="lg">Проверка данных Telegram...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box variant="white" p="xxl" textAlign="center">
        <H2>⚠️ Ошибка</H2>
        <Text mt="lg" color="error">
          {error}
        </Text>
        <Button mt="lg" onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </Box>
    );
  }

  return null;
};

export default TelegramLogin;

import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface WebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date: number;
    hash: string;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }, callback?: (buttonId: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: string) => void): void;
  sendData(data: string): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      setIsReady(true);
    }
  }, [tg]);

  const user = tg?.initDataUnsafe?.user;

  // Создаем заглушки для демо-режима
  const createStub = (name: string) => ({
    show: () => console.log(`${name}.show()`),
    hide: () => console.log(`${name}.hide()`),
    onClick: (callback: () => void) => console.log(`${name}.onClick()`),
    offClick: (callback: () => void) => console.log(`${name}.offClick()`),
    isVisible: false,
    isProgressVisible: false,
    isActive: false,
    text: '',
    color: '',
    textColor: '',
    enable: () => {},
    disable: () => {},
    showProgress: () => {},
    hideProgress: () => {},
    setText: () => {},
  });

  const createHapticStub = () => ({
    impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
      console.log(`Haptic impact: ${style}`);
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      console.log(`Haptic notification: ${type}`);
    },
    selection: () => {
      console.log('Haptic selection');
    },
  });

  const createPopupStub = () => ({
    showPopup: (title: string, message: string, buttons?: any[]) => {
      console.log(`Popup: ${title} - ${message}`);
      return Promise.resolve('ok');
    },
    showAlert: (message: string, callback?: () => void) => {
      console.log(`Alert: ${message}`);
      if (callback) callback();
    },
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
      console.log(`Confirm: ${message}`);
      if (callback) callback(true);
    },
  });

  return {
    tg: tg || {
      initData: '',
      initDataUnsafe: { user: undefined, auth_date: 0, hash: '' },
      themeParams: {},
      isExpanded: false,
      viewportHeight: 0,
      viewportStableHeight: 0,
      MainButton: createStub('MainButton'),
      BackButton: createStub('BackButton'),
      HapticFeedback: createHapticStub(),
      ready: () => {},
      expand: () => {},
      close: () => {},
      enableClosingConfirmation: () => {},
      disableClosingConfirmation: () => {},
      showPopup: () => {},
      showAlert: () => {},
      showConfirm: () => {},
      openLink: () => {},
      openTelegramLink: () => {},
      openInvoice: () => {},
      sendData: () => {},
      setHeaderColor: () => {},
      setBackgroundColor: () => {},
    },
    user,
    isReady,
    
    // Удобные методы
    showMainButton: (text: string, onClick: () => void) => {
      if (!tg) return;
      tg.MainButton.setText(text);
      tg.MainButton.onClick(onClick);
      tg.MainButton.show();
    },
    
    hideMainButton: () => {
      tg?.MainButton.hide();
    },
    
    showBackButton: (onClick?: () => void) => {
      if (!tg) return;
      if (onClick) {
        tg.BackButton.onClick(onClick);
      }
      tg.BackButton.show();
    },
    
    hideBackButton: () => {
      tg?.BackButton.hide();
    },
    
    showLoader: () => {
      tg?.MainButton.showProgress(true);
    },
    
    hideLoader: () => {
      tg?.MainButton.hideProgress();
    },
    
    haptic: {
      impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred(style);
        } else {
          console.log(`Haptic impact: ${style}`);
        }
      },
      notification: (type: 'error' | 'success' | 'warning') => {
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          console.log(`Haptic notification: ${type}`);
        }
      },
      selection: () => {
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.selectionChanged();
        } else {
          console.log('Haptic selection');
        }
      },
    },
    
    showPopup: (title: string, message: string, buttons?: any[]) => {
      if (tg?.showPopup) {
        return new Promise<string>((resolve) => {
          tg.showPopup(
            {
              title,
              message,
              buttons: buttons || [{ type: 'ok', text: 'OK' }],
            },
            (buttonId) => resolve(buttonId)
          );
        });
      }
      // Демо-реализация
      return new Promise<string>((resolve) => {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        resolve(confirmed ? 'ok' : 'cancel');
      });
    },
    
    showConfirm: (message: string) => {
      if (tg?.showConfirm) {
        return new Promise<boolean>((resolve) => {
          tg.showConfirm(message, (confirmed) => resolve(confirmed));
        });
      }
      // Демо-реализация
      return Promise.resolve(window.confirm(message));
    },
    
    openLink: (url: string) => {
      if (tg?.openLink) {
        tg.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
    
    sendData: (data: any) => {
      if (tg?.sendData) {
        tg.sendData(JSON.stringify(data));
      } else {
        console.log('Send data:', data);
      }
    },
    
    close: () => {
      if (tg?.close) {
        tg.close();
      } else {
        console.log('Close app');
      }
    },
  };
}
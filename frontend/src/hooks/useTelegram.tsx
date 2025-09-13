import { useEffect, useState } from 'react';

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

  // Create stubs for demo mode
  const createMainButtonStub = () => ({
    text: 'Main Button',
    color: '#2481cc',
    textColor: '#ffffff',
    isVisible: false,
    isProgressVisible: false,
    isActive: true,
    show: () => console.log('MainButton.show()'),
    hide: () => console.log('MainButton.hide()'),
    enable: () => console.log('MainButton.enable()'),
    disable: () => console.log('MainButton.disable()'),
    showProgress: (leaveActive?: boolean) => console.log('MainButton.showProgress()', leaveActive),
    hideProgress: () => console.log('MainButton.hideProgress()'),
    setText: (text: string) => console.log('MainButton.setText()', text),
    onClick: (_callback: () => void) => console.log('MainButton.onClick()'),
    offClick: (_callback: () => void) => console.log('MainButton.offClick()'),
  });

  const createBackButtonStub = () => ({
    isVisible: false,
    show: () => console.log('BackButton.show()'),
    hide: () => console.log('BackButton.hide()'),
    onClick: (_callback: () => void) => console.log('BackButton.onClick()'),
    offClick: (_callback: () => void) => console.log('BackButton.offClick()'),
  });

  const createHapticStub = () => ({
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
      console.log(`Haptic impact: ${style}`);
    },
    notificationOccurred: (type: 'error' | 'success' | 'warning') => {
      console.log(`Haptic notification: ${type}`);
    },
    selectionChanged: () => {
      console.log('Haptic selection');
    },
  });


  return {
    tg: tg || {
      initData: '',
      initDataUnsafe: { user: undefined, auth_date: 0, hash: '' },
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff',
        secondary_bg_color: '#f1f1f1',
      },
      isExpanded: false,
      viewportHeight: window.innerHeight || 600,
      viewportStableHeight: window.innerHeight || 600,
      MainButton: createMainButtonStub(),
      BackButton: createBackButtonStub(),
      HapticFeedback: createHapticStub(),
      ready: () => console.log('Telegram WebApp ready'),
      expand: () => console.log('Telegram WebApp expand'),
      close: () => console.log('Telegram WebApp close'),
      enableClosingConfirmation: () => console.log('Telegram WebApp enableClosingConfirmation'),
      disableClosingConfirmation: () => console.log('Telegram WebApp disableClosingConfirmation'),
      showPopup: (params: any, callback?: (buttonId: string) => void) => {
        console.log('Telegram WebApp showPopup', params);
        if (callback) callback('ok');
      },
      showAlert: (message: string, callback?: () => void) => {
        console.log('Telegram WebApp showAlert', message);
        if (callback) callback();
      },
      showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
        console.log('Telegram WebApp showConfirm', message);
        if (callback) callback(true);
      },
      openLink: (url: string) => {
        console.log('Telegram WebApp openLink', url);
        window.open(url, '_blank');
      },
      openTelegramLink: (url: string) => {
        console.log('Telegram WebApp openTelegramLink', url);
        window.open(url, '_blank');
      },
      openInvoice: (url: string, callback?: (status: string) => void) => {
        console.log('Telegram WebApp openInvoice', url);
        if (callback) callback('paid');
      },
      sendData: (data: string) => {
        console.log('Telegram WebApp sendData', data);
      },
      setHeaderColor: (color: string) => {
        console.log('Telegram WebApp setHeaderColor', color);
      },
      setBackgroundColor: (color: string) => {
        console.log('Telegram WebApp setBackgroundColor', color);
      },
    },
    user,
    isReady,
    
    // Convenience methods
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
      impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
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
            (buttonId: string) => resolve(buttonId)
          );
        });
      }
      // Demo implementation
      return new Promise<string>((resolve) => {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        resolve(confirmed ? 'ok' : 'cancel');
      });
    },
    
    showConfirm: (message: string) => {
      if (tg?.showConfirm) {
        return new Promise<boolean>((resolve) => {
          tg.showConfirm(message, (confirmed: boolean) => resolve(confirmed));
        });
      }
      // Demo implementation
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
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        expand(): void;
        close(): void;
        sendData(data: string): void;
        openLink(url: string): void;
        showPopup(params: any, callback?: (buttonId: string) => void): void;
        showConfirm(message: string, callback: (confirmed: boolean) => void): void;
        setHeaderColor?(color: string): void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
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
        MainButton: {
          setText(text: string): void;
          onClick(callback: () => void): void;
          show(): void;
          hide(): void;
          showProgress(leaveActive?: boolean): void;
          hideProgress(): void;
        };
        BackButton: {
          onClick(callback: () => void): void;
          show(): void;
          hide(): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
      };
    };
  }
}

export {};
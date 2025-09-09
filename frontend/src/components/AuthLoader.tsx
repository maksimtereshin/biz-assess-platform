import { RefreshCw } from 'lucide-react';

interface AuthLoaderProps {
  message?: string;
}

export function AuthLoader({ message = 'Аутентификация...' }: AuthLoaderProps) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-lg font-medium text-slate-800 mb-2">{message}</h2>
        <p className="text-sm text-slate-600">
          Подключение к Telegram...
        </p>
      </div>
    </div>
  );
}

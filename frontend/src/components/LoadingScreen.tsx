import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Загрузка..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
        <div className="flex justify-center mb-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <p className="text-gray-700 text-lg">{message}</p>
      </div>
    </div>
  );
}
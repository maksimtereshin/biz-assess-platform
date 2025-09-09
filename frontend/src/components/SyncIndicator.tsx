import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface SyncIndicatorProps {
  isOnline?: boolean;
  lastSyncTime?: string;
  isSyncing?: boolean;
  className?: string;
}

export function SyncIndicator({ 
  isOnline = navigator.onLine, 
  lastSyncTime,
  isSyncing = false,
  className = ''
}: SyncIndicatorProps) {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (isSyncing) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  const getStatusText = () => {
    if (!isOnline) return 'Оффлайн режим';
    if (isSyncing) return 'Синхронизация...';
    if (lastSyncTime) {
      const time = new Date(lastSyncTime).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `Синхронизировано ${time}`;
    }
    return 'Готово к синхронизации';
  };

  const getIcon = () => {
    if (!isOnline) return <CloudOff className="w-4 h-4" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return <Cloud className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getIcon()}
        {showStatus && (
          <span className="text-xs font-medium">
            {getStatusText()}
          </span>
        )}
      </div>
      
      {/* Always show a small indicator */}
      {!showStatus && (
        <div 
          className={`w-2 h-2 rounded-full ${
            !isOnline ? 'bg-red-500' : 
            isSyncing ? 'bg-blue-500 animate-pulse' : 
            'bg-green-500'
          }`}
          title={getStatusText()}
        />
      )}
    </div>
  );
}

// Hook to track sync status
export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const markSyncStart = () => setIsSyncing(true);
  const markSyncComplete = () => {
    setIsSyncing(false);
    setLastSyncTime(new Date().toISOString());
  };
  const markSyncError = () => setIsSyncing(false);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    markSyncStart,
    markSyncComplete,
    markSyncError,
  };
}

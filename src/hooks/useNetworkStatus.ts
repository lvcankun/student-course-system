import { useState, useEffect, useCallback } from 'react';

type NetworkStatus = 'online' | 'slow' | 'offline';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>('online');

  const checkSpeed = useCallback(async () => {
    try {
      const start = performance.now();
      await fetch('/api/ping', { method: 'HEAD', cache: 'no-cache' });
      const duration = performance.now() - start;
      setStatus(duration > 1000 ? 'slow' : 'online');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkSpeed();
    const interval = setInterval(checkSpeed, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkSpeed]);

  return status;
};

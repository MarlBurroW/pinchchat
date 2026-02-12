import { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, Loader2 } from 'lucide-react';
import type { ConnectionStatus } from '../types';
import { useT } from '../hooks/useLocale';

interface Props {
  status: ConnectionStatus;
}

type BannerState = 'hidden' | 'reconnecting' | 'reconnected';

export function ConnectionBanner({ status }: Props) {
  const t = useT();
  const [banner, setBanner] = useState<BannerState>('hidden');
  const prevStatus = useRef<ConnectionStatus | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateBanner = useCallback((prev: ConnectionStatus | null, current: ConnectionStatus) => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    if (current === 'disconnected' || current === 'connecting') {
      if (prev === 'connected') {
        setBanner('reconnecting');
      }
    } else if (current === 'connected' && prev !== null && prev !== 'connected') {
      setBanner('reconnected');
      dismissTimer.current = setTimeout(() => setBanner('hidden'), 3000);
    }
  }, []);

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    updateBanner(prev, status);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [status, updateBanner]);

  if (banner === 'hidden') return null;

  const isReconnecting = banner === 'reconnecting';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-all duration-500 animate-in slide-in-from-top ${
        isReconnecting
          ? 'bg-amber-500/10 text-amber-300 border-b border-amber-500/20'
          : 'bg-emerald-500/10 text-emerald-300 border-b border-emerald-500/20'
      }`}
    >
      {isReconnecting ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>{t('connection.reconnecting')}</span>
        </>
      ) : (
        <>
          <Wifi size={14} />
          <span>{t('connection.reconnected')}</span>
        </>
      )}
    </div>
  );
}

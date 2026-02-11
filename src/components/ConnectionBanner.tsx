import { useState, useEffect, useRef } from 'react';
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
  const prevStatus = useRef(status);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    if (status === 'disconnected' || status === 'connecting') {
      // Only show reconnecting if we were previously connected (not initial load)
      if (prev === 'connected') {
        setBanner('reconnecting');
      }
    } else if (status === 'connected' && prev !== 'connected') {
      // Just reconnected — flash success only if we were showing the banner
      if (banner === 'reconnecting' || prev === 'disconnected' || prev === 'connecting') {
        setBanner('reconnected');
        dismissTimer.current = setTimeout(() => setBanner('hidden'), 3000);
      }
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [status]);

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

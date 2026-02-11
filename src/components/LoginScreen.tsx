import { useState, useEffect } from 'react';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useT } from '../hooks/useLocale';

interface Props {
  onConnect: (url: string, token: string) => void;
  error?: string | null;
  isConnecting?: boolean;
}

const STORAGE_KEY = 'pinchchat_credentials';

export function getStoredCredentials(): { url: string; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.url && parsed.token) return parsed;
  } catch {}
  return null;
}

export function storeCredentials(url: string, token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, token }));
}

export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

export function LoginScreen({ onConnect, error, isConnecting }: Props) {
  const t = useT();
  const defaultUrl = import.meta.env.VITE_GATEWAY_WS_URL || `ws://${window.location.hostname}:18789`;
  const [url, setUrl] = useState(defaultUrl);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const stored = getStoredCredentials();
    if (stored) {
      setUrl(stored.url);
      setToken(stored.token);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !token.trim()) return;
    onConnect(url.trim(), token.trim());
  };

  return (
    <div className="h-dvh flex items-center justify-center bg-[#1e1e24] text-zinc-300 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.04),transparent_50%)]">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/logo.png" alt="PinchChat" className="h-20 w-20 drop-shadow-lg" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-200 tracking-wide">{t('login.title')}</h1>
            <Sparkles className="h-5 w-5 text-cyan-300/60" />
          </div>
          <p className="text-sm text-zinc-500">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/8 bg-[#232329]/80 backdrop-blur-xl p-6 space-y-5 shadow-2xl shadow-black/30">
          <div className="space-y-2">
            <label htmlFor="gateway-url" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {t('login.gatewayUrl')}
            </label>
            <input
              id="gateway-url"
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="ws://192.168.1.14:18789"
              className="w-full rounded-xl border border-white/8 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
              autoComplete="url"
              disabled={isConnecting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gateway-token" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {t('login.token')}
            </label>
            <div className="relative">
              <input
                id="gateway-token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder={t('login.tokenPlaceholder')}
                className="w-full rounded-xl border border-white/8 bg-zinc-800/50 px-4 py-3 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                autoComplete="current-password"
                disabled={isConnecting}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
                aria-label={showToken ? t('login.hideToken') : t('login.showToken')}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!url.trim() || !token.trim() || isConnecting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('login.connecting')}
              </>
            ) : (
              t('login.connect')
            )}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          {t('login.storedLocally')}
        </p>
      </div>
    </div>
  );
}

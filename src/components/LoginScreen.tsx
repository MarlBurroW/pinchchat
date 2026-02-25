import { useState } from 'react';
import { Sparkles, Eye, EyeOff, Loader2, Key, Lock, ChevronDown } from 'lucide-react';
import { useT } from '../hooks/useLocale';
import { getStoredCredentials, type AuthMode } from '../lib/credentials';

interface Props {
  onConnect: (url: string, secret: string, authMode: AuthMode, clientId?: string) => void;
  error?: string | null;
  isConnecting?: boolean;
}

function getInitialUrl(): string {
  const stored = getStoredCredentials();
  if (stored) return stored.url;
  if (import.meta.env.VITE_GATEWAY_WS_URL) return import.meta.env.VITE_GATEWAY_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  // When served over HTTPS, assume gateway is on a sibling subdomain (e.g. marlbot-gw.example.com)
  if (protocol === 'wss') {
    const parts = host.split('.');
    if (parts.length >= 2) {
      parts[0] = parts[0] + '-gw';
      return `${protocol}://${parts.join('.')}`;
    }
  }
  return `${protocol}://${host}:18789`;
}

function getInitialToken(): string {
  const stored = getStoredCredentials();
  return stored?.token ?? '';
}

function getInitialAuthMode(): AuthMode {
  const stored = getStoredCredentials();
  return stored?.authMode ?? 'token';
}

function getInitialClientId(): string {
  const stored = getStoredCredentials();
  return stored?.clientId ?? '';
}

export function LoginScreen({ onConnect, error, isConnecting }: Props) {
  const t = useT();
  const [url, setUrl] = useState(getInitialUrl);
  const [token, setToken] = useState(getInitialToken);
  const [showToken, setShowToken] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(getInitialAuthMode);
  const [clientId, setClientId] = useState(getInitialClientId);
  const [showAdvanced, setShowAdvanced] = useState(() => getInitialClientId() !== '');

  const urlTrimmed = url.trim();
  const isValidWsUrl = /^wss?:\/\/.+/.test(urlTrimmed);
  const showUrlHint = urlTrimmed.length > 0 && !isValidWsUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlTrimmed || !token.trim() || !isValidWsUrl) return;
    onConnect(urlTrimmed, token.trim(), authMode, clientId.trim() || undefined);
  };

  return (
    <div className="h-dvh flex items-center justify-center bg-[var(--pc-bg-base)] text-pc-text bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.04),transparent_50%)]">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/logo.png" alt="PinchChat" className="h-20 w-20 drop-shadow-lg" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-pc-text tracking-wide">{t('login.title')}</h1>
            <Sparkles className="h-5 w-5 text-pc-accent-light/60" />
          </div>
          <p className="text-sm text-pc-text-muted">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-pc-border bg-[var(--pc-bg-surface)]/80 backdrop-blur-xl p-6 space-y-5 shadow-2xl shadow-black/30">
          <div className="space-y-2">
            <label htmlFor="gateway-url" className="block text-xs font-medium text-pc-text-secondary uppercase tracking-wider">
              {t('login.gatewayUrl')}
            </label>
            <input
              id="gateway-url"
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="ws://192.168.1.14:18789"
              className="w-full rounded-xl border border-pc-border bg-pc-elevated/50 px-4 py-3 text-sm text-pc-text placeholder:text-pc-text-faint outline-none focus:border-[var(--pc-accent-dim)] focus:ring-1 focus:ring-[var(--pc-accent-glow)] transition-all"
              autoComplete="url"
              disabled={isConnecting}
            />
            {showUrlHint && (
              <p className="text-xs text-amber-400/80 mt-1.5 pl-1">
                {t('login.wsHint')}
              </p>
            )}
          </div>

          {/* Auth mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAuthMode('token')}
              disabled={isConnecting}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                authMode === 'token'
                  ? 'border-[var(--pc-accent-dim)] bg-[var(--pc-accent-dim)]/10 text-pc-text'
                  : 'border-pc-border bg-pc-elevated/30 text-pc-text-muted hover:bg-pc-elevated/50'
              }`}
              aria-label={t('login.authToken')}
              aria-pressed={authMode === 'token'}
            >
              <Key size={14} />
              {t('login.authToken')}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              disabled={isConnecting}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                authMode === 'password'
                  ? 'border-[var(--pc-accent-dim)] bg-[var(--pc-accent-dim)]/10 text-pc-text'
                  : 'border-pc-border bg-pc-elevated/30 text-pc-text-muted hover:bg-pc-elevated/50'
              }`}
              aria-label={t('login.authPassword')}
              aria-pressed={authMode === 'password'}
            >
              <Lock size={14} />
              {t('login.authPassword')}
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="gateway-token" className="block text-xs font-medium text-pc-text-secondary uppercase tracking-wider">
              {authMode === 'password' ? t('login.password') : t('login.token')}
            </label>
            <div className="relative">
              <input
                id="gateway-token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder={authMode === 'password' ? t('login.passwordPlaceholder') : t('login.tokenPlaceholder')}
                className="w-full rounded-xl border border-pc-border bg-pc-elevated/50 px-4 py-3 pr-12 text-sm text-pc-text placeholder:text-pc-text-faint outline-none focus:border-[var(--pc-accent-dim)] focus:ring-1 focus:ring-[var(--pc-accent-glow)] transition-all"
                autoComplete="current-password"
                disabled={isConnecting}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pc-text-muted hover:text-pc-text transition-colors"
                tabIndex={-1}
                aria-label={showToken ? t('login.hideToken') : t('login.showToken')}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Advanced settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-pc-text-muted hover:text-pc-text transition-colors"
              aria-expanded={showAdvanced}
              aria-label={t('login.advanced')}
            >
              <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-0' : '-rotate-90'}`} />
              {t('login.advanced')}
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-2">
                <label htmlFor="client-id" className="block text-xs font-medium text-pc-text-secondary uppercase tracking-wider">
                  {t('login.clientId')}
                </label>
                <input
                  id="client-id"
                  type="text"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="webchat"
                  className="w-full rounded-xl border border-pc-border bg-pc-elevated/50 px-4 py-3 text-sm text-pc-text placeholder:text-pc-text-faint outline-none focus:border-[var(--pc-accent-dim)] focus:ring-1 focus:ring-[var(--pc-accent-glow)] transition-all"
                  disabled={isConnecting}
                />
                <p className="text-xs text-pc-text-faint pl-1">
                  {t('login.clientIdHint')}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValidWsUrl || !token.trim() || isConnecting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            aria-label={isConnecting ? t('login.connecting') : t('login.connect')}
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

        <p className="text-center text-xs text-pc-text-faint mt-6">
          {t('login.storedLocally')}
        </p>
      </div>
    </div>
  );
}

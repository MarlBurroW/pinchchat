import { useCallback, useState, useRef, useEffect, forwardRef } from 'react';
import { Menu, Sparkles, LogOut, Cpu, Bot, Download, Minimize2, Info, Copy, Check, Settings } from 'lucide-react';
import type { ConnectionStatus, Session, ChatMessage } from '../types';
import { useT } from '../hooks/useLocale';
import { SettingsModal } from './SettingsModal';
import { copyToClipboard } from '../lib/clipboard';
import { sessionDisplayName, extractAgentIdFromKey, formatAgentId } from '../lib/sessionName';
import { messagesToMarkdown, downloadFile } from '../lib/exportChat';

interface Props {
  status: ConnectionStatus;
  sessionKey: string;
  onToggleSidebar: () => void;
  activeSessionData?: Session;
  onLogout?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  messages?: ChatMessage[];
  agentAvatarUrl?: string;
  agentName?: string;
  onCompact?: (sessionKey: string) => Promise<boolean>;
}

export function Header({ status, sessionKey, onToggleSidebar, activeSessionData, onLogout, soundEnabled, onToggleSound, messages, agentAvatarUrl, agentName, onCompact }: Props) {
  const t = useT();
  const sessionLabel = activeSessionData ? sessionDisplayName(activeSessionData) : (sessionKey.split(':').pop() || sessionKey);
  const sessionAgentId = activeSessionData?.agentId || extractAgentIdFromKey(sessionKey);
  const headerAgentName = agentName || (sessionAgentId && formatAgentId(sessionAgentId)) || t('header.title');
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sessionInfoRef = useRef<HTMLDivElement>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click — check both the trigger area AND the popover itself
  useEffect(() => {
    if (!showSessionInfo) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        sessionInfoRef.current && !sessionInfoRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setShowSessionInfo(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSessionInfo]);

  const handleExport = useCallback(() => {
    if (!messages || messages.length === 0) return;
    const md = messagesToMarkdown(messages, sessionLabel);
    const safeLabel = sessionLabel.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(md, `${safeLabel}_${date}.md`);
  }, [messages, sessionLabel]);

  return (
    <>
    <header className="h-14 border-b border-pc-border bg-[var(--pc-bg-surface)]/90 backdrop-blur-xl flex items-center px-4 gap-3 shrink-0" role="banner">
      <button onClick={onToggleSidebar} aria-label={t('header.toggleSidebar')} className="lg:hidden p-2 rounded-2xl hover:bg-[var(--pc-hover)] text-pc-text-secondary transition-colors">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-3 flex-1 min-w-0 relative" ref={sessionInfoRef}>
        <img src={agentAvatarUrl || '/logo.png'} alt="PinchChat" className="h-9 w-9 rounded-2xl object-cover" onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== window.location.origin + '/logo.png') { img.src = '/logo.png'; } else { img.style.display = 'none'; } }} />
        <button className="min-w-0 text-left group" onClick={() => setShowSessionInfo(v => !v)} title={t('header.sessionInfo')} aria-label={t('header.sessionInfo')}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-pc-text text-sm tracking-wide">{headerAgentName}</span>
            <Sparkles className="h-3.5 w-3.5 text-pc-accent-light/60" />
          </div>
          <span className="text-xs text-pc-text-muted truncate flex items-center gap-1.5">
            {activeSessionData?.agentId && (
              <span className="inline-flex items-center gap-0.5 text-pc-accent/70 font-medium">
                <Bot className="h-3 w-3" />
                {activeSessionData.agentId}
                <span className="text-pc-text-faint mx-0.5">·</span>
              </span>
            )}
            {sessionLabel}
            <Info className="h-3 w-3 text-pc-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        </button>
        {showSessionInfo && activeSessionData && (
          <SessionInfoPopover ref={popoverRef} session={activeSessionData} sessionKey={sessionKey} messageCount={messages?.length ?? 0} onClose={() => setShowSessionInfo(false)} />
        )}
      </div>
      <div className="flex items-center gap-2 text-sm">
        {messages && messages.length > 0 && (
          <button
            onClick={handleExport}
            aria-label={t('header.export')}
            className="hidden sm:block p-2 rounded-2xl hover:bg-[var(--pc-hover)] text-pc-text-muted hover:text-pc-text transition-colors"
            title={t('header.export')}
          >
            <Download size={16} />
          </button>
        )}
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label={t('settings.title')}
          className="p-2 rounded-2xl hover:bg-[var(--pc-hover)] text-pc-text-muted hover:text-pc-text transition-colors"
          title={t('settings.title')}
        >
          <Settings size={16} />
        </button>
        {status === 'connected' ? (
          <div className="flex items-center gap-2 rounded-2xl border border-pc-border bg-pc-elevated/30 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]" />
            <span className="text-xs text-pc-text hidden sm:inline">{t('header.connected')}</span>
          </div>
        ) : status === 'connecting' ? (
          <div className="flex items-center gap-2 rounded-2xl border border-pc-border bg-pc-elevated/30 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400/80 pulse-dot" />
            <span className="text-xs text-pc-text hidden sm:inline">{t('login.connecting')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-pc-border bg-pc-elevated/30 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400/80" />
            <span className="text-xs text-pc-text hidden sm:inline">{t('header.disconnected')}</span>
          </div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            aria-label={t('header.logout')}
            className="p-2 rounded-2xl hover:bg-[var(--pc-hover)] text-pc-text-muted hover:text-pc-text transition-colors"
            title={t('header.logout')}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
      {(() => {
        const ctx = activeSessionData?.contextTokens;
        const total = activeSessionData?.totalTokens || 0;
        if (!ctx) return null;
        const pct = Math.min(100, (total / ctx) * 100);
        const opacity = Math.max(0.35, Math.min(1, pct / 100));
        const barStyle = { width: `${pct}%`, backgroundColor: `rgba(var(--pc-accent-rgb), ${opacity})` };
        return (
          <div className="px-4 py-1.5 bg-[var(--pc-bg-surface)]/60 border-b border-pc-border flex items-center gap-3">
            {activeSessionData?.model && (
              <span className="inline-flex items-center gap-1 text-[10px] text-pc-text-muted shrink-0" title={`Model: ${activeSessionData.model}${activeSessionData.agentId ? ` · Agent: ${activeSessionData.agentId}` : ''}`}>
                <Cpu className="h-2.5 w-2.5" />
                <span className="truncate max-w-[120px]">{activeSessionData.model.replace(/^.*\//, '')}</span>
              </span>
            )}
            <div className="flex-1 h-[5px] rounded-full bg-[var(--pc-hover)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={barStyle} />
            </div>
            <span className="text-[11px] text-pc-text-secondary tabular-nums shrink-0 whitespace-nowrap">
              {(total / 1000).toFixed(1)}k / {(ctx / 1000).toFixed(0)}k tokens
            </span>
            {onCompact && pct >= 50 && (
              <CompactButton sessionKey={sessionKey} onCompact={onCompact} />
            )}
          </div>
        );
      })()}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} soundEnabled={soundEnabled} onToggleSound={onToggleSound} />
    </>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="ml-auto p-0.5 rounded hover:bg-[var(--pc-hover)] text-pc-text-faint hover:text-pc-text-secondary transition-colors"
      onClick={() => { copyToClipboard(value).then((ok) => { if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }); }}
      title="Copy"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  );
}

const SessionInfoPopover = forwardRef<HTMLDivElement, { session: Session; sessionKey: string; messageCount: number; onClose: () => void }>(function SessionInfoPopover({ session, sessionKey, messageCount, onClose }, ref) {
  const t = useT();
  const rows: Array<{ label: string; value: string; copyable?: boolean }> = [
    { label: t('sessionInfo.sessionKey'), value: sessionKey, copyable: true },
  ];
  if (session.channel) rows.push({ label: t('sessionInfo.channel'), value: session.channel });
  if (session.kind) rows.push({ label: t('sessionInfo.kind'), value: session.kind });
  if (session.model) rows.push({ label: t('sessionInfo.model'), value: session.model.replace(/^.*\//, '') });
  if (session.agentId) rows.push({ label: t('sessionInfo.agent'), value: session.agentId });
  rows.push({ label: t('sessionInfo.messages'), value: String(messageCount) });
  if (session.totalTokens) {
    rows.push({ label: t('sessionInfo.totalTokens'), value: `${(session.totalTokens / 1000).toFixed(1)}k` });
    if (session.inputTokens) rows.push({ label: t('sessionInfo.inputTokens'), value: `${(session.inputTokens / 1000).toFixed(1)}k` });
    if (session.outputTokens) rows.push({ label: t('sessionInfo.outputTokens'), value: `${(session.outputTokens / 1000).toFixed(1)}k` });
    if (session.contextTokens) rows.push({ label: t('sessionInfo.contextWindow'), value: `${(session.contextTokens / 1000).toFixed(0)}k` });
  }
  if (session.updatedAt) {
    rows.push({ label: t('sessionInfo.lastActive'), value: new Date(session.updatedAt).toLocaleString() });
  }

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 z-50 w-72 rounded-xl border border-pc-border bg-[var(--pc-bg-surface)] shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
      role="dialog"
      aria-label={t('header.sessionInfo')}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-pc-border flex items-center justify-between">
        <span className="text-xs font-semibold text-pc-text">{t('header.sessionInfo')}</span>
        <button onClick={onClose} className="text-pc-text-faint hover:text-pc-text text-xs" aria-label="Close">✕</button>
      </div>
      <div className="p-3 space-y-2">
        {rows.map(({ label, value, copyable }) => (
          <div key={label} className="flex items-start gap-2 text-[11px]">
            <span className="text-pc-text-muted shrink-0 w-20">{label}</span>
            <span className="text-pc-text-secondary break-all flex-1 font-mono">{value}</span>
            {copyable && <CopyField value={value} />}
          </div>
        ))}
      </div>
    </div>
  );
});

function CompactButton({ sessionKey, onCompact }: { sessionKey: string; onCompact: (key: string) => Promise<boolean> }) {
  const [compacting, setCompacting] = useState(false);
  const t = useT();

  const handleCompact = useCallback(async () => {
    if (compacting) return;
    setCompacting(true);
    try {
      await onCompact(sessionKey);
    } finally {
      setCompacting(false);
    }
  }, [compacting, sessionKey, onCompact]);

  return (
    <button
      onClick={handleCompact}
      disabled={compacting}
      className="inline-flex items-center gap-1 text-[10px] text-pc-text-muted hover:text-pc-text shrink-0 px-1.5 py-0.5 rounded hover:bg-[var(--pc-hover)] transition-colors disabled:opacity-50"
      title={t('header.compact')}
      aria-label={t('header.compact')}
    >
      <Minimize2 className={`h-3 w-3 ${compacting ? 'animate-pulse' : ''}`} />
      <span className="hidden sm:inline">{compacting ? t('header.compacting') : t('header.compact')}</span>
    </button>
  );
}

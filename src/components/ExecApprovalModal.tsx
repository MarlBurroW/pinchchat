import { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useT } from '../hooks/useLocale';
import type { ExecApproval, ExecApprovalDecision } from '../types';

interface Props {
  approval: ExecApproval;
  queueSize: number;
  onResolve: (id: string, decision: ExecApprovalDecision) => void;
}

export function ExecApprovalModal({ approval, queueSize, onResolve }: Props) {
  const t = useT();
  const denyRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialDurationRef = useRef(0);

  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [progressPct, setProgressPct] = useState(100);

  // Reset duration ref and start countdown when approval changes
  useEffect(() => {
    initialDurationRef.current = Math.max(1, approval.expiresAtMs - Date.now());

    const tick = () => {
      const remaining = approval.expiresAtMs - Date.now();
      setSecondsRemaining(Math.max(0, Math.ceil(remaining / 1000)));
      setProgressPct(Math.max(0, Math.min(100, (remaining / initialDurationRef.current) * 100)));
    };

    // Immediate async tick to avoid synchronous setState in effect body
    const immediate = setTimeout(tick, 0);
    const interval = setInterval(() => {
      tick();
      if (approval.expiresAtMs - Date.now() <= 0) clearInterval(interval);
    }, 1000);
    return () => { clearTimeout(immediate); clearInterval(interval); };
  }, [approval.id, approval.expiresAtMs]);

  // Auto-focus deny button
  useEffect(() => {
    denyRef.current?.focus();
  }, [approval.id]);

  // Escape → deny
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onResolve(approval.id, 'deny');
    }
    // Focus trap
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [approval.id, onResolve]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const commandDisplay = approval.commandPreview || approval.command || approval.commandArgv.join(' ');

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={t('approval.title')}
      aria-describedby="approval-command"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop — not clickable to dismiss */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 rounded-3xl border border-pc-border bg-[var(--pc-bg-base)]/95 backdrop-blur-xl shadow-2xl animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pc-border">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={18} className="text-amber-400/80" />
            <h2 className="text-sm font-semibold text-pc-text">{t('approval.title')}</h2>
          </div>
          {queueSize > 1 && (
            <span className="text-xs text-pc-text-muted bg-pc-elevated/80 px-2 py-0.5 rounded-full border border-pc-border">
              {t('approval.queueCount').replace('{0}', '1').replace('{1}', String(queueSize))}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3">
          {/* Command */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-pc-text-muted font-semibold mb-1">
              {t('approval.command')}
            </div>
            <pre
              id="approval-command"
              className="text-sm font-mono text-pc-text bg-black/20 rounded-xl px-3 py-2 overflow-x-auto max-h-32 overflow-y-auto border border-pc-border/50 whitespace-pre-wrap break-all"
            >
              {commandDisplay}
            </pre>
          </div>

          {/* Context row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-pc-text-muted">
            {approval.cwd && (
              <span><span className="text-pc-text-faint">{t('approval.cwd')}:</span> {approval.cwd}</span>
            )}
            {approval.agentId && (
              <span><span className="text-pc-text-faint">{t('approval.agent')}:</span> {approval.agentId}</span>
            )}
            {approval.sessionKey && (
              <span><span className="text-pc-text-faint">{t('approval.session')}:</span> {approval.sessionKey}</span>
            )}
          </div>

          {/* Countdown */}
          <div>
            <div className="flex items-center justify-between text-xs text-pc-text-muted mb-1">
              <span>
                {secondsRemaining > 0
                  ? t('approval.expiresIn').replace('{0}', String(secondsRemaining))
                  : t('approval.expired')}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  secondsRemaining <= 10 ? 'bg-red-400/70' : 'bg-amber-400/50'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer — action buttons */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-pc-border">
          <button
            ref={denyRef}
            onClick={() => onResolve(approval.id, 'deny')}
            disabled={secondsRemaining <= 0}
            className="flex-1 h-9 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('approval.deny')}
          </button>
          <button
            onClick={() => onResolve(approval.id, 'allow-once')}
            disabled={secondsRemaining <= 0}
            className="flex-1 h-9 rounded-xl text-sm font-medium bg-[var(--pc-hover)] text-pc-text border border-pc-border hover:bg-pc-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('approval.allowOnce')}
          </button>
          <button
            onClick={() => onResolve(approval.id, 'allow-always')}
            disabled={secondsRemaining <= 0}
            className="flex-1 h-9 rounded-xl text-sm font-medium bg-pc-accent/15 text-pc-accent-light border border-pc-accent/20 hover:bg-pc-accent/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('approval.allowAlways')}
          </button>
        </div>
      </div>
    </div>
  );
}

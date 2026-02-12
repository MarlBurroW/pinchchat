import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Search } from 'lucide-react';
import type { Session } from '../types';
import { useT } from '../hooks/useLocale';
import { SessionIcon } from './SessionIcon';

interface Props {
  sessions: Session[];
  activeSession: string;
  onSwitch: (key: string) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ sessions, activeSession, onSwitch, open, onClose }: Props) {
  const t = useT();
  const [filter, setFilter] = useState('');
  const [focusIdx, setFocusIdx] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search when sidebar is open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const updateFilter = useCallback((value: string) => {
    setFilter(value);
    setFocusIdx(-1);
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return sessions;
    const q = filter.toLowerCase();
    return sessions.filter(s =>
      (s.label || s.key).toLowerCase().includes(q)
    );
  }, [sessions, filter]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside role="navigation" aria-label="Sessions" className={`fixed lg:relative top-0 left-0 h-full w-72 bg-[#1e1e24]/95 border-r border-white/8 z-50 transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col backdrop-blur-xl`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-r from-cyan-400/15 to-violet-500/15 blur-lg" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-zinc-800/50">
                <Sparkles className="h-4 w-4 text-cyan-200" />
              </div>
            </div>
            <span className="font-semibold text-sm text-zinc-200 tracking-wide">{t('sidebar.title')}</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Session search */}
        {sessions.length > 3 && (
          <div className="px-2 pt-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                ref={searchRef}
                type="text"
                value={filter}
                onChange={e => updateFilter(e.target.value)}
                placeholder={t('sidebar.search')}
                aria-label={t('sidebar.search')}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/8 bg-zinc-800/30 text-xs text-zinc-300 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
              {filter && (
                <button
                  onClick={() => updateFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto py-2 px-2"
          role="listbox"
          aria-label={t('sidebar.title')}
          tabIndex={0}
          onKeyDown={(e) => {
            const len = filtered.length;
            if (!len) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              const next = focusIdx < len - 1 ? focusIdx + 1 : 0;
              setFocusIdx(next);
              listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[next]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              const prev = focusIdx > 0 ? focusIdx - 1 : len - 1;
              setFocusIdx(prev);
              listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[prev]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter' && focusIdx >= 0 && focusIdx < len) {
              e.preventDefault();
              onSwitch(filtered[focusIdx].key);
              onClose();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
        >
          {sessions.length === 0 && (
            <div className="px-3 py-8 text-center text-zinc-500 text-sm">{t('sidebar.empty')}</div>
          )}
          {sessions.length > 0 && filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-zinc-500 text-xs">{t('sidebar.noResults')}</div>
          )}
          {filtered.map((s, idx) => {
            const isActive = s.key === activeSession;
            const isFocused = idx === focusIdx;
            return (
              <button
                key={s.key}
                role="option"
                aria-selected={isActive}
                onClick={() => { onSwitch(s.key); onClose(); }}
                onMouseEnter={() => setFocusIdx(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left text-sm transition-all mb-1 ${
                  isActive
                    ? 'bg-white/5 text-cyan-200 border border-white/8 shadow-[0_0_12px_rgba(34,211,238,0.08)]'
                    : s.isActive
                      ? 'bg-violet-500/5 text-violet-200 border border-violet-500/15 shadow-[0_0_10px_rgba(168,85,247,0.06)]'
                      : 'text-zinc-400 hover:bg-white/5 border border-transparent'
                } ${isFocused && !isActive ? 'ring-1 ring-cyan-400/30' : ''}`}
              >
                <div className="relative">
                  <SessionIcon session={s} isActive={s.isActive} isCurrentSession={isActive} />
                  {s.isActive && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.7)] animate-pulse" />
                  )}
                  {s.hasUnread && !isActive && (
                    <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="flex-1 truncate">{s.label || s.key}</span>
                    {s.messageCount != null && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-cyan-400/10 text-cyan-300' : 'bg-white/5 text-zinc-500'}`}>
                        {s.messageCount}
                      </span>
                    )}
                  </div>
                  {(() => {
                    if (!s.contextTokens) return null;
                    const pct = Math.min(100, ((s.totalTokens || 0) / s.contextTokens) * 100);
                    const barOpacity = Math.max(0.35, Math.min(1, pct / 100));
                    const barStyle = { width: `${pct}%`, backgroundColor: `rgba(56, 189, 248, ${barOpacity})` };
                    return (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-[3px] rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full" style={barStyle} />
                        </div>
                        <span className="text-[9px] text-zinc-500 tabular-nums shrink-0">{Math.round(pct)}%</span>
                      </div>
                    );
                  })()}
                </div>
              </button>
            );
          })}
        </div>
        {/* Footer with version */}
        <div className="px-4 py-3 border-t border-white/8 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-300/60 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/60 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-300/50 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
          <span className="ml-1 text-[9px] text-zinc-600 select-all" title={`PinchChat v${__APP_VERSION__}`}>v{__APP_VERSION__}</span>
        </div>
      </aside>
    </>
  );
}

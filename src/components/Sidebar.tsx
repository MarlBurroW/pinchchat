import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Search, Pin, Trash2, Columns2, Clock, Bot, MessageSquare, Globe, Zap, ArrowUpCircle } from 'lucide-react';
import type { Session } from '../types';
import { useT } from '../hooks/useLocale';
import { SessionIcon } from './SessionIcon';
import { sessionDisplayName } from '../lib/sessionName';
import { relativeTime } from '../lib/relativeTime';
import { useUpdateCheck } from '../hooks/useUpdateCheck';

function VersionBadge() {
  const update = useUpdateCheck(__APP_VERSION__);
  if (update.available) {
    return (
      <a
        href={update.releaseUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-1 inline-flex items-center gap-1 text-[9px] text-emerald-400 hover:text-emerald-300 transition-colors"
        title={`Update available: v${update.latestVersion}`}
      >
        <span className="text-pc-text-faint line-through select-all">v{__APP_VERSION__}</span>
        <ArrowUpCircle size={10} />
        <span>v{update.latestVersion}</span>
      </a>
    );
  }
  return (
    <span className="ml-1 text-[9px] text-pc-text-faint select-all" title={`PinchChat v${__APP_VERSION__}`}>v{__APP_VERSION__}</span>
  );
}

const PINNED_KEY = 'pinchchat-pinned-sessions';
const WIDTH_KEY = 'pinchchat-sidebar-width';
const ORDER_KEY = 'pinchchat-session-order';
const FILTER_KEY = 'pinchchat-session-filter';

/** Detect the category of a session for filtering */
function sessionCategory(s: Session): string {
  if (s.key.includes(':cron:')) return 'cron';
  if (s.key.includes(':spawn:') || s.key.includes(':sub:')) return 'agent';
  const ch = s.channel?.toLowerCase();
  if (ch && ch !== 'webchat') return ch;
  return 'other';
}

/** Get unique categories present in sessions */
function getAvailableCategories(sessions: Session[]): string[] {
  const cats = new Set<string>();
  for (const s of sessions) cats.add(sessionCategory(s));
  return Array.from(cats).sort();
}

/** Icons for filter chips */
function FilterChipIcon({ cat, size = 12 }: { cat: string; size?: number }) {
  switch (cat) {
    case 'cron': return <Clock size={size} />;
    case 'agent': return <Bot size={size} />;
    case 'discord': return <MessageSquare size={size} />;
    case 'telegram': return <MessageSquare size={size} />;
    default: return <Globe size={size} />;
  }
}

/** Pretty label for category */
function categoryLabel(cat: string): string {
  if (cat === 'cron') return 'Cron';
  if (cat === 'agent') return 'Agents';
  if (cat === 'other') return 'Chat';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}
const MIN_WIDTH = 220;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288; // w-72

function getSavedWidth(): number {
  try {
    const v = localStorage.getItem(WIDTH_KEY);
    if (v) {
      const n = Number(v);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
    }
  } catch { /* noop */ }
  return DEFAULT_WIDTH;
}

function getPinnedSessions(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* noop */ }
  return new Set();
}

function savePinnedSessions(pinned: Set<string>) {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify([...pinned]));
  } catch { /* noop */ }
}

function getSavedOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* noop */ }
  return [];
}

function saveOrder(order: string[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch { /* noop */ }
}

interface Props {
  sessions: Session[];
  activeSession: string;
  onSwitch: (key: string) => void;
  onDelete: (key: string) => void;
  onSplit?: (key: string) => void;
  splitSession?: string | null;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ sessions, activeSession, onSwitch, onDelete, onSplit, splitSession, open, onClose }: Props) {
  const t = useT();
  const [filter, setFilter] = useState('');
  const [focusIdx, setFocusIdx] = useState(-1);
  const [pinned, setPinned] = useState(getPinnedSessions);
  const [width, setWidth] = useState(getSavedWidth);
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [customOrder, setCustomOrder] = useState<string[]>(getSavedOrder);
  const [channelFilter, setChannelFilter] = useState<string | null>(() => {
    try { return localStorage.getItem(FILTER_KEY); } catch { return null; }
  });
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startW: 0 });

  // Drag-to-resize logic
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startW + (clientX - dragRef.current.startX)));
      setWidth(newW);
    };
    const onUp = () => {
      setDragging(false);
      // persist on release
      localStorage.setItem(WIDTH_KEY, String(width));
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [dragging, width]);

  // Save width when it changes (debounced via drag end above, but also on unmount)
  useEffect(() => {
    return () => { try { localStorage.setItem(WIDTH_KEY, String(width)); } catch { /* noop */ } };
  }, [width]);

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragRef.current = { startX: clientX, startW: width };
    setDragging(true);
  }, [width]);

  const togglePin = useCallback((key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinned(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      savePinnedSessions(next);
      return next;
    });
  }, []);

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

  const availableCategories = useMemo(() => getAvailableCategories(sessions), [sessions]);

  const toggleChannelFilter = useCallback((cat: string) => {
    setChannelFilter(prev => {
      const next = prev === cat ? null : cat;
      try {
        if (next) localStorage.setItem(FILTER_KEY, next);
        else localStorage.removeItem(FILTER_KEY);
      } catch { /* noop */ }
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = sessions;
    // Apply channel filter
    if (channelFilter === 'active') {
      list = list.filter(s => s.isActive);
    } else if (channelFilter) {
      list = list.filter(s => sessionCategory(s) === channelFilter);
    }
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(s => sessionDisplayName(s).toLowerCase().includes(q));
    }
    // Sort pinned sessions to top (preserving relative order within each group)
    const pinnedList = list.filter(s => pinned.has(s.key));
    const unpinnedList = list.filter(s => !pinned.has(s.key));
    // Sort each group: use custom order if set, then fall back to most recently updated
    const orderMap = new Map(customOrder.map((k, i) => [k, i]));
    const byCustomThenRecent = (a: Session, b: Session) => {
      const aIdx = orderMap.get(a.key);
      const bIdx = orderMap.get(b.key);
      if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
      if (aIdx !== undefined) return -1;
      if (bIdx !== undefined) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    };
    pinnedList.sort(byCustomThenRecent);
    unpinnedList.sort(byCustomThenRecent);
    return [...pinnedList, ...unpinnedList];
  }, [sessions, filter, pinned, customOrder, channelFilter]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside role="navigation" aria-label="Sessions" className={`fixed lg:relative top-0 left-0 h-full bg-[var(--pc-bg-base)]/95 border-r border-pc-border z-50 transform ${dragging ? '' : 'transition-transform'} lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col backdrop-blur-xl`} style={{ width: `${width}px` }}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-pc-border">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-r from-cyan-400/15 to-violet-500/15 blur-lg" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-pc-border bg-pc-elevated/50">
                <Sparkles className="h-4 w-4 text-pc-accent-light" />
              </div>
            </div>
            <span className="font-semibold text-sm text-pc-text tracking-wide">{t('sidebar.title')}</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-xl hover:bg-[var(--pc-hover)] text-pc-text-secondary transition-colors" aria-label={t('sidebar.close')}>
            <X size={16} />
          </button>
        </div>

        {/* Session search */}
        {sessions.length > 3 && (
          <div className="px-2 pt-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pc-text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={filter}
                onChange={e => updateFilter(e.target.value)}
                placeholder={t('sidebar.search')}
                aria-label={t('sidebar.search')}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-pc-border bg-pc-elevated/30 text-xs text-pc-text placeholder:text-pc-text-muted outline-none focus:ring-1 focus:ring-[var(--pc-accent-dim)] transition-all"
              />
              {filter && (
                <button
                  onClick={() => updateFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-text-muted hover:text-pc-text"
                  aria-label={t('sidebar.clearSearch')}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Channel filter chips */}
        {availableCategories.length > 1 && (
          <div className="px-2 pt-1.5 flex flex-wrap gap-1">
            <button
              onClick={() => { setChannelFilter(null); try { localStorage.removeItem(FILTER_KEY); } catch { /* noop */ } }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${
                !channelFilter
                  ? 'bg-[var(--pc-accent-glow)] text-pc-accent-light border-[var(--pc-accent-dim)]'
                  : 'bg-transparent text-pc-text-muted border-pc-border hover:bg-[var(--pc-hover)] hover:text-pc-text-secondary'
              }`}
            >
              {t('sidebar.filterAll')}
            </button>
            <button
              onClick={() => toggleChannelFilter('active')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${
                channelFilter === 'active'
                  ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                  : 'bg-transparent text-pc-text-muted border-pc-border hover:bg-[var(--pc-hover)] hover:text-pc-text-secondary'
              }`}
            >
              <Zap size={10} />
              {t('sidebar.filterActive')}
            </button>
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleChannelFilter(cat)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${
                  channelFilter === cat
                    ? 'bg-[var(--pc-accent-glow)] text-pc-accent-light border-[var(--pc-accent-dim)]'
                    : 'bg-transparent text-pc-text-muted border-pc-border hover:bg-[var(--pc-hover)] hover:text-pc-text-secondary'
                }`}
              >
                <FilterChipIcon cat={cat} size={10} />
                {categoryLabel(cat)}
              </button>
            ))}
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
            <div className="px-3 py-8 text-center text-pc-text-muted text-sm">{t('sidebar.empty')}</div>
          )}
          {sessions.length > 0 && filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-pc-text-muted text-xs">{t('sidebar.noResults')}</div>
          )}
          {filtered.map((s, idx) => {
            const isActive = s.key === activeSession;
            const isFocused = idx === focusIdx;
            const isPinned = pinned.has(s.key);
            const isFirstUnpinned = !isPinned && idx > 0 && pinned.has(filtered[idx - 1].key);
            const isDragged = dragKey === s.key;
            const isDropTarget = dropTarget === s.key && dragKey !== s.key;
            return (
              <div key={s.key}>
                {isFirstUnpinned && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mt-1 mb-1">
                    <div className="flex-1 h-px bg-[var(--pc-hover)]" />
                  </div>
                )}
                <button
                  role="option"
                  aria-selected={isActive}
                  draggable={!filter.trim()}
                  onDragStart={(e) => {
                    setDragKey(s.key);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', s.key);
                  }}
                  onDragEnd={() => { setDragKey(null); setDropTarget(null); }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragKey && dragKey !== s.key) setDropTarget(s.key);
                  }}
                  onDragLeave={() => { if (dropTarget === s.key) setDropTarget(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!dragKey || dragKey === s.key) return;
                    // Only reorder within same group (pinned or unpinned)
                    const dragPinned = pinned.has(dragKey);
                    const dropPinned = pinned.has(s.key);
                    if (dragPinned !== dropPinned) { setDragKey(null); setDropTarget(null); return; }
                    // Build new order from current filtered list
                    const keys = filtered.map(f => f.key);
                    const fromIdx = keys.indexOf(dragKey);
                    const toIdx = keys.indexOf(s.key);
                    if (fromIdx === -1 || toIdx === -1) return;
                    keys.splice(fromIdx, 1);
                    keys.splice(toIdx, 0, dragKey);
                    setCustomOrder(keys);
                    saveOrder(keys);
                    setDragKey(null);
                    setDropTarget(null);
                  }}
                  onClick={() => { onSwitch(s.key); onClose(); }}
                  onMouseEnter={() => setFocusIdx(idx)}
                  className={`group/item w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left text-sm transition-all mb-1 ${
                    isActive
                      ? 'bg-[var(--pc-hover)] text-pc-accent-light border border-pc-border shadow-[0_0_12px_rgba(34,211,238,0.08)]'
                      : s.isActive
                        ? 'bg-violet-500/5 text-violet-200 border border-violet-500/15 shadow-[0_0_10px_rgba(168,85,247,0.06)]'
                        : 'text-pc-text-secondary hover:bg-[var(--pc-hover)] border border-transparent'
                  } ${isFocused && !isActive ? 'ring-1 ring-[var(--pc-accent-dim)]' : ''} ${isDragged ? 'opacity-40' : ''} ${isDropTarget ? 'ring-1 ring-[var(--pc-accent)] bg-[var(--pc-accent-glow)]' : ''}`}
                >
                  <div className="relative">
                    <SessionIcon session={s} isActive={s.isActive} isCurrentSession={isActive} />
                    {s.isActive && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.7)] animate-pulse" />
                    )}
                    {s.hasUnread && !isActive && (
                      <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--pc-accent)] shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="flex-1 truncate">{sessionDisplayName(s)}</span>
                      {(() => {
                        const rel = relativeTime(s.updatedAt);
                        return rel ? <span className="text-[10px] text-pc-text-muted tabular-nums shrink-0">{rel}</span> : null;
                      })()}
                      <button
                        onClick={(e) => togglePin(s.key, e)}
                        className={`shrink-0 p-0.5 rounded-lg transition-all ${
                          isPinned
                            ? 'text-pc-accent opacity-80 hover:opacity-100'
                            : 'text-pc-text-faint opacity-0 group-hover/item:opacity-60 hover:!opacity-100 hover:text-pc-text-secondary'
                        }`}
                        title={isPinned ? t('sidebar.unpin') : t('sidebar.pin')}
                        aria-label={isPinned ? t('sidebar.unpin') : t('sidebar.pin')}
                      >
                        <Pin size={12} className={isPinned ? 'fill-current' : ''} />
                      </button>
                      {onSplit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSplit(s.key); }}
                          className={`shrink-0 p-0.5 rounded-lg transition-all ${
                            splitSession === s.key
                              ? 'text-pc-accent opacity-80 hover:opacity-100'
                              : 'text-pc-text-faint opacity-0 group-hover/item:opacity-60 hover:!opacity-100 hover:text-pc-text-secondary'
                          }`}
                          title={t('sidebar.openSplit')}
                          aria-label={t('sidebar.openSplit')}
                        >
                          <Columns2 size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.key); }}
                        className="shrink-0 p-0.5 rounded-lg transition-all text-pc-text-faint opacity-0 group-hover/item:opacity-60 hover:!opacity-100 hover:text-red-400"
                        title={t('sidebar.delete')}
                        aria-label={t('sidebar.delete')}
                      >
                        <Trash2 size={12} />
                      </button>
                      {s.messageCount != null && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-[var(--pc-accent-glow)] text-pc-accent-light' : 'bg-[var(--pc-hover)] text-pc-text-muted'}`}>
                          {s.messageCount}
                        </span>
                      )}
                    </div>
                    {s.lastMessagePreview && (
                      <p className="text-[11px] text-pc-text-muted truncate mt-0.5 leading-tight">{s.lastMessagePreview.replace(/\s+/g, ' ').slice(0, 80)}</p>
                    )}
                    {(() => {
                      if (!s.contextTokens) return null;
                      const pct = Math.min(100, ((s.totalTokens || 0) / s.contextTokens) * 100);
                      const barOpacity = Math.max(0.35, Math.min(1, pct / 100));
                      const barStyle = { width: `${pct}%`, backgroundColor: `rgba(var(--pc-accent-rgb), ${barOpacity})` };
                      return (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-[3px] rounded-full bg-[var(--pc-hover)] overflow-hidden">
                            <div className="h-full rounded-full" style={barStyle} />
                          </div>
                          <span className="text-[9px] text-pc-text-muted tabular-nums shrink-0">{Math.round(pct)}%</span>
                        </div>
                      );
                    })()}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        {/* Footer with version */}
        <div className="px-4 py-3 border-t border-pc-border flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-300/60 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--pc-accent-dim)] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-300/50 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
          <VersionBadge />
        </div>
        {/* Resize drag handle */}
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className={`hidden lg:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize group/resize z-10 ${dragging ? 'bg-[var(--pc-accent-glow)]' : 'hover:bg-[var(--pc-accent-glow)]'} transition-colors`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
        >
          <div className={`absolute top-1/2 -translate-y-1/2 right-0 w-0.5 h-8 rounded-full ${dragging ? 'bg-[var(--pc-accent-dim)]' : 'bg-transparent group-hover/resize:bg-[var(--pc-accent-dim)]'} transition-colors`} />
        </div>
      </aside>
      {/* Prevent text selection while dragging */}
      {dragging && <div className="fixed inset-0 z-[60] cursor-col-resize" />}
      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" onClick={() => setConfirmDelete(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-72 bg-[var(--pc-bg-base)] border border-pc-border-strong rounded-2xl p-5 shadow-2xl">
            <p className="text-sm text-pc-text mb-4">{t('sidebar.deleteConfirm')}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs rounded-xl border border-pc-border-strong text-pc-text-secondary hover:bg-[var(--pc-hover)] transition-colors"
              >
                {t('sidebar.deleteCancel')}
              </button>
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                className="px-3 py-1.5 text-xs rounded-xl bg-red-500/20 text-red-300 border border-red-500/20 hover:bg-red-500/30 transition-colors"
              >
                {t('sidebar.delete')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

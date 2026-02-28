import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage, ConnectionStatus } from '../types';
import { Bot, ArrowDown, Loader2, ChevronsDownUp, ChevronsUpDown, Sparkles, Bookmark, Download } from 'lucide-react';
import { MessageSearch } from './MessageSearch';
import { useT } from '../hooks/useLocale';
import { getLocale, type TranslationKey } from '../lib/i18n';
import { useToolCollapse } from '../hooks/useToolCollapse';
import { useBookmarks } from '../hooks/useBookmarks';
import { messagesToMarkdown, downloadFile } from '../lib/exportChat';

interface Props {
  messages: ChatMessage[];
  isGenerating: boolean;
  isLoadingHistory: boolean;
  status: ConnectionStatus;
  sessionKey?: string;
  onSend: (text: string, attachments?: Array<{ mimeType: string; fileName: string; content: string }>) => void;
  onNewSession?: () => Promise<void>;
  onAbort: () => void;
  agentAvatarUrl?: string;
  agentName?: string;
}

function isNoReply(msg: ChatMessage): boolean {
  const text = (msg.content || '').trim();
  if (text === 'NO_REPLY') return true;
  const textBlocks = msg.blocks.filter(b => b.type === 'text');
  if (textBlocks.length === 1 && (textBlocks[0] as { text: string }).text.trim() === 'NO_REPLY') return true;
  return false;
}

function hasVisibleContent(msg: ChatMessage): boolean {
  if (msg.role === 'user') return true;
  if (msg.role === 'assistant' && isNoReply(msg)) return false;
  if (msg.blocks.length === 0) return !!msg.content;
  return msg.blocks.some(b =>
    (b.type === 'text' && b.text.trim()) ||
    b.type === 'thinking' ||
    b.type === 'tool_use' ||
    b.type === 'tool_result'
  );
}

function hasStreamedText(messages: ChatMessage[]): boolean {
  if (messages.length === 0) return false;
  const last = messages[messages.length - 1];
  if (last.role !== 'assistant') return false;
  return last.blocks.some(b => b.type === 'text' && b.text.trim().length > 0) || (last.content?.trim().length > 0);
}

function formatDateSeparator(ts: number, t: (k: TranslationKey) => string): string {
  const date = new Date(ts);
  const now = new Date();
  const locale = getLocale();
  const bcp47 = locale === 'fr' ? 'fr-FR' : 'en-US';

  if (date.toDateString() === now.toDateString()) return t('time.today');
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return t('time.yesterday');
  return date.toLocaleDateString(bcp47, { weekday: 'long', day: 'numeric', month: 'long', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function getDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Threshold in pixels — if the user is within this distance of the bottom, auto-scroll */
const SCROLL_THRESHOLD = 150;

export function Chat({ messages, isGenerating, isLoadingHistory, status, sessionKey, onSend, onNewSession, onAbort, agentAvatarUrl, agentName }: Props) {
  const t = useT();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const userSentRef = useRef(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [replyTo, setReplyTo] = useState<{ preview: string } | null>(null);

  // Clear reply context on session switch
  useEffect(() => { setReplyTo(null); }, [sessionKey]); // eslint-disable-line react-hooks/set-state-in-effect
  const prevMessageCountRef = useRef(messages.length);

  const checkIfNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= SCROLL_THRESHOLD;
    setShowScrollBtn(distanceFromBottom > SCROLL_THRESHOLD * 2);
    if (distanceFromBottom <= SCROLL_THRESHOLD) {
      setNewMessageCount(0);
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track scroll position to decide whether to auto-scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handler = () => checkIfNearBottom();
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [checkIfNearBottom]);

  // Persist scroll position per session
  const scrollPositionsRef = useRef<Map<string, { top: number; height: number }>>(new Map());
  const prevSessionKeyRef = useRef(sessionKey);
  useEffect(() => {
    if (sessionKey !== prevSessionKeyRef.current) {
      // Save scroll position of previous session
      const prevKey = prevSessionKeyRef.current;
      const el = scrollContainerRef.current;
      if (prevKey && el) {
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        scrollPositionsRef.current.set(prevKey, { top: el.scrollTop, height: el.scrollHeight });
        // If user was near bottom, don't save (will auto-scroll to bottom on restore)
        if (distFromBottom <= SCROLL_THRESHOLD) {
          scrollPositionsRef.current.delete(prevKey);
        }
      }

      prevSessionKeyRef.current = sessionKey;
      prevMessageCountRef.current = messages.length;
      setNewMessageCount(0); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: reset on session switch

      // Restore scroll position for new session
      const saved = sessionKey ? scrollPositionsRef.current.get(sessionKey) : undefined;
      if (saved) {
        isNearBottomRef.current = false;
        requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          if (container) {
            // Adjust for content height changes since last visit
            const heightDelta = container.scrollHeight - saved.height;
            container.scrollTop = saved.top + Math.max(0, heightDelta);
            checkIfNearBottom();
          }
        });
      } else {
        isNearBottomRef.current = true;
        requestAnimationFrame(() => scrollToBottom('instant'));
      }
    }
  }, [sessionKey, messages.length, scrollToBottom, checkIfNearBottom]);

  // Auto-scroll when messages change, but only if user is near bottom or just sent a message
  const wasLoadingHistoryRef = useRef(isLoadingHistory);
  useEffect(() => {
    const newCount = messages.length;
    const delta = newCount - prevMessageCountRef.current;
    const hadNew = delta > 0;
    // Detect history load completion (don't treat as "new messages")
    const justFinishedLoading = wasLoadingHistoryRef.current && !isLoadingHistory;
    wasLoadingHistoryRef.current = isLoadingHistory;
    prevMessageCountRef.current = newCount;

    if (justFinishedLoading) {
      // History just loaded — scroll to bottom, don't show indicator
      scrollToBottom('instant');
      isNearBottomRef.current = true;
      setNewMessageCount(0); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: reset after history load
      return;
    }

    if (userSentRef.current) {
      // User just sent a message — always scroll to bottom
      userSentRef.current = false;
      scrollToBottom('smooth');
      isNearBottomRef.current = true;
      setNewMessageCount(0);
      return;
    }
    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
      setNewMessageCount(0);
    } else if (hadNew) {
      // New message arrived while scrolled up
      setNewMessageCount(c => c + delta);
    }
  }, [messages, isGenerating, isLoadingHistory, scrollToBottom]);

  // Wrap onSend to flag that user initiated a message
  const handleSend = useCallback((text: string, attachments?: Array<{ mimeType: string; fileName: string; content: string }>) => {
    userSentRef.current = true;
    onSend(text, attachments);
  }, [onSend]);

  const visibleMessages = useMemo(() => {
    const filtered = messages.filter(hasVisibleContent);
    const GROUP_GAP_MS = 2 * 60 * 1000; // 2 minutes
    return filtered.reduce<Array<{ msg: ChatMessage; showSep: boolean; isFirstInGroup: boolean }>>((acc, msg) => {
      const dk = getDateKey(msg.timestamp);
      const prevDk = acc.length > 0 ? getDateKey(acc[acc.length - 1].msg.timestamp) : '';
      const showSep = dk !== prevDk;
      const prev = acc.length > 0 ? acc[acc.length - 1] : null;
      const isFirstInGroup = showSep || !prev || prev.msg.role !== msg.role || prev.msg.isSystemEvent !== msg.isSystemEvent || (msg.timestamp - prev.msg.timestamp > GROUP_GAP_MS);
      acc.push({ msg, showSep, isFirstInGroup });
      return acc;
    }, []);
  }, [messages]);

  const showTyping = isGenerating && !hasStreamedText(messages);
  const sessionAgentId = sessionKey?.match(/^agent:([^:]+):/)?.[1];
  const welcomeTitle = agentName || sessionAgentId || t('chat.welcome');

  const { globalState, collapseAll, expandAll } = useToolCollapse();
  const { toggle: toggleBookmark, isBookmarked, getForSession: getBookmarks } = useBookmarks();
  const sessionBookmarks = useMemo(() => sessionKey ? getBookmarks(sessionKey) : [], [getBookmarks, sessionKey]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const hasToolCalls = useMemo(() => messages.some(m => m.blocks.some(b => b.type === 'tool_use' || b.type === 'tool_result')), [messages]);

  const handleExport = useCallback(() => {
    const label = sessionKey?.replace(/^agent:[^:]+:/, '') || 'conversation';
    const md = messagesToMarkdown(messages, label);
    const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    downloadFile(md, `${safeLabel}-${new Date().toISOString().slice(0, 10)}.md`);
  }, [messages, sessionKey]);

  // Message search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  // Compute matches: list of message IDs containing the query
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [] as string[];
    const q = searchQuery.toLowerCase();
    return visibleMessages
      .filter(({ msg }) => {
        const content = msg.content?.toLowerCase() || '';
        if (content.includes(q)) return true;
        return msg.blocks.some(b => {
          if (b.type === 'text' || b.type === 'thinking') return b.text.toLowerCase().includes(q);
          if (b.type === 'tool_result') return b.content.toLowerCase().includes(q);
          return false;
        });
      })
      .map(({ msg }) => msg.id);
  }, [visibleMessages, searchQuery]);

  const handleSearch = useCallback((query: string, activeIndex: number) => {
    setSearchQuery(query);
    setSearchActiveIndex(activeIndex);
  }, []);

  // Scroll to active match
  useEffect(() => {
    if (searchMatches.length === 0) return;
    const id = searchMatches[searchActiveIndex];
    if (!id) return;
    const el = scrollContainerRef.current?.querySelector(`[data-msg-id="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [searchActiveIndex, searchMatches]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Ctrl+F handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <MessageSearch open={searchOpen} onClose={closeSearch} onSearch={handleSearch} matchCount={searchMatches.length} />
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative" role="log" aria-label={t('chat.messages')} aria-live="polite">
        <div className="max-w-4xl mx-auto py-4 w-full">
          {messages.length === 0 && isLoadingHistory && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-pc-text-muted">
              <Loader2 className="h-8 w-8 text-pc-accent-light/60 animate-spin mb-4" />
              <div className="text-sm text-pc-text-muted">{t('chat.loadingHistory')}</div>
            </div>
          )}
          {messages.length === 0 && !isLoadingHistory && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-pc-text-muted">
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-400/10 via-indigo-500/10 to-violet-500/10 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-pc-border bg-pc-elevated/40">
                  <Bot className="h-8 w-8 text-pc-accent-light" />
                </div>
              </div>
              <div className="text-lg text-pc-text font-semibold">{welcomeTitle}</div>
              <div className="text-sm mt-1 text-pc-text-muted">{t('chat.welcomeSub')}</div>
              <div className="mt-8 flex flex-col items-center gap-3 max-w-md w-full">
                <div className="flex items-center gap-1.5 text-xs text-pc-text-faint">
                  <Sparkles size={12} />
                  <span>{t('chat.suggestions')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {(['chat.suggestion1', 'chat.suggestion2', 'chat.suggestion3', 'chat.suggestion4'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => onSend(t(key))}
                      className="text-left text-sm px-4 py-3 rounded-2xl border border-pc-border bg-pc-elevated/30 text-pc-text-secondary hover:bg-[var(--pc-hover)] hover:text-pc-text hover:border-[var(--pc-accent-dim)] transition-all duration-200 leading-snug"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {visibleMessages.map(({ msg, showSep, isFirstInGroup }) => {
            const isActiveMatch = searchMatches.length > 0 && searchMatches[searchActiveIndex] === msg.id;

            // Render compaction separator
            if (msg.isCompactionSeparator) {
              return (
                <div key={msg.id} className="flex items-center gap-3 py-4 px-4 select-none">
                  <div className="flex-1 h-px bg-amber-500/30" />
                  <span className="text-[11px] font-medium text-amber-400/70 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {t('chat.contextCompacted')}
                  </span>
                  <div className="flex-1 h-px bg-amber-500/30" />
                </div>
              );
            }

            return (
                <div key={msg.id} data-msg-id={msg.id}>
                  {showSep && (
                    <div className="flex items-center gap-3 py-3 px-4 select-none" aria-label={formatDateSeparator(msg.timestamp, t)}>
                      <div className="flex-1 h-px bg-[var(--pc-hover-strong)]" />
                      <span className="text-[11px] font-medium text-pc-text-muted uppercase tracking-wider">{formatDateSeparator(msg.timestamp, t)}</span>
                      <div className="flex-1 h-px bg-[var(--pc-hover-strong)]" />
                    </div>
                  )}
                  <div className={`${isActiveMatch ? 'ring-1 ring-pc-accent-light/40 rounded-lg' : ''} ${msg.isArchived ? 'opacity-60' : ''}`}>
                    <ChatMessageComponent message={msg} onRetry={!isGenerating ? handleSend : undefined} onReply={(preview) => { setReplyTo({ preview }); document.getElementById('chat-input')?.focus(); }} agentAvatarUrl={agentAvatarUrl} isFirstInGroup={isFirstInGroup} isBookmarked={isBookmarked(msg.id)} onToggleBookmark={sessionKey ? () => toggleBookmark(msg.id, sessionKey, (msg.content || '').slice(0, 120), msg.timestamp) : undefined} />
                  </div>
                </div>
            );
          })}
          {showTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
        {/* Bookmarks panel */}
        {showBookmarks && sessionBookmarks.length > 0 && (
          <div className="sticky bottom-14 z-20 flex justify-center pointer-events-none pb-1">
            <div className="pointer-events-auto w-72 max-h-48 overflow-y-auto rounded-2xl border border-pc-border-strong bg-pc-elevated/95 backdrop-blur-xl shadow-2xl p-2">
              <div className="text-[10px] uppercase tracking-wider text-pc-text-muted font-semibold px-2 py-1">{t('chat.bookmarks')}</div>
              {sessionBookmarks.map(b => (
                <button
                  key={b.messageId}
                  onClick={() => {
                    const el = document.querySelector(`[data-msg-id="${b.messageId}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setShowBookmarks(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-[var(--pc-hover)] text-xs text-pc-text-secondary truncate transition-colors"
                >
                  <span className="text-amber-400 mr-1">★</span>
                  {b.preview || '(empty)'}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Floating action buttons — sticky to bottom of scroll area */}
        {(hasToolCalls || messages.length > 0 || showScrollBtn || newMessageCount > 0) && (
          <div className="sticky bottom-3 z-10 flex justify-center pointer-events-none pb-1">
            <div className="flex items-center gap-2 pointer-events-auto">
              {hasToolCalls && (
                <button
                  onClick={globalState === 'expand-all' ? collapseAll : expandAll}
                  aria-label={globalState === 'expand-all' ? t('chat.collapseTools') : t('chat.expandTools')}
                  title={globalState === 'expand-all' ? t('chat.collapseTools') : t('chat.expandTools')}
                  className="flex items-center gap-1.5 rounded-full border border-pc-border-strong bg-pc-elevated/90 backdrop-blur-lg px-3 py-2 text-xs text-pc-text shadow-lg hover:bg-pc-elevated/90 transition-all hover:shadow-violet-500/10"
                >
                  {globalState === 'expand-all' ? <ChevronsDownUp size={14} className="text-violet-300" /> : <ChevronsUpDown size={14} className="text-violet-300" />}
                </button>
              )}
              {sessionBookmarks.length > 0 && (
                <button
                  onClick={() => setShowBookmarks(v => !v)}
                  aria-label={t('chat.bookmarks')}
                  title={t('chat.bookmarks')}
                  className={`flex items-center gap-1.5 rounded-full border border-pc-border-strong bg-pc-elevated/90 backdrop-blur-lg px-3 py-2 text-xs text-pc-text shadow-lg hover:bg-pc-elevated/90 transition-all hover:shadow-amber-500/10 ${showBookmarks ? 'ring-1 ring-amber-400/40' : ''}`}
                >
                  <Bookmark size={14} className="text-amber-300 fill-amber-300" />
                  <span className="text-[10px] tabular-nums text-pc-text-muted">{sessionBookmarks.length}</span>
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={handleExport}
                  aria-label={t('chat.export')}
                  title={t('chat.export')}
                  className="flex items-center gap-1.5 rounded-full border border-pc-border-strong bg-pc-elevated/90 backdrop-blur-lg px-3 py-2 text-xs text-pc-text shadow-lg hover:bg-pc-elevated/90 transition-all hover:shadow-cyan-500/10"
                >
                  <Download size={14} className="text-pc-accent-light" />
                </button>
              )}
              {(showScrollBtn || newMessageCount > 0) && (
                <button
                  onClick={() => { scrollToBottom('smooth'); setNewMessageCount(0); }}
                  aria-label={newMessageCount > 0 ? t('chat.scrollToBottom') : t('chat.scrollDown')}
                  className="flex items-center gap-1.5 rounded-full border border-pc-border-strong bg-pc-elevated/90 backdrop-blur-lg px-3.5 py-2 text-xs text-pc-text shadow-lg hover:bg-pc-elevated/90 transition-all hover:shadow-cyan-500/10"
                >
                  <ArrowDown size={14} className={newMessageCount > 0 ? 'text-pc-accent-light animate-bounce' : 'text-pc-accent-light'} />
                  {newMessageCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-[var(--pc-accent)] text-white text-[10px] font-bold tabular-nums">
                      {newMessageCount > 99 ? '99+' : newMessageCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} onNewSession={onNewSession} onAbort={onAbort} isGenerating={isGenerating} disabled={status !== 'connected'} sessionKey={sessionKey} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </div>
  );
}

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage, ConnectionStatus } from '../types';
import { Bot, ArrowDown } from 'lucide-react';
import { useT } from '../hooks/useLocale';
import { getLocale, type TranslationKey } from '../lib/i18n';

interface Props {
  messages: ChatMessage[];
  isGenerating: boolean;
  status: ConnectionStatus;
  onSend: (text: string, attachments?: Array<{ mimeType: string; fileName: string; content: string }>) => void;
  onAbort: () => void;
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

export function Chat({ messages, isGenerating, status, onSend, onAbort }: Props) {
  const t = useT();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const userSentRef = useRef(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const checkIfNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= SCROLL_THRESHOLD;
    setShowScrollBtn(distanceFromBottom > SCROLL_THRESHOLD * 2);
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

  // Auto-scroll when messages change, but only if user is near bottom or just sent a message
  useEffect(() => {
    if (userSentRef.current) {
      // User just sent a message — always scroll to bottom
      userSentRef.current = false;
      scrollToBottom('smooth');
      isNearBottomRef.current = true;
      return;
    }
    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, isGenerating, scrollToBottom]);

  // Wrap onSend to flag that user initiated a message
  const handleSend = useCallback((text: string, attachments?: Array<{ mimeType: string; fileName: string; content: string }>) => {
    userSentRef.current = true;
    onSend(text, attachments);
  }, [onSend]);

  const visibleMessages = useMemo(() => {
    const filtered = messages.filter(hasVisibleContent);
    return filtered.reduce<Array<{ msg: ChatMessage; showSep: boolean }>>((acc, msg) => {
      const dk = getDateKey(msg.timestamp);
      const prevDk = acc.length > 0 ? getDateKey(acc[acc.length - 1].msg.timestamp) : '';
      acc.push({ msg, showSep: dk !== prevDk });
      return acc;
    }, []);
  }, [messages]);

  const showTyping = isGenerating && !hasStreamedText(messages);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative" role="log" aria-label={t('chat.messages')} aria-live="polite">
        <div className="max-w-4xl mx-auto py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-400/10 via-indigo-500/10 to-violet-500/10 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-zinc-800/40">
                  <Bot className="h-8 w-8 text-cyan-200" />
                </div>
              </div>
              <div className="text-lg text-zinc-200 font-semibold">{t('chat.welcome')}</div>
              <div className="text-sm mt-1 text-zinc-500">{t('chat.welcomeSub')}</div>
            </div>
          )}
          {visibleMessages.map(({ msg, showSep }) => (
                <div key={msg.id}>
                  {showSep && (
                    <div className="flex items-center gap-3 py-3 px-4 select-none" aria-label={formatDateSeparator(msg.timestamp, t)}>
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{formatDateSeparator(msg.timestamp, t)}</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>
                  )}
                  <ChatMessageComponent message={msg} onRetry={!isGenerating ? handleSend : undefined} />
                </div>
          ))}
          {showTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>
      {/* Scroll to bottom FAB */}
      {showScrollBtn && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => scrollToBottom('smooth')}
            aria-label={t('chat.scrollToBottom')}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-800/90 backdrop-blur-lg px-3.5 py-2 text-xs text-zinc-300 shadow-lg hover:bg-zinc-700/90 transition-all hover:shadow-cyan-500/10"
          >
            <ArrowDown size={14} className="text-cyan-300" />
            <span className="hidden sm:inline">{t('chat.scrollToBottom')}</span>
          </button>
        </div>
      )}
      <ChatInput onSend={handleSend} onAbort={onAbort} isGenerating={isGenerating} disabled={status !== 'connected'} />
    </div>
  );
}

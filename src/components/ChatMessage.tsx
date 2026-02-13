
import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { LazyMarkdown } from './LazyMarkdown';
import type { ChatMessage as ChatMessageType, MessageBlock } from '../types';
import { useTheme } from '../hooks/useTheme';
import { ThinkingBlock } from './ThinkingBlock';
import { ThinkingIndicator } from './ThinkingIndicator';
import { CodeBlock } from './CodeBlock';
import { ToolCall } from './ToolCall';
import { ImageBlock } from './ImageBlock';
import { buildImageSrc } from '../lib/image';
import { Bot, User, Wrench, Copy, Check, CheckCheck, RefreshCw, Zap, Info, Webhook, Braces, Clock, AlertCircle } from 'lucide-react';
import { t, getLocale } from '../lib/i18n';
import { useLocale } from '../hooks/useLocale';
import { stripWebhookScaffolding, hasWebhookScaffolding } from '../lib/systemEvent';
// ChevronDown, ChevronRight, Wrench still used by InternalOnlyMessage

function getBcp47(): string {
  return getLocale() === 'fr' ? 'fr-FR' : 'en-US';
}

function formatTimestamp(ts: number): string {
  const bcp47Locale = getBcp47();
  const date = new Date(ts);
  const now = new Date();
  const time = date.toLocaleTimeString(bcp47Locale, { hour: '2-digit', minute: '2-digit' });
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) return time;
  if (isYesterday) return `${t('time.yesterday')} ${time}`;
  return `${date.toLocaleDateString(bcp47Locale, { day: 'numeric', month: 'short' })} ${time}`;
}

/** Guess a language hint from content patterns */
function guessLanguage(lines: string[]): string {
  const joined = lines.join('\n');
  if (/^import .+ from ['"]/.test(joined) || /^export (function|const|default|class|interface|type) /.test(joined) || /React\./.test(joined) || /<\w+[\s/>]/.test(joined) && /className=/.test(joined)) return 'tsx';
  if (/^(import|export|const|let|var|function|class|interface|type) /.test(joined) || /=>\s*{/.test(joined) || /: (string|number|boolean|any)\b/.test(joined)) return 'typescript';
  if (/^(use |fn |let mut |pub |impl |struct |enum |mod |crate::)/.test(joined) || /-> (Self|Result|Option|Vec|String|bool|i32|u32)/.test(joined)) return 'rust';
  if (/^(def |class |import |from .+ import |if __name__)/.test(joined) || /self\.\w+/.test(joined) && !/this\./.test(joined)) return 'python';
  if (/^\s*(server|location|upstream|proxy_pass|listen \d)/.test(joined)) return 'nginx';
  if (/^\[.*\]\s*$/.test(lines[0] || '') && /=/.test(joined)) return 'ini';
  if (/^(apiVersion|kind|metadata|spec):/.test(joined)) return 'yaml';
  if (/^\{/.test(joined.trim()) && /\}$/.test(joined.trim())) return 'json';
  if (/^#!\/(bin|usr)/.test(joined) || /^\s*(if \[|then|fi|echo |export |source )/.test(joined)) return 'bash';
  if (/^(<!DOCTYPE|<html|<div|<head|<body)/.test(joined)) return 'html';
  if (/^\.\w+\s*\{|^@(media|keyframes|import)/.test(joined)) return 'css';
  if (/^(SELECT|INSERT|CREATE|ALTER|DROP|UPDATE) /i.test(joined)) return 'sql';
  return '';
}

/** Detect if a block of lines looks like code */
function looksLikeCode(lines: string[]): boolean {
  if (lines.length < 2) return false;
  // If text contains markdown formatting, it's probably prose, not code
  const joined = lines.join('\n');
  if (/\*\*[^*]+\*\*/.test(joined) || /^#{1,6}\s/m.test(joined) || /^\s*[-*+]\s/m.test(joined)) return false;
  let codeSignals = 0;
  const patterns = [
    /^(import|export|const|let|var|function|class|interface|type|enum|struct|fn|pub|use|def|from|module|package|namespace)\s/,
    /[{};]\s*$/,
    /^\s*(if|else|for|while|return|match|switch|case|break|continue)\b/,
    /^\s*(\/\/|\/\*)/,
    /^\s*#\s*(?:include|define|ifdef|ifndef|endif|pragma|import)\b/,
    /[├└│┬─]──/,
    /^\s+\w+\(.*\)/,
    /^\s*<\/?[A-Z]\w*/,
    /=>\s*[{(]/,
    /\.\w+\(.*\)\s*[;,]?\s*$/,
  ];
  for (const line of lines) {
    for (const pat of patterns) {
      if (pat.test(line)) { codeSignals++; break; }
    }
  }
  return codeSignals / lines.length > 0.3;
}

/** Auto-wrap unformatted code/terminal output in fenced code blocks */
function autoFormatText(text: string): string {
  // Already has code fences — leave as-is
  if (text.includes('```')) return text;

  const lines = text.split('\n');

  // If most of the text looks like code, wrap the whole thing
  const nonEmptyLines = lines.filter(l => l.trim());
  if (nonEmptyLines.length >= 3 && looksLikeCode(nonEmptyLines)) {
    const lang = guessLanguage(nonEmptyLines);
    return '```' + lang + '\n' + text + '\n```';
  }

  // Otherwise, detect contiguous code blocks within prose
  const result: string[] = [];
  let codeBuffer: string[] = [];

  const flushCode = () => {
    if (codeBuffer.length >= 3 && looksLikeCode(codeBuffer)) {
      const lang = guessLanguage(codeBuffer);
      result.push('```' + lang);
      result.push(...codeBuffer);
      result.push('```');
    } else {
      result.push(...codeBuffer);
    }
    codeBuffer = [];
  };

  const isCodeLine = (line: string): boolean => {
    return /^[\s]+(import|export|const|let|var|function|return|if|else|for)/.test(line)
      || /[{};]\s*$/.test(line)
      || /^\s*\/\//.test(line)
      || /[├└│┬─]──/.test(line)
      || /^\s+\w+\(.*\)/.test(line);
  };

  for (const line of lines) {
    if (isCodeLine(line) || (codeBuffer.length > 0 && (line.trim() === '' || /^\s{2,}/.test(line)))) {
      codeBuffer.push(line);
    } else {
      flushCode();
      result.push(line);
    }
  }
  flushCode();

  return result.join('\n');
}

function getTextBlocks(blocks: MessageBlock[]): MessageBlock[] {
  return blocks.filter(b => b.type === 'text' && b.text.trim());
}

function getImageBlocks(blocks: MessageBlock[]): MessageBlock[] {
  return blocks.filter(b => b.type === 'image');
}

function getInternalBlocks(blocks: MessageBlock[]): MessageBlock[] {
  return blocks.filter(b => b.type === 'thinking' || b.type === 'tool_use' || b.type === 'tool_result');
}

function MarkdownImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <ImageBlock src={props.src || ''} alt={props.alt} />;
}

function MarkdownLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children, ...rest } = props;
  const isExternal = href && /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

const markdownComponents = { pre: CodeBlock, img: MarkdownImage, a: MarkdownLink };

function renderTextBlocks(blocks: MessageBlock[]) {
  return getTextBlocks(blocks).map((block, i) => (
    <div key={`text-${i}`} className="markdown-body">
      <LazyMarkdown components={markdownComponents}>
        {autoFormatText((block as Extract<MessageBlock, { type: 'text' }>).text)}
      </LazyMarkdown>
    </div>
  ));
}

function renderImageBlocks(blocks: MessageBlock[]) {
  return getImageBlocks(blocks).map((block, i) => {
    const b = block as { type: 'image'; mediaType: string; data?: string; url?: string };
    const src = buildImageSrc(b.mediaType, b.data, b.url);
    if (!src) return null;
    return <ImageBlock key={`img-${i}`} src={src} alt="Image" />;
  });
}

function renderInternalBlocks(blocks: MessageBlock[]) {
  const elements: React.ReactElement[] = [];
  const internals = getInternalBlocks(blocks);
  for (let i = 0; i < internals.length; i++) {
    const block = internals[i];
    if (block.type === 'thinking') {
      elements.push(<ThinkingBlock key={`int-${i}`} text={block.text} />);
    } else if (block.type === 'tool_use') {
      const nextBlock = internals[i + 1];
      const result = nextBlock?.type === 'tool_result' ? nextBlock.content : undefined;
      elements.push(<ToolCall key={`int-${i}`} name={block.name} input={block.input} result={result} />);
      if (result !== undefined) i++;
    } else if (block.type === 'tool_result') {
      elements.push(<ToolCall key={`int-${i}`} name={block.name || 'tool'} result={block.content} />);
    }
  }
  return elements;
}

function InternalsSummary({ blocks }: { blocks: MessageBlock[] }) {
  const internals = getInternalBlocks(blocks);
  if (internals.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {renderInternalBlocks(blocks)}
    </div>
  );
}

/** Message with ONLY internal blocks (no text for the user) */
function InternalOnlyMessage({ message }: { message: ChatMessageType }) {
  return (
    <div className="animate-fade-in flex gap-3 px-4 py-1">
      <div className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-xl border border-pc-border bg-pc-elevated/30">
        <Wrench className="h-3 w-3 text-pc-text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="space-y-1">
          {renderInternalBlocks(message.blocks)}
        </div>
        {message.timestamp && (
          <div className="mt-0.5 text-[10px] text-pc-text-faint">
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 h-7 w-7 rounded-lg border border-pc-border bg-pc-elevated/80 backdrop-blur-sm flex items-center justify-center text-pc-text-secondary hover:text-pc-accent-light hover:border-[var(--pc-accent-dim)] transition-all opacity-0 group-hover:opacity-100"
      title={copied ? t('message.copied') : t('message.copy')}
      aria-label={t('message.copy')}
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

function MetadataViewer({ metadata }: { metadata?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const btn = btnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      setPos({ top: r.top - 4, left: r.left });
    }
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="h-7 w-7 rounded-lg border border-pc-border bg-pc-elevated/80 backdrop-blur-sm flex items-center justify-center text-pc-text-secondary hover:text-pc-accent-light hover:border-[var(--pc-accent-dim)] transition-all opacity-0 group-hover:opacity-100"
        title={t('message.metadata')}
        aria-label={t('message.metadata')}
      >
        <Info size={13} />
      </button>
      {open && pos && createPortal(
        <div ref={panelRef} className="fixed z-[9999] w-72 max-h-64 overflow-auto rounded-xl border border-pc-border-strong bg-pc-input/95 backdrop-blur-md shadow-xl p-3 text-[11px] text-pc-text-secondary font-mono leading-relaxed custom-scrollbar" style={{ top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}>
          {Object.entries(metadata).map(([k, v]) => (
            <div key={k} className="flex gap-2 py-0.5">
              <span className="text-pc-accent/70 shrink-0">{k}:</span>
              <span className="text-pc-text break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function RawJsonToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`h-7 w-7 rounded-lg border border-pc-border bg-pc-elevated/80 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isOpen ? 'text-pc-accent-light border-[var(--pc-accent-dim)]' : 'text-pc-text-secondary hover:text-pc-accent-light hover:border-[var(--pc-accent-dim)]'}`}
      title={isOpen ? t('message.hideRawJson') : t('message.rawJson')}
      aria-label={t('message.rawJson')}
    >
      <Braces size={13} />
    </button>
  );
}

function RawJsonPanel({ message }: { message: ChatMessageType }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(message, null, 2);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [json]);

  return (
    <div className="mt-2 rounded-xl border border-pc-border-strong bg-pc-base/80 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-pc-border bg-pc-elevated/30">
        <span className="text-[11px] font-medium text-pc-text-muted">Raw JSON</span>
        <button
          onClick={handleCopy}
          className="h-6 w-6 rounded-md flex items-center justify-center text-pc-text-secondary hover:text-pc-accent-light transition-colors"
          title={copied ? t('message.copied') : t('message.copy')}
          aria-label={copied ? t('message.copied') : t('message.copy')}
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="p-3 text-[11px] leading-relaxed text-pc-text-secondary font-mono overflow-auto max-h-80 custom-scrollbar whitespace-pre-wrap break-all">
        {json}
      </pre>
    </div>
  );
}

/** Extract plain text from message blocks for clipboard copy */
function getPlainText(message: ChatMessageType): string {
  if (message.blocks.length > 0) {
    return getTextBlocks(message.blocks).map(b => (b as Extract<MessageBlock, { type: 'text' }>).text).join('\n\n');
  }
  return message.content;
}

/** System event displayed as a subtle inline notification */
function SystemEventMessage({ message }: { message: ChatMessageType }) {
  const text = message.content || getTextBlocks(message.blocks).map(b => (b as Extract<MessageBlock, { type: 'text' }>).text).join(' ');
  // Trim leading brackets like [cron:xxx] or [EVENT] for cleaner display
  const display = text.replace(/^\[.*?\]\s*/, '').trim() || text.trim();
  const label = text.match(/^\[([^\]]+)\]/)?.[1] || 'system';

  return (
    <div className="animate-fade-in flex items-center justify-center gap-2 px-4 py-1.5 my-0.5">
      <div className="flex items-center gap-1.5 max-w-[85%] rounded-full px-3 py-1 bg-pc-elevated/30 border border-pc-border">
        <Zap className="h-3 w-3 text-pc-text-muted shrink-0" />
        <span className="text-[11px] font-medium text-pc-text-muted shrink-0">{label}</span>
        <span className="text-[11px] text-pc-text-muted truncate">{display}</span>
        {message.timestamp && (
          <span className="text-[10px] text-pc-text-faint shrink-0 ml-1">{formatTimestamp(message.timestamp)}</span>
        )}
      </div>
    </div>
  );
}

export const ChatMessageComponent = memo(function ChatMessageComponent({ message: rawMessage, onRetry, agentAvatarUrl }: { message: ChatMessageType; onRetry?: (text: string) => void; agentAvatarUrl?: string }) {
  useLocale(); // re-render on locale change
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [showRawJson, setShowRawJson] = useState(false);

  // Strip webhook/hook scaffolding from user messages before rendering
  const message = useMemo(() => {
    if (rawMessage.role !== 'user') return rawMessage;
    const content = rawMessage.content || '';
    const textBlocks = getTextBlocks(rawMessage.blocks);
    const contentHasScaffolding = hasWebhookScaffolding(content);
    const anyBlockHasScaffolding = textBlocks.some(b =>
      hasWebhookScaffolding((b as Extract<MessageBlock, { type: 'text' }>).text)
    );
    if (!contentHasScaffolding && !anyBlockHasScaffolding) return rawMessage;
    // Clean the content and blocks
    const cleaned: ChatMessageType = { ...rawMessage };
    if (cleaned.content) {
      cleaned.content = stripWebhookScaffolding(cleaned.content);
    }
    if (cleaned.blocks.length > 0) {
      cleaned.blocks = cleaned.blocks.map(b => {
        if (b.type === 'text') {
          const tb = b as Extract<MessageBlock, { type: 'text' }>;
          return { ...tb, text: stripWebhookScaffolding(tb.text) };
        }
        return b;
      });
    }
    return cleaned;
  }, [rawMessage]);

  const wasWebhookMessage = rawMessage !== message;

  const isUser = message.role === 'user';

  // System events render as subtle inline notifications
  if (message.isSystemEvent) {
    return <SystemEventMessage message={rawMessage} />;
  }

  // Assistant message with no text content — only tool calls / thinking
  if (!isUser && message.blocks.length > 0) {
    const textBlocks = getTextBlocks(message.blocks);
    const imageBlocks = getImageBlocks(message.blocks);
    const hasText = textBlocks.length > 0 || imageBlocks.length > 0 || (message.isStreaming && message.content?.trim());
    if (!hasText && !message.isStreaming) {
      return <InternalOnlyMessage message={message} />;
    }
  }

  return (
    <div className={`animate-fade-in flex gap-3 px-4 py-2 ${isUser ? 'flex-row-reverse' : ''} ${message.sendStatus === 'sending' ? 'opacity-70' : ''} ${message.sendStatus === 'error' ? 'opacity-60' : ''}`}>
      {/* Avatar */}
      <div className="shrink-0 mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-pc-border bg-pc-elevated/40 overflow-hidden">
        {isUser
          ? <User className="h-4 w-4 text-pc-accent-light" />
          : agentAvatarUrl
            ? <img src={agentAvatarUrl} alt="Agent" className="h-full w-full object-cover" />
            : <Bot className="h-4 w-4 text-pc-accent-light" />
        }
      </div>

      {/* Bubble */}
      <div className={`min-w-0 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`group relative inline-block text-left rounded-3xl px-4 py-3 text-sm leading-relaxed max-w-full overflow-hidden ${
          isUser
            ? (isLight
                ? 'bg-[rgba(var(--pc-accent-rgb),0.12)] text-pc-text border border-[rgba(var(--pc-accent-rgb),0.3)]'
                : 'bg-[rgba(var(--pc-accent-rgb),0.08)] text-pc-text border border-[rgba(var(--pc-accent-rgb),0.2)]')
            : 'bg-pc-elevated/40 text-pc-text border border-pc-border shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
        }`}>
          {/* Action buttons */}
          {!isUser && !message.isStreaming && getPlainText(message).trim() && (
            <CopyButton text={getPlainText(message)} />
          )}
          <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-10'} flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10`}>
            <MetadataViewer metadata={message.metadata} />
            <RawJsonToggle isOpen={showRawJson} onToggle={() => setShowRawJson(o => !o)} />
          </div>
          {/* Retry button (user messages only) */}
          {isUser && onRetry && (
            <button
              onClick={() => onRetry(getPlainText(message))}
              className={`absolute top-2 right-2 h-7 w-7 rounded-lg border border-pc-border bg-pc-elevated/80 backdrop-blur-sm flex items-center justify-center text-pc-text-secondary hover:text-pc-accent-light hover:border-[var(--pc-accent-dim)] transition-all ${message.sendStatus === 'error' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              title={t('message.retry')}
              aria-label={t('message.retry')}
            >
              <RefreshCw size={13} className={message.sendStatus === 'error' ? 'text-red-400' : ''} />
            </button>
          )}
          {/* User-visible text */}
          {message.blocks.length > 0 ? renderTextBlocks(message.blocks) : (
            <div className="markdown-body">
              <LazyMarkdown components={markdownComponents}>
                {autoFormatText(message.content)}
              </LazyMarkdown>
            </div>
          )}

          {/* Inline images */}
          {renderImageBlocks(message.blocks)}

          {/* Streaming indicator */}
          {message.isStreaming && (() => {
            const hasVisibleContent = message.content?.trim();
            if (!hasVisibleContent) {
              return <ThinkingIndicator />;
            }
            return (
              <div className="flex gap-1 mt-2">
                <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300/80 to-violet-400/80 inline-block" />
                <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300/80 to-violet-400/80 inline-block" />
                <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300/80 to-violet-400/80 inline-block" />
              </div>
            );
          })()}

          {/* Tool calls & thinking (inline) */}
          {!isUser && <InternalsSummary blocks={message.blocks} />}

          {/* Raw JSON viewer */}
          {showRawJson && <RawJsonPanel message={rawMessage} />}
        </div>
        {(message.timestamp || wasWebhookMessage) && (
          <div className={`mt-1 flex items-center gap-1.5 text-[11px] text-pc-text-muted ${isUser ? 'justify-end pr-2' : 'pl-2'}`}>
            {wasWebhookMessage && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-pc-text-faint" title="Webhook message (scaffolding stripped)">
                <Webhook size={10} className="opacity-60" />
                <span>webhook</span>
              </span>
            )}
            {message.timestamp && formatTimestamp(message.timestamp)}
            {isUser && message.sendStatus === 'sending' && (
              <span title="Sending..."><Clock size={10} className="animate-pulse text-pc-text-faint" /></span>
            )}
            {isUser && message.sendStatus === 'sent' && (
              <span title="Sent"><CheckCheck size={10} className="text-pc-accent" /></span>
            )}
            {isUser && message.sendStatus === 'error' && (
              <span title="Failed to send"><AlertCircle size={10} className="text-red-400" /></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

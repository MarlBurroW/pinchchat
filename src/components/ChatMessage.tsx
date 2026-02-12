
import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import type { ChatMessage as ChatMessageType, MessageBlock } from '../types';
import { ThinkingBlock } from './ThinkingBlock';
import { CodeBlock } from './CodeBlock';
import { ToolCall } from './ToolCall';
import { ImageBlock } from './ImageBlock';
import { buildImageSrc } from '../lib/image';
import { Bot, User, Wrench, Copy, Check, RefreshCw, Zap } from 'lucide-react';
import { t, getLocale } from '../lib/i18n';
import { useLocale } from '../hooks/useLocale';
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

const markdownComponents = { pre: CodeBlock, img: MarkdownImage };

function renderTextBlocks(blocks: MessageBlock[]) {
  return getTextBlocks(blocks).map((block, i) => (
    <div key={`text-${i}`} className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
        {autoFormatText((block as Extract<MessageBlock, { type: 'text' }>).text)}
      </ReactMarkdown>
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
      <div className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-xl border border-white/5 bg-zinc-800/30">
        <Wrench className="h-3 w-3 text-zinc-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="space-y-1">
          {renderInternalBlocks(message.blocks)}
        </div>
        {message.timestamp && (
          <div className="mt-0.5 text-[10px] text-zinc-600">
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
      className="absolute top-2 right-2 h-7 w-7 rounded-lg border border-white/8 bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-cyan-300 hover:border-cyan-400/30 transition-all opacity-0 group-hover:opacity-100"
      title={copied ? t('message.copied') : t('message.copy')}
      aria-label={t('message.copy')}
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
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
      <div className="flex items-center gap-1.5 max-w-[85%] rounded-full px-3 py-1 bg-zinc-800/30 border border-white/5">
        <Zap className="h-3 w-3 text-zinc-500 shrink-0" />
        <span className="text-[11px] font-medium text-zinc-500 shrink-0">{label}</span>
        <span className="text-[11px] text-zinc-500 truncate">{display}</span>
        {message.timestamp && (
          <span className="text-[10px] text-zinc-600 shrink-0 ml-1">{formatTimestamp(message.timestamp)}</span>
        )}
      </div>
    </div>
  );
}

export function ChatMessageComponent({ message, onRetry }: { message: ChatMessageType; onRetry?: (text: string) => void }) {
  useLocale(); // re-render on locale change
  const isUser = message.role === 'user';

  // System events render as subtle inline notifications
  if (message.isSystemEvent) {
    return <SystemEventMessage message={message} />;
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
    <div className={`animate-fade-in flex gap-3 px-4 py-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="shrink-0 mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/8 bg-zinc-800/40">
        {isUser
          ? <User className="h-4 w-4 text-cyan-200" />
          : <Bot className="h-4 w-4 text-cyan-200" />
        }
      </div>

      {/* Bubble */}
      <div className={`min-w-0 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`group relative inline-block text-left rounded-3xl px-4 py-3 text-sm leading-relaxed max-w-full overflow-hidden ${
          isUser
            ? 'bg-gradient-to-b from-cyan-800/40 to-cyan-900/25 text-zinc-100 border border-cyan-400/30'
            : 'bg-zinc-800/40 text-zinc-300 border border-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
        }`}>
          {/* Copy button (assistant messages only) */}
          {!isUser && !message.isStreaming && getPlainText(message).trim() && (
            <CopyButton text={getPlainText(message)} />
          )}
          {/* Retry button (user messages only) */}
          {isUser && onRetry && (
            <button
              onClick={() => onRetry(getPlainText(message))}
              className="absolute top-2 right-2 h-7 w-7 rounded-lg border border-white/8 bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-cyan-300 hover:border-cyan-400/30 transition-all opacity-0 group-hover:opacity-100"
              title={t('message.retry')}
              aria-label={t('message.retry')}
            >
              <RefreshCw size={13} />
            </button>
          )}
          {/* User-visible text */}
          {message.blocks.length > 0 ? renderTextBlocks(message.blocks) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                {autoFormatText(message.content)}
              </ReactMarkdown>
            </div>
          )}

          {/* Inline images */}
          {renderImageBlocks(message.blocks)}

          {/* Streaming dots */}
          {message.isStreaming && (
            <div className="flex gap-1 mt-2">
              <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300/80 to-violet-400/80 inline-block" />
              <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300/80 to-violet-400/80 inline-block" />
              <span className="bounce-dot w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300/80 to-violet-400/80 inline-block" />
            </div>
          )}

          {/* Tool calls & thinking (inline) */}
          {!isUser && <InternalsSummary blocks={message.blocks} />}
        </div>
        {message.timestamp && (
          <div className={`mt-1 text-[11px] text-zinc-500 ${isUser ? 'text-right pr-2' : 'pl-2'}`}>
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

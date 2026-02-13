import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Check, Copy, WrapText, AlignLeft } from 'lucide-react';
import hljs from '../lib/highlight';
import { useT } from '../hooks/useLocale';
import { ImageBlock } from './ImageBlock';
import { useToolCollapse } from '../hooks/useToolCollapse';

type ToolColor = { border: string; bg: string; text: string; icon: string; glow: string; expandBorder: string; expandBg: string };

const toolColors: Record<string, ToolColor> = {
  exec:       { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-300', icon: 'text-amber-400', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]', expandBorder: 'border-amber-500/20', expandBg: 'bg-amber-950/20' },
  web_search: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: 'text-emerald-400', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]', expandBorder: 'border-emerald-500/20', expandBg: 'bg-emerald-950/20' },
  web_fetch:  { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: 'text-emerald-400', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]', expandBorder: 'border-emerald-500/20', expandBg: 'bg-emerald-950/20' },
  Read:       { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-300', icon: 'text-sky-400', glow: 'shadow-[0_0_8px_rgba(14,165,233,0.15)]', expandBorder: 'border-sky-500/20', expandBg: 'bg-sky-950/20' },
  read:       { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-300', icon: 'text-sky-400', glow: 'shadow-[0_0_8px_rgba(14,165,233,0.15)]', expandBorder: 'border-sky-500/20', expandBg: 'bg-sky-950/20' },
  Write:      { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-300', icon: 'text-violet-400', glow: 'shadow-[0_0_8px_rgba(139,92,246,0.15)]', expandBorder: 'border-violet-500/20', expandBg: 'bg-violet-950/20' },
  write:      { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-300', icon: 'text-violet-400', glow: 'shadow-[0_0_8px_rgba(139,92,246,0.15)]', expandBorder: 'border-violet-500/20', expandBg: 'bg-violet-950/20' },
  Edit:       { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-300', icon: 'text-violet-400', glow: 'shadow-[0_0_8px_rgba(139,92,246,0.15)]', expandBorder: 'border-violet-500/20', expandBg: 'bg-violet-950/20' },
  edit:       { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-300', icon: 'text-violet-400', glow: 'shadow-[0_0_8px_rgba(139,92,246,0.15)]', expandBorder: 'border-violet-500/20', expandBg: 'bg-violet-950/20' },
  browser:    { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-pc-accent-light', icon: 'text-pc-accent', glow: 'shadow-[0_0_8px_rgba(6,182,212,0.15)]', expandBorder: 'border-cyan-500/20', expandBg: 'bg-cyan-950/20' },
  image:      { border: 'border-pink-500/30', bg: 'bg-pink-500/10', text: 'text-pink-300', icon: 'text-pink-400', glow: 'shadow-[0_0_8px_rgba(236,72,153,0.15)]', expandBorder: 'border-pink-500/20', expandBg: 'bg-pink-950/20' },
  message:    { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-300', icon: 'text-indigo-400', glow: 'shadow-[0_0_8px_rgba(99,102,241,0.15)]', expandBorder: 'border-indigo-500/20', expandBg: 'bg-indigo-950/20' },
  memory_search: { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-300', icon: 'text-rose-400', glow: 'shadow-[0_0_8px_rgba(244,63,94,0.15)]', expandBorder: 'border-rose-500/20', expandBg: 'bg-rose-950/20' },
  memory_get: { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-300', icon: 'text-rose-400', glow: 'shadow-[0_0_8px_rgba(244,63,94,0.15)]', expandBorder: 'border-rose-500/20', expandBg: 'bg-rose-950/20' },
  cron:       { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-300', icon: 'text-orange-400', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.15)]', expandBorder: 'border-orange-500/20', expandBg: 'bg-orange-950/20' },
  sessions_spawn: { border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-300', icon: 'text-teal-400', glow: 'shadow-[0_0_8px_rgba(20,184,166,0.15)]', expandBorder: 'border-teal-500/20', expandBg: 'bg-teal-950/20' },
};

const defaultColor: ToolColor = { border: 'border-pc-border-strong', bg: 'bg-pc-elevated/10', text: 'text-pc-text', icon: 'text-pc-text-secondary', glow: 'shadow-[0_0_8px_rgba(161,161,170,0.1)]', expandBorder: 'border-pc-border', expandBg: 'bg-pc-elevated/25' };

function getColor(name: string): ToolColor {
  return toolColors[name] || defaultColor;
}

const toolEmojis: Record<string, string> = {
  exec: '⚡',
  web_search: '🔍',
  web_fetch: '🌐',
  search: '🔍',
  Read: '📖',
  read: '📖',
  Write: '✏️',
  write: '✏️',
  Edit: '✏️',
  edit: '✏️',
  browser: '🌐',
  image: '🖼️',
  message: '💬',
  database: '🗄️',
  memory_search: '🧠',
  memory_get: '🧠',
  cron: '⏰',
  sessions_spawn: '🚀',
  sessions_send: '📨',
  sessions_list: '📋',
  sessions_history: '📜',
  session_status: '📊',
  tts: '🔊',
  gateway: '⚙️',
  canvas: '🎨',
  nodes: '📡',
  process: '⚙️',
  voice_call: '📞',
};

function getToolEmoji(name: string): string {
  return toolEmojis[name] || '🔧';
}

function truncateResult(result: string, maxLen = 120): string {
  if (!result) return '';
  return truncate(result, maxLen);
}

/** Check if text looks like structured content worth highlighting */
function isStructured(text: string): boolean {
  const lines = text.split('\n');
  if (lines.length < 2) return false;
  const trimmed = text.trim();
  // JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) return true;
  // Code patterns
  const codePatterns = [/^(import|export|const|let|var|function|class|fn|pub|use|def|from)\s/, /[{};]\s*$/, /^\s*(if|else|for|while|return)\b/, /^\s*(\/\/|#|\/\*)/, /=>\s*[{(]/, /^\s*<\/?[A-Z]/];
  let hits = 0;
  for (const line of lines) {
    for (const pat of codePatterns) {
      if (pat.test(line)) { hits++; break; }
    }
  }
  if (hits / lines.length > 0.2) return true;
  // Terminal output (paths, errors, commands)
  const termPatterns = [/^[/~]/, /^\s*\$\s/, /^[A-Z_]+=/, /error|warning|failed/i, /\.\w{1,4}:\d+/, /├|└|│/];
  let termHits = 0;
  for (const line of lines) {
    for (const pat of termPatterns) {
      if (pat.test(line)) { termHits++; break; }
    }
  }
  return termHits / lines.length > 0.3;
}

/** Highlight code using highlight.js, returns HTML string or null */
function highlightCode(text: string): string | null {
  if (!text || !isStructured(text)) return null;
  try {
    const result = hljs.highlightAuto(text);
    return result.value;
  } catch {
    return null;
  }
}

/** Toggle word-wrap on tool call content blocks. */
function WrapToggle({ wrap, onToggle }: { wrap: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="absolute top-2 right-8 p-1 rounded-lg bg-pc-elevated/60 hover:bg-pc-elevated/80 border border-pc-border-strong text-pc-text-secondary hover:text-pc-text opacity-0 group-hover/tc-block:opacity-100 transition-opacity duration-150"
      title={wrap ? 'No wrap' : 'Word wrap'}
      aria-label="Toggle word wrap"
      type="button"
    >
      {wrap ? <AlignLeft className="h-3 w-3" /> : <WrapText className="h-3 w-3" />}
    </button>
  );
}

/** Small copy-to-clipboard button for tool call content blocks. */
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
      className="absolute top-2 right-2 p-1 rounded-lg bg-pc-elevated/60 hover:bg-pc-elevated/80 border border-pc-border-strong text-pc-text-secondary hover:text-pc-text opacity-0 group-hover/tc-block:opacity-100 transition-opacity duration-150"
      title={copied ? 'Copied!' : 'Copy'}
      aria-label="Copy to clipboard"
      type="button"
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function HighlightedPre({ text, className, wrap }: { text: string; className: string; wrap?: boolean }) {
  const highlighted = useMemo(() => highlightCode(text), [text]);
  const wrapClass = wrap ? 'whitespace-pre-wrap break-words overflow-x-hidden' : '';

  if (highlighted) {
    return (
      <pre className={`${className} ${wrapClass}`}>
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    );
  }
  return <pre className={`${className} ${wrapClass}`}>{text}</pre>;
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function getContextHint(name: string, input: Record<string, unknown> | undefined): string | null {
  if (!input || typeof input !== 'object') return null;
  switch (name) {
    case 'exec':
      return str(input.command) ? truncate(str(input.command)!, 60) : null;
    case 'Read': case 'read':
    case 'Write': case 'write':
    case 'Edit': case 'edit':
      return str(input.file_path) || str(input.path) || null;
    case 'web_search':
      return str(input.query) ? truncate(str(input.query)!, 50) : null;
    case 'web_fetch':
      return str(input.url) ? truncate(str(input.url)!, 60) : null;
    case 'browser':
      return str(input.action) || null;
    case 'message': {
      const action = str(input.action);
      const target = str(input.target);
      return action ? `${action}${target ? ' → ' + target : ''}` : null;
    }
    case 'memory_search':
      return str(input.query) ? truncate(str(input.query)!, 50) : null;
    case 'memory_get':
      return str(input.path) || null;
    case 'cron':
      return str(input.action) || null;
    case 'sessions_spawn':
      return str(input.task) ? truncate(str(input.task)!, 50) : null;
    case 'image':
      return str(input.prompt) ? truncate(str(input.prompt)!, 50) : null;
    default:
      return null;
  }
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\n/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max) + '…';
}

/** Detect if a tool result contains a base64 image and extract it */
function extractImageFromResult(result: string): { src: string; remaining: string } | null {
  if (!result) return null;
  // Match "data:image/..." URLs
  const dataUrlMatch = result.match(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=\s]+)/);
  if (dataUrlMatch) {
    const src = dataUrlMatch[1].replace(/\s/g, '');
    const remaining = result.replace(dataUrlMatch[0], '').trim();
    return { src, remaining };
  }
  // Match raw base64 after image file markers (e.g. from Read tool returning an image)
  const readImageMatch = result.match(/^.*?\[image\/(png|jpeg|jpg|gif|webp)\].*$/m);
  if (readImageMatch) {
    const mediaType = `image/${readImageMatch[1]}`;
    // Look for a large base64 block after it
    const afterMarker = result.slice(result.indexOf(readImageMatch[0]) + readImageMatch[0].length);
    const b64Match = afterMarker.match(/([A-Za-z0-9+/=\n]{100,})/);
    if (b64Match) {
      const data = b64Match[1].replace(/\n/g, '');
      return { src: `data:${mediaType};base64,${data}`, remaining: readImageMatch[0] };
    }
  }
  return null;
}

export function ToolCall({ name, input, result }: { name: string; input?: Record<string, unknown>; result?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [wrap, setWrap] = useState(true);
  const { globalState, version } = useToolCollapse();
  const lastVersion = useRef(version);
  const c = getColor(name);

  // Respond to global collapse/expand commands
  useEffect(() => {
    if (version !== lastVersion.current) {
      lastVersion.current = version;
      if (globalState === 'collapse-all') setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: sync with global toggle
      else if (globalState === 'expand-all') setOpen(true);
    }
  }, [globalState, version]);

  const inputStr = input ? (typeof input === 'string' ? input : JSON.stringify(input, null, 2)) : '';
  const hint = getContextHint(name, input);

  return (
    <div className="my-2">
      {/* Tool use badge */}
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-2xl border ${c.border} ${c.bg} ${c.glow} px-3 py-1.5 text-xs ${c.text} hover:brightness-125 transition-all max-w-full`}
      >
        <span className="text-[13px] leading-none">{getToolEmoji(name)}</span>
        <span className="font-mono font-semibold shrink-0">{name}</span>
        {hint && <span className="opacity-60 truncate font-mono text-[11px]">{hint}</span>}
        {open ? <ChevronDown size={12} className="ml-1 opacity-60" /> : <ChevronRight size={12} className="ml-1 opacity-60" />}
      </button>

      {/* Result summary (always visible if result exists) */}
      {result && !open && (
        <div className="mt-1 text-[11px] text-pc-text-secondary pl-2 truncate max-w-full">
          {truncateResult(result)}
        </div>
      )}

      {/* Expanded content */}
      {open && (
        <div className={`mt-2 rounded-2xl border ${c.expandBorder} ${c.expandBg} p-3 space-y-2 overflow-hidden min-w-0`}>
          {inputStr && (
            <div>
              <div className={`text-[11px] ${c.text} opacity-70 mb-1 font-medium`}>{t('tool.parameters')}</div>
              <div className="group/tc-block relative">
                <HighlightedPre
                  text={inputStr}
                  className="text-xs bg-[var(--pc-bg-input)]/60 border border-pc-border p-2.5 rounded-xl overflow-x-auto text-pc-text font-mono"
                  wrap={wrap}
                />
                <WrapToggle wrap={wrap} onToggle={() => setWrap(!wrap)} />
                <CopyButton text={inputStr} />
              </div>
            </div>
          )}
          {result && (() => {
            const imageData = extractImageFromResult(result);
            return (
              <div>
                <div className={`text-[11px] ${c.text} opacity-70 mb-1 font-medium`}>{t('tool.result')}</div>
                {imageData ? (
                  <>
                    {imageData.remaining && (
                      <div className="group/tc-block relative">
                        <HighlightedPre
                          text={imageData.remaining}
                          className="text-xs bg-[var(--pc-bg-input)]/60 border border-pc-border p-2.5 rounded-xl overflow-x-auto text-pc-text font-mono mb-2"
                          wrap={wrap}
                        />
                        <WrapToggle wrap={wrap} onToggle={() => setWrap(!wrap)} />
                        <CopyButton text={imageData.remaining} />
                      </div>
                    )}
                    <ImageBlock src={imageData.src} alt={`${name} result`} />
                  </>
                ) : (
                  <div className="group/tc-block relative">
                    <HighlightedPre
                      text={result}
                      className="text-xs bg-[var(--pc-bg-input)]/60 border border-pc-border p-2.5 rounded-xl overflow-x-auto text-pc-text max-h-64 overflow-y-auto font-mono"
                      wrap={wrap}
                    />
                    <WrapToggle wrap={wrap} onToggle={() => setWrap(!wrap)} />
                    <CopyButton text={result} />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

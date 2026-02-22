import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { ChevronRight, ChevronDown, Check, Copy, WrapText, AlignLeft } from 'lucide-react';
import hljs from '../lib/highlight';
import { copyToClipboard } from '../lib/clipboard';
import { useT } from '../hooks/useLocale';
import { useTheme } from '../hooks/useTheme';
import { ImageBlock } from './ImageBlock';
import { useToolCollapse } from '../hooks/useToolCollapse';

type ToolColor = { border: string; bg: string; text: string; icon: string; glow: string; expandBorder: string; expandBg: string };

// RGB values for each tool color — used with rgba() for theme-safe rendering
type ToolRGB = { r: number; g: number; b: number };
const toolRGBs: Record<string, ToolRGB> = {
  exec:       { r: 245, g: 158, b: 11 },   // amber
  web_search: { r: 16, g: 185, b: 129 },    // emerald
  web_fetch:  { r: 16, g: 185, b: 129 },
  Read:       { r: 14, g: 165, b: 233 },    // sky
  read:       { r: 14, g: 165, b: 233 },
  Write:      { r: 139, g: 92, b: 246 },    // violet
  write:      { r: 139, g: 92, b: 246 },
  Edit:       { r: 139, g: 92, b: 246 },
  edit:       { r: 139, g: 92, b: 246 },
  browser:    { r: 6, g: 182, b: 212 },     // cyan
  image:      { r: 236, g: 72, b: 153 },    // pink
  message:    { r: 99, g: 102, b: 241 },    // indigo
  memory_search: { r: 244, g: 63, b: 94 },  // rose
  memory_get: { r: 244, g: 63, b: 94 },
  cron:       { r: 249, g: 115, b: 22 },    // orange
  sessions_spawn: { r: 20, g: 184, b: 166 },// teal
};
const defaultRGB: ToolRGB = { r: 161, g: 161, b: 170 }; // zinc

function rgbStr(c: ToolRGB): string { return `${c.r},${c.g},${c.b}`; }

function getColorStyles(name: string, isLight = false): { badge: React.CSSProperties; text: React.CSSProperties; expand: React.CSSProperties; glow: string } {
  const c = toolRGBs[name] || defaultRGB;
  const rgb = rgbStr(c);
  // Use darker text and higher bg opacity in light theme for readability
  const badgeBgAlpha = isLight ? 0.15 : 0.10;
  const expandBgAlpha = isLight ? 0.08 : 0.05;
  const textColor = isLight
    ? `rgb(${Math.round(c.r * 0.6)},${Math.round(c.g * 0.6)},${Math.round(c.b * 0.6)})`
    : `rgb(${c.r},${c.g},${c.b})`;
  return {
    badge: { borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},${badgeBgAlpha})` },
    text: { color: textColor },
    expand: { borderColor: `rgba(${rgb},0.2)`, backgroundColor: `rgba(${rgb},${expandBgAlpha})` },
    glow: `shadow-[0_0_8px_rgba(${rgb},0.15)]`,
  };
}

// Keep ToolColor type for compatibility but now only used for classes that are theme-safe
const toolColors: Record<string, ToolColor> = {};
const defaultColor: ToolColor = { border: '', bg: '', text: '', icon: '', glow: '', expandBorder: '', expandBg: '' };

// toolColors/defaultColor kept for potential future use
void toolColors; void defaultColor;

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
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    copyToClipboard(text).then((ok) => {
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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

export const ToolCall = memo(function ToolCall({ name, input, result }: { name: string; input?: Record<string, unknown>; result?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [wrap, setWrap] = useState(true);
  const { globalState, version } = useToolCollapse();
  const { resolvedTheme } = useTheme();
  const lastVersion = useRef(version);
  const cs = getColorStyles(name, resolvedTheme === 'light');

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
        className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs hover:brightness-125 transition-all max-w-full ${cs.glow}`}
        style={{ ...cs.badge, ...cs.text }}
        aria-expanded={open}
        aria-label={`${name}${hint ? ` — ${hint}` : ''}: ${open ? 'collapse' : 'expand'} details`}
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
        <div className="mt-2 rounded-2xl border p-3 space-y-2 overflow-hidden min-w-0" style={cs.expand}>
          {inputStr && (
            <div>
              <div className="text-[11px] opacity-70 mb-1 font-medium" style={cs.text}>{t('tool.parameters')}</div>
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
                <div className="text-[11px] opacity-70 mb-1 font-medium" style={cs.text}>{t('tool.result')}</div>
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
});

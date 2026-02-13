import { useState, useCallback, type HTMLAttributes, type ReactElement } from 'react';
import { Check, Copy, Hash } from 'lucide-react';

/** Extract the language from the nested <code> element's className (e.g. "language-ts"). */
function extractLanguage(children: React.ReactNode): string | null {
  const codeEl = children as ReactElement<{ className?: string }> | undefined;
  const className = codeEl?.props?.className;
  if (typeof className !== 'string') return null;
  const match = className.match(/language-(\S+)/);
  return match ? match[1] : null;
}

/** Pretty-print common language identifiers. */
const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  rb: 'Ruby',
  rs: 'Rust',
  go: 'Go',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  yml: 'YAML',
  yaml: 'YAML',
  md: 'Markdown',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  dockerfile: 'Dockerfile',
  toml: 'TOML',
};

function formatLanguage(lang: string): string {
  return LANGUAGE_LABELS[lang] || lang;
}

/**
 * Custom <pre> renderer for ReactMarkdown.
 * Wraps code blocks with a language label and a floating copy button.
 */
const LINE_NUMBER_KEY = 'pinchchat-line-numbers';
const LINE_THRESHOLD = 3; // Only show line numbers for blocks with more than this many lines

export function CodeBlock(props: HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(() => {
    const stored = localStorage.getItem(LINE_NUMBER_KEY);
    return stored === null ? true : stored === 'true';
  });
  const language = extractLanguage(props.children);

  const code = (props.children as ReactElement<{ children?: string }> | undefined)?.props?.children;
  const lines = typeof code === 'string' ? code.replace(/\n$/, '').split('\n') : [];
  const hasEnoughLines = lines.length > LINE_THRESHOLD;

  const handleCopy = useCallback(() => {
    if (typeof code === 'string') {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [code]);

  const toggleLineNumbers = useCallback(() => {
    setShowLineNumbers(prev => {
      const next = !prev;
      localStorage.setItem(LINE_NUMBER_KEY, String(next));
      return next;
    });
  }, []);

  const shouldShowNumbers = showLineNumbers && hasEnoughLines;

  return (
    <div className="group/code relative">
      {language && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-pc-elevated/80 border-b border-pc-border rounded-t-lg text-[11px] text-pc-text-muted font-mono select-none">
          <span>{formatLanguage(language)}</span>
          {hasEnoughLines && (
            <button
              onClick={toggleLineNumbers}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-pc-border/40 transition-colors text-pc-text-muted hover:text-pc-text-secondary"
              title={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
              type="button"
            >
              <Hash className="h-3 w-3" />
              <span className="text-[10px]">{lines.length}</span>
            </button>
          )}
        </div>
      )}
      {shouldShowNumbers ? (
        <div className={`flex ${language ? 'rounded-t-none' : 'rounded-lg'} overflow-hidden`}>
          <div
            className="flex-shrink-0 select-none text-right pr-3 pl-3 py-4 text-[11px] leading-[1.7142857] font-mono text-pc-text-muted/40 bg-pc-elevated/40 border-r border-pc-border/50"
            aria-hidden="true"
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre {...props} className={`${props.className || ''} flex-1 !rounded-none !mt-0 min-w-0`} />
        </div>
      ) : (
        <pre {...props} className={`${props.className || ''} ${language ? '!rounded-t-none !mt-0' : ''}`} />
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-pc-elevated/60 hover:bg-pc-elevated/80 border border-pc-border-strong text-pc-text-secondary hover:text-pc-text opacity-0 group-hover/code:opacity-100 transition-opacity duration-150"
        title="Copy code"
        aria-label="Copy code to clipboard"
        type="button"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-green-400" />
          : <Copy className="h-3.5 w-3.5" />
        }
      </button>
    </div>
  );
}

import { forwardRef, useRef, useEffect, useImperativeHandle, useCallback } from 'react';

/**
 * A textarea with a syntax-highlighted backdrop overlay.
 * The textarea text is transparent; a <pre> behind it renders colored tokens.
 */

interface Props extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  value: string;
  highlightEnabled?: boolean;
}

// Simple markdown tokenizer — returns HTML with <span> wrappers
function highlightMarkdown(text: string): string {
  if (!text) return '\n'; // pre needs at least a newline to size correctly

  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks: ```...```
  html = html.replace(/(```[\s\S]*?```)/g, '<span class="ht-code-block">$1</span>');

  // Inline code: `...`  (but not inside code blocks — already wrapped)
  html = html.replace(/(?<!<span class="ht-code-block">[\s\S]*?)(`[^`\n]+?`)/g, '<span class="ht-inline-code">$1</span>');

  // Bold: **...**
  html = html.replace(/(\*\*[^*]+?\*\*)/g, '<span class="ht-bold">$1</span>');

  // Italic: *...* (single, not inside bold)
  html = html.replace(/(?<!\*)(\*[^*\n]+?\*)(?!\*)/g, '<span class="ht-italic">$1</span>');

  // Headers at line start: # ...
  html = html.replace(/(^|\n)(#{1,6}\s[^\n]*)/g, '$1<span class="ht-heading">$2</span>');

  // Links: [text](url)
  html = html.replace(/(\[[^\]]*\]\([^)]*\))/g, '<span class="ht-link">$1</span>');

  // Ensure trailing newline for proper sizing
  if (!html.endsWith('\n')) html += '\n';

  return html;
}

export const HighlightedTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, highlightEnabled = true, className = '', ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLPreElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    // Sync scroll
    const syncScroll = useCallback(() => {
      if (textareaRef.current && backdropRef.current) {
        backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }, []);

    useEffect(() => {
      syncScroll();
    }, [value, syncScroll]);

    if (!highlightEnabled) {
      return (
        <textarea
          ref={textareaRef}
          value={value}
          className={className}
          {...props}
        />
      );
    }

    return (
      <div className="ht-container relative flex-1 min-w-0">
        <pre
          ref={backdropRef}
          className={`ht-backdrop ${className}`}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightMarkdown(value) }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          className={`ht-textarea ${className}`}
          onScroll={syncScroll}
          {...props}
        />
      </div>
    );
  }
);

HighlightedTextarea.displayName = 'HighlightedTextarea';

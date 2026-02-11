import { useState, useCallback, type HTMLAttributes } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Custom <pre> renderer for ReactMarkdown.
 * Wraps code blocks with a floating copy button.
 */
export function CodeBlock(props: HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    // Extract text from the nested <code> element
    const code = (props.children as React.ReactElement<{ children?: string }> | undefined)?.props?.children;
    if (typeof code === 'string') {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [props.children]);

  return (
    <div className="group/code relative">
      <pre {...props} />
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-700/60 hover:bg-zinc-600/80 border border-white/10 text-zinc-400 hover:text-zinc-200 opacity-0 group-hover/code:opacity-100 transition-opacity duration-150"
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

import { lazy, Suspense } from 'react';
import type { Components } from 'react-markdown';
import type { PluggableList } from 'unified';

const ReactMarkdown = lazy(() => import('react-markdown'));

// Pre-load plugins so they're ready when ReactMarkdown renders
let _remarkPlugins: PluggableList | null = null;
let _rehypePlugins: PluggableList | null = null;
let _pluginsReady = false;

const pluginsPromise = Promise.all([
  import('remark-gfm').then(m => m.default),
  import('remark-breaks').then(m => m.default),
  import('rehype-highlight').then(m => m.default),
  import('../lib/highlight').then(m => m.rehypeHighlightOptions),
]).then(([remarkGfm, remarkBreaks, rehypeHighlight, rehypeHighlightOptions]) => {
  _remarkPlugins = [remarkGfm, remarkBreaks];
  _rehypePlugins = [[rehypeHighlight, rehypeHighlightOptions]];
  _pluginsReady = true;
});

// Trigger plugin loading immediately
void pluginsPromise;

interface LazyMarkdownProps {
  children: string;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  components?: Components;
}

function MarkdownInner({ children, remarkPlugins, rehypePlugins, components }: LazyMarkdownProps) {
  const remark = remarkPlugins ?? (_pluginsReady ? _remarkPlugins! : []);
  const rehype = rehypePlugins ?? (_pluginsReady ? _rehypePlugins! : []);

  return (
    <ReactMarkdown remarkPlugins={remark} rehypePlugins={rehype} components={components}>
      {children}
    </ReactMarkdown>
  );
}

export function LazyMarkdown(props: LazyMarkdownProps) {
  return (
    <Suspense fallback={<span className="opacity-50">{props.children.slice(0, 200)}</span>}>
      <MarkdownInner {...props} />
    </Suspense>
  );
}

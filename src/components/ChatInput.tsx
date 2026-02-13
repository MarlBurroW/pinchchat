import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Send, Square, Paperclip, X, FileText, Eye, EyeOff } from 'lucide-react';
import { useT } from '../hooks/useLocale';

const ReactMarkdown = lazy(() => import('react-markdown'));
const remarkGfm = import('remark-gfm').then(m => m.default);
let _remarkGfm: typeof import('remark-gfm').default | null = null;
remarkGfm.then(p => { _remarkGfm = p; });

interface FileAttachment {
  id: string;
  file: File;
  base64: string; // raw base64 (no data: prefix)
  mimeType: string;
  preview?: string; // data url thumbnail for images
}

interface Props {
  onSend: (text: string, attachments?: Array<{ mimeType: string; fileName: string; content: string }>) => void;
  onAbort: () => void;
  isGenerating: boolean;
  disabled: boolean;
  sessionKey?: string;
}

const MAX_BASE64_CHARS = 300 * 1024; // ~225KB real, well under 512KB WS limit (JSON overhead + base64 bloat)
const MAX_IMAGE_PIXELS = 1280; // Max dimension for resize

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(file: File, maxBase64Chars: number): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      // Downscale if needed
      if (width > MAX_IMAGE_PIXELS || height > MAX_IMAGE_PIXELS) {
        const ratio = Math.min(MAX_IMAGE_PIXELS / width, MAX_IMAGE_PIXELS / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try JPEG at decreasing quality until base64 length is under limit
      for (let q = 0.85; q >= 0.2; q -= 0.05) {
        const dataUrl = canvas.toDataURL('image/jpeg', q);
        const b64 = dataUrl.split(',')[1] || '';
        if (b64.length <= maxBase64Chars) {
          return resolve({ base64: b64, mimeType: 'image/jpeg' });
        }
      }
      // Last resort: further downscale
      const scale = 0.5;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
      resolve({ base64: dataUrl.split(',')[1] || '', mimeType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function ChatInput({ onSend, onAbort, isGenerating, disabled, sessionKey }: Props) {
  const t = useT();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(() => localStorage.getItem('pinchchat-md-preview') === '1');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-session draft storage
  const draftsRef = useRef<Map<string, string>>(new Map());
  const prevSessionRef = useRef<string | undefined>(sessionKey);

  // Save draft to previous session and restore draft for new session
  useEffect(() => {
    const prev = prevSessionRef.current;
    // Save current text as draft for the previous session
    if (prev && prev !== sessionKey) {
      const currentText = textareaRef.current?.value ?? text;
      if (currentText.trim()) {
        draftsRef.current.set(prev, currentText);
      } else {
        draftsRef.current.delete(prev);
      }
    }
    // Restore draft for the new session
    const draft = sessionKey ? draftsRef.current.get(sessionKey) ?? '' : '';
    setText(draft);
    prevSessionRef.current = sessionKey;
  }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  // Auto-focus textarea when session changes or connection becomes active
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      // Small delay to let the DOM settle after session switch
      const timer = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [sessionKey, disabled]);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileAttachment[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > 20 * 1024 * 1024) continue; // 20MB max
      const isImage = file.type.startsWith('image/');
      let base64: string;
      let mimeType: string;
      if (isImage) {
        // Compress images to fit WS payload limit
        const compressed = await compressImage(file, MAX_BASE64_CHARS);
        base64 = compressed.base64;
        mimeType = compressed.mimeType;
      } else {
        base64 = await fileToBase64(file);
        mimeType = file.type || 'application/octet-stream';
      }
      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        base64,
        mimeType,
        preview: isImage ? `data:${mimeType};base64,${base64}` : undefined,
      });
    }
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || disabled) return;
    const attachments = files.length > 0 ? files.map(f => ({
      mimeType: f.mimeType,
      fileName: f.file.name,
      content: f.base64,
    })) : undefined;
    onSend(trimmed || ' ', attachments);
    setText('');
    setFiles([]);
    // Clear draft for this session after sending
    if (sessionKey) draftsRef.current.delete(sessionKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pastedFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      addFiles(pastedFiles);
    }
  }, [addFiles]);

  // Drag & drop handlers on the wrapper
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  return (
    <div
      className="border-t border-pc-border bg-[var(--pc-bg-input)]/60 backdrop-blur-xl p-4"
      role="form"
      aria-label={t('chat.inputLabel')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-3xl border bg-[var(--pc-bg-surface)]/40 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-colors ${isDragOver ? 'border-[var(--pc-accent-dim)] bg-[var(--pc-accent-glow)]' : 'border-pc-border'}`}>
          {/* File previews */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-1">
              {files.map(f => (
                <div key={f.id} className="group relative flex items-center gap-2 rounded-2xl border border-pc-border bg-pc-elevated/50 px-3 py-2 text-xs text-pc-text-secondary">
                  {f.preview ? (
                    <img src={f.preview} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <FileText size={16} className="text-pc-text-muted shrink-0" />
                  )}
                  <div className="min-w-0 max-w-[120px]">
                    <div className="truncate text-pc-text">{f.file.name}</div>
                    <div className="text-[10px] text-pc-text-muted">{formatSize(f.file.size)}</div>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-pc-elevated border border-pc-border-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <X size={10} className="text-pc-text" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Markdown preview */}
          {showPreview && text.trim() && (
            <div className="mb-3 px-1 max-h-[200px] overflow-y-auto rounded-2xl border border-pc-border bg-pc-elevated/30 p-3 text-sm text-pc-text prose prose-invert prose-sm max-w-none [&_pre]:bg-pc-elevated [&_pre]:rounded-lg [&_pre]:p-2 [&_code]:text-cyan-300 [&_a]:text-cyan-400">
              <Suspense fallback={<span className="text-pc-text-muted text-xs">Loading…</span>}>
                <ReactMarkdown remarkPlugins={_remarkGfm ? [_remarkGfm] : []}>{text}</ReactMarkdown>
              </Suspense>
            </div>
          )}

          <div className="flex items-end gap-3">
            {/* File picker button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="shrink-0 h-11 w-11 rounded-2xl border border-pc-border bg-pc-elevated/30 flex items-center justify-center text-pc-text-secondary hover:text-pc-accent-light hover:bg-[var(--pc-hover)] transition-colors disabled:opacity-30"
              title={t('chat.attachFile')}
              aria-label={t('chat.attachFile')}
            >
              <Paperclip size={18} />
            </button>
            {/* Markdown preview toggle */}
            <button
              onClick={() => setShowPreview(v => { const next = !v; localStorage.setItem('pinchchat-md-preview', next ? '1' : '0'); return next; })}
              className={`shrink-0 h-11 w-11 rounded-2xl border border-pc-border bg-pc-elevated/30 flex items-center justify-center transition-colors ${showPreview ? 'text-pc-accent-light bg-[var(--pc-accent-glow)]' : 'text-pc-text-secondary hover:text-pc-accent-light hover:bg-[var(--pc-hover)]'}`}
              title={showPreview ? t('chat.hidePreview') : t('chat.showPreview')}
              aria-label={showPreview ? t('chat.hidePreview') : t('chat.showPreview')}
            >
              {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
              accept="image/*,.pdf,.txt,.md,.json,.csv,.log,.py,.js,.ts,.tsx,.jsx,.html,.css,.yaml,.yml,.xml,.sql,.sh,.env,.toml"
            />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={t('chat.inputPlaceholder')}
              aria-label={t('chat.inputLabel')}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent resize-none rounded-2xl border border-pc-border bg-pc-input/35 px-4 py-3 text-sm text-pc-text placeholder:text-pc-text-muted outline-none focus:ring-2 focus:ring-[var(--pc-accent-dim)] transition-all max-h-[200px]"
            />
            {isGenerating ? (
              <button
                onClick={onAbort}
                className="shrink-0 h-11 px-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
              >
                <Square size={16} />
                <span className="text-sm hidden sm:inline">{t('chat.stop')}</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={(!text.trim() && files.length === 0) || disabled}
                aria-label={t('chat.send')}
                className="shrink-0 h-11 px-5 rounded-2xl bg-gradient-to-r from-cyan-500/80 via-indigo-500/70 to-violet-500/80 text-pc-text font-semibold text-sm hover:opacity-90 shadow-[0_8px_24px_rgba(34,211,238,0.1)] disabled:opacity-30 disabled:shadow-none transition-all flex items-center gap-2"
              >
                <Send size={16} />
                <span className="hidden sm:inline">{t('chat.send')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

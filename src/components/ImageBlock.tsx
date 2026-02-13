import { useState, useEffect, useCallback } from 'react';
import { X, ImageOff } from 'lucide-react';

interface ImageBlockProps {
  src: string;
  alt?: string;
}

function Lightbox({ src, alt, onClose }: ImageBlockProps & { onClose: () => void }) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-4 right-4 p-2 rounded-full bg-pc-elevated/80 border border-pc-border-strong text-pc-text hover:text-white hover:bg-pc-elevated/80 transition-colors"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt={alt || 'Image'}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function ImageBlock({ src, alt }: ImageBlockProps) {
  const [lightbox, setLightbox] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div className="my-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-pc-border bg-pc-elevated/50 text-pc-muted text-sm">
        <ImageOff size={16} className="shrink-0 opacity-60" />
        <span>{alt || 'Image failed to load'}</span>
      </div>
    );
  }

  return (
    <>
      <div className="my-2">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={`View ${alt || 'image'} full size`}
          className="block rounded-xl border border-pc-border cursor-pointer hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--pc-accent-dim)]"
        >
          {loading && (
            <div className="w-48 h-32 rounded-xl bg-pc-elevated/50 animate-pulse" />
          )}
          <img
            src={src}
            alt={alt || 'Image'}
            className={`max-w-full max-h-80 rounded-xl${loading ? ' hidden' : ''}`}
            loading="lazy"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </button>
      </div>
      {lightbox && <Lightbox src={src} alt={alt} onClose={() => setLightbox(false)} />}
    </>
  );
}

// buildImageSrc moved to ../lib/image.ts

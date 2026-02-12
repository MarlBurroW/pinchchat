import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useT } from '../hooks/useLocale';

interface Props {
  open: boolean;
  onClose: () => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-lg border border-white/10 bg-zinc-800/80 text-xs font-mono text-zinc-300 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-1.5">{keys}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mt-4 mb-1 first:mt-0">
      {children}
    </div>
  );
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

export function KeyboardShortcuts({ open, onClose }: Props) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={t('shortcuts.title')} className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-3xl border border-white/8 bg-[var(--pc-bg-base)]/95 backdrop-blur-xl shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <Keyboard size={18} className="text-cyan-300/70" />
            <h2 className="text-sm font-semibold text-zinc-200">{t('shortcuts.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
            aria-label={t('shortcuts.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 divide-y divide-white/5">
          <div className="pb-3">
            <SectionTitle>{t('shortcuts.chatSection')}</SectionTitle>
            <ShortcutRow
              keys={<Kbd>Enter</Kbd>}
              label={t('shortcuts.send')}
            />
            <ShortcutRow
              keys={<><Kbd>Shift</Kbd><span className="text-zinc-600">+</span><Kbd>Enter</Kbd></>}
              label={t('shortcuts.newline')}
            />
            <ShortcutRow
              keys={<Kbd>Esc</Kbd>}
              label={t('shortcuts.stop')}
            />
          </div>

          <div className="py-3">
            <SectionTitle>{t('shortcuts.navigationSection')}</SectionTitle>
            <ShortcutRow
              keys={<><Kbd>{mod}</Kbd><span className="text-zinc-600">+</span><Kbd>K</Kbd></>}
              label={t('shortcuts.search')}
            />
            <ShortcutRow
              keys={<><Kbd>Alt</Kbd><span className="text-zinc-600">+</span><Kbd>↑</Kbd><span className="text-zinc-600">/</span><Kbd>↓</Kbd></>}
              label={t('shortcuts.switchSession')}
            />
            <ShortcutRow
              keys={<Kbd>Esc</Kbd>}
              label={t('shortcuts.closeSidebar')}
            />
          </div>

          <div className="pt-3">
            <SectionTitle>{t('shortcuts.generalSection')}</SectionTitle>
            <ShortcutRow
              keys={<Kbd>?</Kbd>}
              label={t('shortcuts.help')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, type ThemeName, type AccentColor } from '../contexts/ThemeContext';
import { useT } from '../hooks/useLocale';

import type { TranslationKey } from '../lib/i18n';

const themeOptions: { value: ThemeName; icon: typeof Sun; labelKey: TranslationKey }[] = [
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'oled', icon: Monitor, labelKey: 'theme.oled' },
];

const accentOptions: { value: AccentColor; color: string }[] = [
  { value: 'cyan', color: '#22d3ee' },
  { value: 'violet', color: '#8b5cf6' },
  { value: 'emerald', color: '#10b981' },
  { value: 'amber', color: '#f59e0b' },
  { value: 'rose', color: '#f43f5e' },
  { value: 'blue', color: '#3b82f6' },
];

export function ThemeSwitcher() {
  const { theme, accent, setTheme, setAccent } = useTheme();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-bg-elevated)]/30 px-2.5 py-1.5 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text-secondary)] hover:bg-[var(--pc-bg-elevated)]/50 transition-colors"
        title={t('theme.title')}
      >
        <Palette size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border border-[var(--pc-border-strong)] bg-[var(--pc-bg-surface)] backdrop-blur-xl shadow-2xl p-3 animate-fade-in">
          <div className="text-[10px] uppercase tracking-wider text-[var(--pc-text-faint)] font-semibold mb-2">
            {t('theme.mode')}
          </div>
          <div className="flex gap-1.5 mb-3">
            {themeOptions.map(opt => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs transition-all ${
                    active
                      ? 'border-[var(--pc-accent)]/40 bg-[var(--pc-accent)]/10 text-[var(--pc-accent-light)]'
                      : 'border-[var(--pc-border)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-bg-elevated)]/50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--pc-text-faint)] font-semibold mb-2">
            {t('theme.accent')}
          </div>
          <div className="flex gap-2 justify-center">
            {accentOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAccent(opt.value)}
                className="relative h-7 w-7 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  backgroundColor: opt.color,
                  borderColor: accent === opt.value ? opt.color : 'transparent',
                  boxShadow: accent === opt.value ? `0 0 8px ${opt.color}40` : 'none',
                }}
                title={opt.value}
              >
                {accent === opt.value && <Check size={14} className="text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

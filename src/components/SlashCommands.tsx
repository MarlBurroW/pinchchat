import { useState, useEffect, useCallback, useRef } from 'react';
import { useT } from '../hooks/useLocale';
import type { TranslationKey } from '../lib/i18n';

export interface SlashCommand {
  command: string;
  args?: string;
  descKey: TranslationKey;
}

const COMMANDS: SlashCommand[] = [
  { command: '/new', descKey: 'slash.new' },
  { command: '/status', descKey: 'slash.status' },
  { command: '/reasoning', args: 'on|off|stream', descKey: 'slash.reasoning' },
  { command: '/verbose', args: 'on|off', descKey: 'slash.verbose' },
  { command: '/model', args: '<model>', descKey: 'slash.model' },
  { command: '/compact', descKey: 'slash.compact' },
  { command: '/reset', descKey: 'slash.reset' },
  { command: '/help', descKey: 'slash.help' },
];

interface Props {
  query: string;
  visible: boolean;
  onSelect: (command: string) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ query, visible, onSelect, onClose }: Props) {
  const t = useT();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter(cmd =>
    cmd.command.startsWith(query.toLowerCase().split(' ')[0] || '/')
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: reset index on query change
  }, [query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (filtered.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        const cmd = filtered[selectedIndex];
        onSelect(cmd.args ? cmd.command + ' ' : cmd.command);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [visible, filtered, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [visible, handleKeyDown]);

  useEffect(() => {
    if (menuRef.current) {
      const item = menuRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 right-0 mb-2 mx-3 max-h-[200px] overflow-y-auto rounded-2xl border border-pc-border bg-[var(--pc-bg-surface)] backdrop-blur-xl shadow-lg z-50"
      role="listbox"
      aria-label={t('slash.commands')}
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.command}
          role="option"
          aria-selected={i === selectedIndex}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
            i === selectedIndex
              ? 'bg-[var(--pc-accent-glow)] text-pc-text'
              : 'text-pc-text-secondary hover:bg-[var(--pc-hover)]'
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(cmd.args ? cmd.command + ' ' : cmd.command);
          }}
          onMouseEnter={() => setSelectedIndex(i)}
        >
          <span className="font-mono font-semibold text-pc-accent-light">{cmd.command}</span>
          {cmd.args && <span className="text-xs text-pc-text-muted font-mono">{cmd.args}</span>}
          <span className="ml-auto text-xs text-pc-text-muted">{t(cmd.descKey)}</span>
        </button>
      ))}
    </div>
  );
}

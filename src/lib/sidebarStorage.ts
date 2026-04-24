import type { Session } from '../types';

export const PINNED_KEY = 'pinchchat-pinned-sessions';
export const WIDTH_KEY = 'pinchchat-sidebar-width';
export const ORDER_KEY = 'pinchchat-session-order';
export const FILTER_KEY = 'pinchchat-session-filter';
export const AGENT_FILTER_KEY = 'pinchchat-session-agent-filter';
export const NAMES_KEY = 'pinchchat-session-names';
export const FAVORITES_KEY = 'pinchchat-favorite-sessions';

export const MIN_WIDTH = 220;
export const MAX_WIDTH = 480;
export const DEFAULT_WIDTH = 288; // w-72

export function getCustomNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* noop */ }
  return {};
}

export function saveCustomNames(names: Record<string, string>): void {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names));
  } catch { /* noop */ }
}

/** Detect the category of a session for filtering */
export function sessionCategory(s: Session): string {
  if (s.key.includes(':cron:')) return 'cron';
  if (s.key.includes(':spawn:') || s.key.includes(':sub:')) return 'agent';
  const ch = s.channel?.toLowerCase();
  if (ch && ch !== 'webchat') return ch;
  return 'other';
}

/** Get unique categories present in sessions */
export function getAvailableCategories(sessions: Session[]): string[] {
  const cats = new Set<string>();
  for (const s of sessions) cats.add(sessionCategory(s));
  return Array.from(cats).sort();
}

/** Pretty label for category */
export function categoryLabel(cat: string): string {
  if (cat === 'cron') return 'Cron';
  if (cat === 'agent') return 'Agents';
  if (cat === 'other') return 'Chat';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function getSavedWidth(): number {
  try {
    const v = localStorage.getItem(WIDTH_KEY);
    if (v) {
      const n = Number(v);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
    }
  } catch { /* noop */ }
  return DEFAULT_WIDTH;
}

export function getPinnedSessions(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* noop */ }
  return new Set();
}

export function savePinnedSessions(pinned: Set<string>): void {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify([...pinned]));
  } catch { /* noop */ }
}

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* noop */ }
  return new Set();
}

export function saveFavorites(favs: Set<string>): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
  } catch { /* noop */ }
}

export function getSavedOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* noop */ }
  return [];
}

export function saveOrder(order: string[]): void {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch { /* noop */ }
}

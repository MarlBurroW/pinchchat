import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type ThemeName = 'dark' | 'light' | 'oled';
export type AccentColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue';

interface ThemeContextValue {
  theme: ThemeName;
  accent: AccentColor;
  setTheme: (t: ThemeName) => void;
  setAccent: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  accent: 'cyan',
  setTheme: () => {},
  setAccent: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'pinchchat-theme';

interface StoredTheme {
  theme: ThemeName;
  accent: AccentColor;
}

const themes: Record<ThemeName, Record<string, string>> = {
  dark: {
    '--pc-bg-base': '#1e1e24',
    '--pc-bg-surface': '#232329',
    '--pc-bg-elevated': '#27272a',
    '--pc-bg-input': '#1a1a20',
    '--pc-bg-sidebar': 'rgba(30,30,36,0.95)',
    '--pc-bg-code': '#1a1a20',
    '--pc-border': 'rgba(255,255,255,0.08)',
    '--pc-border-strong': 'rgba(255,255,255,0.1)',
    '--pc-text-primary': '#d4d4d8',
    '--pc-text-secondary': '#a1a1aa',
    '--pc-text-muted': '#71717a',
    '--pc-text-faint': '#52525b',
    '--pc-scrollbar-thumb': '#52525b',
    '--pc-scrollbar-track': '#27272a',
    '--pc-scrollbar-thumb-hover': '#71717a',
    '--pc-user-bubble': 'rgba(34,211,238,0.06)',
    '--pc-user-border': 'rgba(34,211,238,0.15)',
  },
  light: {
    '--pc-bg-base': '#f4f4f5',
    '--pc-bg-surface': '#ffffff',
    '--pc-bg-elevated': '#e4e4e7',
    '--pc-bg-input': '#ffffff',
    '--pc-bg-sidebar': 'rgba(255,255,255,0.95)',
    '--pc-bg-code': '#f4f4f5',
    '--pc-border': 'rgba(0,0,0,0.08)',
    '--pc-border-strong': 'rgba(0,0,0,0.12)',
    '--pc-text-primary': '#18181b',
    '--pc-text-secondary': '#3f3f46',
    '--pc-text-muted': '#71717a',
    '--pc-text-faint': '#a1a1aa',
    '--pc-scrollbar-thumb': '#a1a1aa',
    '--pc-scrollbar-track': '#e4e4e7',
    '--pc-scrollbar-thumb-hover': '#71717a',
    '--pc-user-bubble': 'rgba(34,211,238,0.08)',
    '--pc-user-border': 'rgba(34,211,238,0.25)',
  },
  oled: {
    '--pc-bg-base': '#000000',
    '--pc-bg-surface': '#0a0a0a',
    '--pc-bg-elevated': '#141414',
    '--pc-bg-input': '#0a0a0a',
    '--pc-bg-sidebar': 'rgba(0,0,0,0.95)',
    '--pc-bg-code': '#0a0a0a',
    '--pc-border': 'rgba(255,255,255,0.06)',
    '--pc-border-strong': 'rgba(255,255,255,0.08)',
    '--pc-text-primary': '#d4d4d8',
    '--pc-text-secondary': '#a1a1aa',
    '--pc-text-muted': '#71717a',
    '--pc-text-faint': '#3f3f46',
    '--pc-scrollbar-thumb': '#3f3f46',
    '--pc-scrollbar-track': '#0a0a0a',
    '--pc-scrollbar-thumb-hover': '#52525b',
    '--pc-user-bubble': 'rgba(34,211,238,0.05)',
    '--pc-user-border': 'rgba(34,211,238,0.12)',
  },
};

const accents: Record<AccentColor, Record<string, string>> = {
  cyan: {
    '--pc-accent': '#22d3ee',
    '--pc-accent-light': '#67e8f9',
    '--pc-accent-dim': 'rgba(34,211,238,0.3)',
    '--pc-accent-glow': 'rgba(34,211,238,0.1)',
    '--pc-accent-rgb': '34,211,238',
  },
  violet: {
    '--pc-accent': '#8b5cf6',
    '--pc-accent-light': '#a78bfa',
    '--pc-accent-dim': 'rgba(139,92,246,0.3)',
    '--pc-accent-glow': 'rgba(139,92,246,0.1)',
    '--pc-accent-rgb': '139,92,246',
  },
  emerald: {
    '--pc-accent': '#10b981',
    '--pc-accent-light': '#34d399',
    '--pc-accent-dim': 'rgba(16,185,129,0.3)',
    '--pc-accent-glow': 'rgba(16,185,129,0.1)',
    '--pc-accent-rgb': '16,185,129',
  },
  amber: {
    '--pc-accent': '#f59e0b',
    '--pc-accent-light': '#fbbf24',
    '--pc-accent-dim': 'rgba(245,158,11,0.3)',
    '--pc-accent-glow': 'rgba(245,158,11,0.1)',
    '--pc-accent-rgb': '245,158,11',
  },
  rose: {
    '--pc-accent': '#f43f5e',
    '--pc-accent-light': '#fb7185',
    '--pc-accent-dim': 'rgba(244,63,94,0.3)',
    '--pc-accent-glow': 'rgba(244,63,94,0.1)',
    '--pc-accent-rgb': '244,63,94',
  },
  blue: {
    '--pc-accent': '#3b82f6',
    '--pc-accent-light': '#60a5fa',
    '--pc-accent-dim': 'rgba(59,130,246,0.3)',
    '--pc-accent-glow': 'rgba(59,130,246,0.1)',
    '--pc-accent-rgb': '59,130,246',
  },
};

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

function loadStored(): StoredTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.theme in themes && parsed.accent in accents) return parsed;
    }
  } catch {}
  return { theme: 'dark', accent: 'cyan' };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [stored] = useState(loadStored);
  const [theme, setThemeState] = useState<ThemeName>(stored.theme);
  const [accent, setAccentState] = useState<AccentColor>(stored.accent);

  const persist = useCallback((t: ThemeName, a: AccentColor) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: t, accent: a }));
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    applyVars(themes[t]);
    persist(t, accent);
  }, [accent, persist]);

  const setAccent = useCallback((a: AccentColor) => {
    setAccentState(a);
    applyVars(accents[a]);
    persist(theme, a);
  }, [theme, persist]);

  // Apply on mount
  useEffect(() => {
    applyVars({ ...themes[theme], ...accents[accent] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Lightweight reactive i18n — no external deps.
 *
 * Locale priority: localStorage > VITE_LOCALE > navigator.language > 'en'
 * Changing locale at runtime triggers subscribed React components to re-render.
 */

const STORAGE_KEY = 'pinchchat-locale';

const en = {
  // Login screen
  'login.title': 'PinchChat',
  'login.subtitle': 'Connect to your OpenClaw gateway',
  'login.gatewayUrl': 'Gateway URL',
  'login.token': 'Token',
  'login.tokenPlaceholder': 'Enter your gateway token',
  'login.connect': 'Connect',
  'login.connecting': 'Connecting…',
  'login.showToken': 'Show token',
  'login.hideToken': 'Hide token',
  'login.storedLocally': 'Credentials are stored locally in your browser',

  // Header
  'header.title': 'PinchChat',
  'header.connected': 'Connected',
  'header.disconnected': 'Disconnected',
  'header.logout': 'Logout',
  'header.toggleSidebar': 'Toggle sidebar',
  'header.changeLanguage': 'Change language',

  // Chat
  'chat.welcome': 'PinchChat',
  'chat.welcomeSub': 'Send a message to get started',
  'chat.inputPlaceholder': 'Type a message…',
  'chat.inputLabel': 'Message',
  'chat.attachFile': 'Attach file',
  'chat.send': 'Send',
  'chat.stop': 'Stop',
  'chat.scrollToBottom': 'New messages',
  'chat.messages': 'Chat messages',

  // Sidebar
  'sidebar.title': 'Sessions',
  'sidebar.empty': 'No sessions',
  'sidebar.search': 'Search sessions…',
  'sidebar.noResults': 'No matching sessions',

  // Thinking
  'thinking.label': 'Thinking',

  // Tool call
  'tool.parameters': 'Parameters',
  'tool.result': 'Result',

  // Connection banner
  'connection.reconnecting': 'Connection lost — reconnecting…',
  'connection.reconnected': 'Reconnected!',

  // Message actions
  'message.copy': 'Copy message',
  'message.copied': 'Copied!',

  // Timestamps
  'time.yesterday': 'Yesterday',

  // Keyboard shortcuts
  'shortcuts.title': 'Keyboard Shortcuts',
  'shortcuts.send': 'Send message',
  'shortcuts.newline': 'New line',
  'shortcuts.search': 'Search sessions',
  'shortcuts.closeSidebar': 'Close sidebar / search',
  'shortcuts.stop': 'Stop generation',
  'shortcuts.help': 'Show shortcuts',
  'shortcuts.close': 'Close',
  'shortcuts.chatSection': 'Chat',
  'shortcuts.navigationSection': 'Navigation',
  'shortcuts.generalSection': 'General',
} as const;

const fr: Record<keyof typeof en, string> = {
  'login.title': 'PinchChat',
  'login.subtitle': 'Connectez-vous à votre gateway OpenClaw',
  'login.gatewayUrl': 'URL de la gateway',
  'login.token': 'Token',
  'login.tokenPlaceholder': 'Entrez votre token gateway',
  'login.connect': 'Connexion',
  'login.connecting': 'Connexion…',
  'login.showToken': 'Afficher le token',
  'login.hideToken': 'Masquer le token',
  'login.storedLocally': 'Les identifiants sont stockés localement dans votre navigateur',

  'header.title': 'PinchChat',
  'header.connected': 'Connecté',
  'header.disconnected': 'Déconnecté',
  'header.logout': 'Déconnexion',
  'header.toggleSidebar': 'Afficher/masquer la barre latérale',
  'header.changeLanguage': 'Changer de langue',

  'chat.welcome': 'PinchChat',
  'chat.welcomeSub': 'Envoyez un message pour commencer',
  'chat.inputPlaceholder': 'Tapez un message…',
  'chat.inputLabel': 'Message',
  'chat.attachFile': 'Joindre un fichier',
  'chat.send': 'Envoyer',
  'chat.stop': 'Arrêter',
  'chat.scrollToBottom': 'Nouveaux messages',
  'chat.messages': 'Messages du chat',

  'sidebar.title': 'Sessions',
  'sidebar.empty': 'Aucune session',
  'sidebar.search': 'Rechercher…',
  'sidebar.noResults': 'Aucun résultat',

  'thinking.label': 'Réflexion',

  'tool.parameters': 'Paramètres',
  'tool.result': 'Résultat',

  'connection.reconnecting': 'Connexion perdue — reconnexion…',
  'connection.reconnected': 'Reconnecté !',

  'message.copy': 'Copier le message',
  'message.copied': 'Copié !',

  'time.yesterday': 'Hier',

  'shortcuts.title': 'Raccourcis clavier',
  'shortcuts.send': 'Envoyer le message',
  'shortcuts.newline': 'Nouvelle ligne',
  'shortcuts.search': 'Rechercher des sessions',
  'shortcuts.closeSidebar': 'Fermer la barre / recherche',
  'shortcuts.stop': 'Arrêter la génération',
  'shortcuts.help': 'Afficher les raccourcis',
  'shortcuts.close': 'Fermer',
  'shortcuts.chatSection': 'Chat',
  'shortcuts.navigationSection': 'Navigation',
  'shortcuts.generalSection': 'Général',
};

export type TranslationKey = keyof typeof en;

const messages: Record<string, Record<string, string>> = { en, fr };

export const supportedLocales = Object.keys(messages) as string[];

/** Labels shown in the language selector */
export const localeLabels: Record<string, string> = {
  en: 'EN',
  fr: 'FR',
};

function resolveInitialLocale(): string {
  // 1. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && messages[stored]) return stored;
  } catch { /* SSR or blocked storage */ }

  // 2. VITE_LOCALE env var
  const envLocale = (import.meta.env.VITE_LOCALE as string) || '';
  if (envLocale && messages[envLocale]) return envLocale;

  // 3. navigator.language
  if (typeof navigator !== 'undefined') {
    const navLang = navigator.language?.split('-')[0];
    if (navLang && messages[navLang]) return navLang;
  }

  // 4. fallback
  return 'en';
}

let currentLocale = resolveInitialLocale();
let dict = messages[currentLocale] || messages.en;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to locale changes. Returns unsubscribe function. */
export function onLocaleChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Get the current locale code */
export function getLocale(): string {
  return currentLocale;
}

/** Switch locale at runtime. Persists to localStorage and notifies subscribers. */
export function setLocale(loc: string): void {
  if (!messages[loc] || loc === currentLocale) return;
  currentLocale = loc;
  dict = messages[loc];
  try { localStorage.setItem(STORAGE_KEY, loc); } catch { /* noop */ }
  listeners.forEach((fn) => fn());
}

/** Return the translated string for the given key, falling back to English. */
export function t(key: TranslationKey): string {
  return dict[key] ?? (messages.en as Record<string, string>)[key] ?? key;
}

// Keep backward-compat named export
export { currentLocale as locale };

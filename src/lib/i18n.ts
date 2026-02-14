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
  'login.wsHint': 'URL must start with ws:// or wss://',

  // Header
  'header.title': 'PinchChat',
  'header.connected': 'Connected',
  'header.disconnected': 'Disconnected',
  'header.logout': 'Logout',
  'header.toggleSidebar': 'Toggle sidebar',
  'header.changeLanguage': 'Change language',
  'header.soundOn': 'Enable notification sound',
  'header.soundOff': 'Disable notification sound',

  // Chat
  'chat.welcome': 'PinchChat',
  'chat.welcomeSub': 'Send a message to get started',
  'chat.suggestions': 'Try asking...',
  'chat.suggestion1': 'Summarize my recent emails',
  'chat.suggestion2': "What's on my calendar today?",
  'chat.suggestion3': 'Search the web for latest news',
  'chat.suggestion4': 'Help me write a script',
  'chat.loadingHistory': 'Loading messages…',
  'chat.inputPlaceholder': 'Type a message…',
  'chat.inputLabel': 'Message',
  'chat.attachFile': 'Attach file',
  'chat.send': 'Send',
  'chat.stop': 'Stop',
  'chat.showPreview': 'Preview markdown',
  'chat.hidePreview': 'Hide preview',
  'chat.scrollToBottom': 'New messages',
  'chat.scrollDown': 'Scroll to bottom',
  'chat.collapseTools': 'Collapse all tools',
  'chat.expandTools': 'Expand all tools',
  'chat.messages': 'Chat messages',
  'chat.thinking': 'Thinking…',

  // Sidebar
  'sidebar.title': 'Sessions',
  'sidebar.empty': 'No sessions',
  'sidebar.search': 'Search sessions…',
  'sidebar.noResults': 'No matching sessions',
  'sidebar.pin': 'Pin session',
  'sidebar.unpin': 'Unpin session',
  'sidebar.pinned': 'Pinned',
  'sidebar.delete': 'Delete session',
  'sidebar.deleteConfirm': 'Delete this session? This cannot be undone.',
  'sidebar.deleteCancel': 'Cancel',
  'sidebar.openSplit': 'Open in split view',
  'sidebar.close': 'Close sidebar',
  'sidebar.clearSearch': 'Clear search',
  'sidebar.filterAll': 'All',
  'sidebar.filterActive': 'Active',
  'split.close': 'Close split view',
  'app.mainChat': 'Main chat',
  'app.splitPane': 'Split pane',
  'app.skipToChat': 'Skip to chat input',

  // Thinking
  'thinking.label': 'Thinking',
  'thinking.reasoning': 'Reasoning…',

  // Tool call
  'tool.parameters': 'Parameters',
  'tool.result': 'Result',

  // Connection banner
  'connection.reconnecting': 'Connection lost — reconnecting…',
  'connection.reconnected': 'Reconnected!',

  // Message actions
  'message.copy': 'Copy message',
  'message.copied': 'Copied!',
  'message.retry': 'Resend message',
  'message.metadata': 'Message details',
  'message.rawJson': 'Raw JSON',
  'message.hideRawJson': 'Hide raw JSON',

  // Timestamps
  'time.yesterday': 'Yesterday',
  'time.today': 'Today',

  // Keyboard shortcuts
  'shortcuts.title': 'Keyboard Shortcuts',
  'shortcuts.send': 'Send message',
  'shortcuts.newline': 'New line',
  'shortcuts.search': 'Search sessions',
  'shortcuts.switchSession': 'Previous / next session',
  'shortcuts.closeSidebar': 'Close sidebar / search',
  'shortcuts.stop': 'Stop generation',
  'shortcuts.help': 'Show shortcuts',
  'shortcuts.close': 'Close',
  'shortcuts.chatSection': 'Chat',

  // Error boundary
  'error.title': 'Something went wrong',
  'error.description': 'An unexpected error occurred while rendering the interface. You can try again or reload the page.',
  'error.retry': 'Try again',
  'error.reload': 'Reload page',
  'shortcuts.navigationSection': 'Navigation',
  'shortcuts.generalSection': 'General',

  // Export
  'header.export': 'Export conversation as Markdown',
  'header.compact': 'Compact',
  'header.compacting': 'Compacting…',
  'header.sessionInfo': 'Session Info',
  'sessionInfo.sessionKey': 'Session Key',
  'sessionInfo.channel': 'Channel',
  'sessionInfo.kind': 'Kind',
  'sessionInfo.model': 'Model',
  'sessionInfo.agent': 'Agent',
  'sessionInfo.messages': 'Messages',
  'sessionInfo.totalTokens': 'Total Tokens',
  'sessionInfo.inputTokens': 'Input',
  'sessionInfo.outputTokens': 'Output',
  'sessionInfo.contextWindow': 'Context',
  'sessionInfo.lastActive': 'Last Active',

  // Theme
  'theme.title': 'Theme',
  'theme.mode': 'Mode',
  'theme.accent': 'Accent',
  'theme.system': 'System',
  'theme.dark': 'Dark',
  'theme.light': 'Light',
  'theme.oled': 'OLED',

  // Message search
  'search.placeholder': 'Search messages…',
  'search.noResults': '0 results',
  'search.prev': 'Previous match',
  'search.next': 'Next match',
  'shortcuts.searchMessages': 'Search messages',

  // Send shortcut setting
  'settings.sendShortcut': 'Send with',
  'settings.sendEnter': 'Enter',
  'settings.sendCtrlEnter': 'Ctrl+Enter',

  // Bookmarks
  'message.bookmark': 'Bookmark message',
  'message.removeBookmark': 'Remove bookmark',
  'chat.bookmarks': 'Bookmarks',
  'chat.export': 'Export conversation',
  'chat.contextCompacted': 'Context compacted — older messages cached locally',
  'slash.commands': 'Commands',
  'slash.status': 'Show session status & usage',
  'slash.reasoning': 'Toggle reasoning mode',
  'slash.verbose': 'Toggle verbose output',
  'slash.model': 'Switch model for this session',
  'slash.compact': 'Compact conversation context',
  'slash.reset': 'Reset the session',
  'slash.help': 'Show available commands',
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
  'login.wsHint': 'L\'URL doit commencer par ws:// ou wss://',

  'header.title': 'PinchChat',
  'header.connected': 'Connecté',
  'header.disconnected': 'Déconnecté',
  'header.logout': 'Déconnexion',
  'header.toggleSidebar': 'Afficher/masquer la barre latérale',
  'header.changeLanguage': 'Changer de langue',
  'header.soundOn': 'Activer le son de notification',
  'header.soundOff': 'Désactiver le son de notification',

  'chat.welcome': 'PinchChat',
  'chat.welcomeSub': 'Envoyez un message pour commencer',
  'chat.suggestions': 'Essayez par exemple...',
  'chat.suggestion1': 'Résume mes derniers emails',
  'chat.suggestion2': "Qu'est-ce que j'ai au calendrier aujourd'hui ?",
  'chat.suggestion3': 'Cherche sur le web les dernières actus',
  'chat.suggestion4': "Aide-moi à écrire un script",
  'chat.loadingHistory': 'Chargement des messages…',
  'chat.inputPlaceholder': 'Tapez un message…',
  'chat.inputLabel': 'Message',
  'chat.attachFile': 'Joindre un fichier',
  'chat.send': 'Envoyer',
  'chat.stop': 'Arrêter',
  'chat.showPreview': 'Aperçu markdown',
  'chat.hidePreview': 'Masquer l\'aperçu',
  'chat.scrollToBottom': 'Nouveaux messages',
  'chat.scrollDown': 'Défiler en bas',
  'chat.collapseTools': 'Replier tous les outils',
  'chat.expandTools': 'Déplier tous les outils',
  'chat.messages': 'Messages du chat',
  'chat.thinking': 'Réflexion…',

  'sidebar.title': 'Sessions',
  'sidebar.empty': 'Aucune session',
  'sidebar.search': 'Rechercher…',
  'sidebar.noResults': 'Aucun résultat',
  'sidebar.pin': 'Épingler la session',
  'sidebar.unpin': 'Désépingler la session',
  'sidebar.pinned': 'Épinglées',
  'sidebar.delete': 'Supprimer la session',
  'sidebar.deleteConfirm': 'Supprimer cette session ? Cette action est irréversible.',
  'sidebar.deleteCancel': 'Annuler',
  'sidebar.openSplit': 'Ouvrir en vue scindée',
  'sidebar.close': 'Fermer la barre latérale',
  'sidebar.clearSearch': 'Effacer la recherche',
  'sidebar.filterAll': 'Tout',
  'sidebar.filterActive': 'Actives',
  'split.close': 'Fermer la vue scindée',
  'app.mainChat': 'Chat principal',
  'app.splitPane': 'Volet scindé',
  'app.skipToChat': 'Aller au champ de saisie',

  'thinking.label': 'Réflexion',
  'thinking.reasoning': 'Réflexion…',

  'tool.parameters': 'Paramètres',
  'tool.result': 'Résultat',

  'connection.reconnecting': 'Connexion perdue — reconnexion…',
  'connection.reconnected': 'Reconnecté !',

  'message.copy': 'Copier le message',
  'message.copied': 'Copié !',
  'message.retry': 'Renvoyer le message',
  'message.metadata': 'Détails du message',
  'message.rawJson': 'JSON brut',
  'message.hideRawJson': 'Masquer le JSON brut',

  'time.yesterday': 'Hier',
  'time.today': "Aujourd'hui",

  'shortcuts.title': 'Raccourcis clavier',
  'shortcuts.send': 'Envoyer le message',
  'shortcuts.newline': 'Nouvelle ligne',
  'shortcuts.search': 'Rechercher des sessions',
  'shortcuts.switchSession': 'Session précédente / suivante',
  'shortcuts.closeSidebar': 'Fermer la barre / recherche',
  'shortcuts.stop': 'Arrêter la génération',
  'shortcuts.help': 'Afficher les raccourcis',
  'shortcuts.close': 'Fermer',
  'shortcuts.chatSection': 'Chat',

  'error.title': 'Quelque chose s\'est mal passé',
  'error.description': 'Une erreur inattendue est survenue lors de l\'affichage. Vous pouvez réessayer ou recharger la page.',
  'error.retry': 'Réessayer',
  'error.reload': 'Recharger',
  'shortcuts.navigationSection': 'Navigation',
  'shortcuts.generalSection': 'Général',

  'header.export': 'Exporter la conversation en Markdown',
  'header.compact': 'Compacter',
  'header.compacting': 'Compaction…',
  'header.sessionInfo': 'Infos session',
  'sessionInfo.sessionKey': 'Clé session',
  'sessionInfo.channel': 'Canal',
  'sessionInfo.kind': 'Type',
  'sessionInfo.model': 'Modèle',
  'sessionInfo.agent': 'Agent',
  'sessionInfo.messages': 'Messages',
  'sessionInfo.totalTokens': 'Tokens total',
  'sessionInfo.inputTokens': 'Entrée',
  'sessionInfo.outputTokens': 'Sortie',
  'sessionInfo.contextWindow': 'Contexte',
  'sessionInfo.lastActive': 'Dernière activité',

  'theme.title': 'Thème',
  'theme.mode': 'Mode',
  'theme.accent': 'Accent',
  'theme.system': 'Système',
  'theme.dark': 'Sombre',
  'theme.light': 'Clair',
  'theme.oled': 'OLED',

  'search.placeholder': 'Rechercher dans les messages…',
  'search.noResults': '0 résultat',
  'search.prev': 'Résultat précédent',
  'search.next': 'Résultat suivant',
  'shortcuts.searchMessages': 'Rechercher dans les messages',

  'settings.sendShortcut': 'Envoyer avec',
  'settings.sendEnter': 'Entrée',
  'settings.sendCtrlEnter': 'Ctrl+Entrée',

  'message.bookmark': 'Marquer le message',
  'message.removeBookmark': 'Retirer le marque-page',
  'chat.bookmarks': 'Marque-pages',
  'chat.export': 'Exporter la conversation',
  'chat.contextCompacted': 'Contexte compacté — anciens messages en cache local',
  'slash.commands': 'Commandes',
  'slash.status': 'Afficher le statut et l\'utilisation',
  'slash.reasoning': 'Activer/désactiver le raisonnement',
  'slash.verbose': 'Activer/désactiver le mode verbeux',
  'slash.model': 'Changer de modèle pour cette session',
  'slash.compact': 'Compacter le contexte',
  'slash.reset': 'Réinitialiser la session',
  'slash.help': 'Afficher les commandes disponibles',
};

const es: Record<keyof typeof en, string> = {
  'login.title': 'PinchChat',
  'login.subtitle': 'Conéctate a tu gateway OpenClaw',
  'login.gatewayUrl': 'URL del gateway',
  'login.token': 'Token',
  'login.tokenPlaceholder': 'Introduce tu token de gateway',
  'login.connect': 'Conectar',
  'login.connecting': 'Conectando…',
  'login.showToken': 'Mostrar token',
  'login.hideToken': 'Ocultar token',
  'login.storedLocally': 'Las credenciales se guardan localmente en tu navegador',
  'login.wsHint': 'La URL debe empezar con ws:// o wss://',

  'header.title': 'PinchChat',
  'header.connected': 'Conectado',
  'header.disconnected': 'Desconectado',
  'header.logout': 'Cerrar sesión',
  'header.toggleSidebar': 'Mostrar/ocultar barra lateral',
  'header.changeLanguage': 'Cambiar idioma',
  'header.soundOn': 'Activar sonido de notificación',
  'header.soundOff': 'Desactivar sonido de notificación',

  'chat.welcome': 'PinchChat',
  'chat.welcomeSub': 'Envía un mensaje para comenzar',
  'chat.suggestions': 'Prueba a preguntar...',
  'chat.suggestion1': 'Resume mis últimos correos',
  'chat.suggestion2': '¿Qué tengo en el calendario hoy?',
  'chat.suggestion3': 'Busca en la web las últimas noticias',
  'chat.suggestion4': 'Ayúdame a escribir un script',
  'chat.loadingHistory': 'Cargando mensajes…',
  'chat.inputPlaceholder': 'Escribe un mensaje…',
  'chat.inputLabel': 'Mensaje',
  'chat.attachFile': 'Adjuntar archivo',
  'chat.send': 'Enviar',
  'chat.stop': 'Detener',
  'chat.showPreview': 'Vista previa markdown',
  'chat.hidePreview': 'Ocultar vista previa',
  'chat.scrollToBottom': 'Nuevos mensajes',
  'chat.scrollDown': 'Ir al final',
  'chat.collapseTools': 'Contraer todas las herramientas',
  'chat.expandTools': 'Expandir todas las herramientas',
  'chat.messages': 'Mensajes del chat',
  'chat.thinking': 'Pensando…',

  'sidebar.title': 'Sesiones',
  'sidebar.empty': 'Sin sesiones',
  'sidebar.search': 'Buscar sesiones…',
  'sidebar.noResults': 'Sin resultados',
  'sidebar.pin': 'Fijar sesión',
  'sidebar.unpin': 'Desfijar sesión',
  'sidebar.pinned': 'Fijadas',
  'sidebar.delete': 'Eliminar sesión',
  'sidebar.deleteConfirm': '¿Eliminar esta sesión? Esta acción no se puede deshacer.',
  'sidebar.deleteCancel': 'Cancelar',
  'sidebar.openSplit': 'Abrir en vista dividida',
  'sidebar.close': 'Cerrar barra lateral',
  'sidebar.clearSearch': 'Limpiar búsqueda',
  'sidebar.filterAll': 'Todas',
  'sidebar.filterActive': 'Activas',
  'split.close': 'Cerrar vista dividida',
  'app.mainChat': 'Chat principal',
  'app.splitPane': 'Panel dividido',
  'app.skipToChat': 'Ir al campo de entrada',

  'thinking.label': 'Pensamiento',
  'thinking.reasoning': 'Razonando…',

  'tool.parameters': 'Parámetros',
  'tool.result': 'Resultado',

  'connection.reconnecting': 'Conexión perdida — reconectando…',
  'connection.reconnected': '¡Reconectado!',

  'message.copy': 'Copiar mensaje',
  'message.copied': '¡Copiado!',
  'message.retry': 'Reenviar mensaje',
  'message.metadata': 'Detalles del mensaje',
  'message.rawJson': 'JSON sin formato',
  'message.hideRawJson': 'Ocultar JSON sin formato',

  'time.yesterday': 'Ayer',
  'time.today': 'Hoy',

  'shortcuts.title': 'Atajos de teclado',
  'shortcuts.send': 'Enviar mensaje',
  'shortcuts.newline': 'Nueva línea',
  'shortcuts.search': 'Buscar sesiones',
  'shortcuts.switchSession': 'Sesión anterior / siguiente',
  'shortcuts.closeSidebar': 'Cerrar barra / búsqueda',
  'shortcuts.stop': 'Detener generación',
  'shortcuts.help': 'Mostrar atajos',
  'shortcuts.close': 'Cerrar',
  'shortcuts.chatSection': 'Chat',

  'error.title': 'Algo salió mal',
  'error.description': 'Ocurrió un error inesperado al mostrar la interfaz. Puedes intentar de nuevo o recargar la página.',
  'error.retry': 'Reintentar',
  'error.reload': 'Recargar página',
  'shortcuts.navigationSection': 'Navegación',
  'shortcuts.generalSection': 'General',

  'header.export': 'Exportar conversación como Markdown',
  'header.compact': 'Compactar',
  'header.compacting': 'Compactando…',
  'header.sessionInfo': 'Info de sesión',
  'sessionInfo.sessionKey': 'Clave de sesión',
  'sessionInfo.channel': 'Canal',
  'sessionInfo.kind': 'Tipo',
  'sessionInfo.model': 'Modelo',
  'sessionInfo.agent': 'Agente',
  'sessionInfo.messages': 'Mensajes',
  'sessionInfo.totalTokens': 'Tokens totales',
  'sessionInfo.inputTokens': 'Entrada',
  'sessionInfo.outputTokens': 'Salida',
  'sessionInfo.contextWindow': 'Contexto',
  'sessionInfo.lastActive': 'Última actividad',

  'theme.title': 'Tema',
  'theme.mode': 'Modo',
  'theme.accent': 'Acento',
  'theme.system': 'Sistema',
  'theme.dark': 'Oscuro',
  'theme.light': 'Claro',
  'theme.oled': 'OLED',

  'search.placeholder': 'Buscar en mensajes…',
  'search.noResults': '0 resultados',
  'search.prev': 'Resultado anterior',
  'search.next': 'Resultado siguiente',
  'shortcuts.searchMessages': 'Buscar en mensajes',

  'settings.sendShortcut': 'Enviar con',
  'settings.sendEnter': 'Enter',
  'settings.sendCtrlEnter': 'Ctrl+Enter',

  'message.bookmark': 'Marcar mensaje',
  'message.removeBookmark': 'Quitar marcador',
  'chat.bookmarks': 'Marcadores',
  'chat.export': 'Exportar conversación',
  'chat.contextCompacted': 'Contexto compactado — mensajes anteriores en caché local',
  'slash.commands': 'Comandos',
  'slash.status': 'Mostrar estado y uso de la sesión',
  'slash.reasoning': 'Activar/desactivar razonamiento',
  'slash.verbose': 'Activar/desactivar modo detallado',
  'slash.model': 'Cambiar modelo para esta sesión',
  'slash.compact': 'Compactar contexto de conversación',
  'slash.reset': 'Reiniciar la sesión',
  'slash.help': 'Mostrar comandos disponibles',
};

export type TranslationKey = keyof typeof en;

const messages: Record<string, Record<string, string>> = { en, fr, es };

export const supportedLocales = Object.keys(messages) as string[];

/** Labels shown in the language selector */
export const localeLabels: Record<string, string> = {
  en: 'EN',
  fr: 'FR',
  es: 'ES',
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

// Sync <html lang> on initial load
try { document.documentElement.lang = currentLocale; } catch { /* SSR */ }

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
  try { document.documentElement.lang = loc; } catch { /* SSR */ }
  listeners.forEach((fn) => fn());
}

/** Return the translated string for the given key, falling back to English. */
export function t(key: TranslationKey): string {
  return dict[key] ?? (messages.en as Record<string, string>)[key] ?? key;
}

// Keep backward-compat named export
export { currentLocale as locale };

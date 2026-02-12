import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useGateway } from './hooks/useGateway';
import { useNotifications, setBaseTitle } from './hooks/useNotifications';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { ConnectionBanner } from './components/ConnectionBanner';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { ToolCollapseProvider } from './contexts/ToolCollapseContext';

const Chat = lazy(() => import('./components/Chat').then(m => ({ default: m.Chat })));

export default function App() {
  const {
    status, messages, sessions, activeSession, isGenerating, isLoadingHistory,
    sendMessage, abort, switchSession, deleteSession,
    authenticated, login, logout, connectError, isConnecting, agentIdentity,
  } = useGateway();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { notify, soundEnabled, toggleSound } = useNotifications();
  const prevMessageCountRef = useRef(messages.length);

  // Notify on new assistant messages when tab is not focused
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (messages.length > prevCount) {
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant' && !last.isStreaming) {
        const preview = last.content?.slice(0, 100) || 'New message';
        notify('PinchChat', preview);
      }
    }
  }, [messages, notify]);

  // Update document title with active session label
  useEffect(() => {
    const session = sessions.find(s => s.key === activeSession);
    setBaseTitle(session?.label || session?.key);
    return () => setBaseTitle(undefined);
  }, [activeSession, sessions]);

  // Keyboard shortcuts: Escape, ?, Alt+↑/↓ for session navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && sidebarOpen) {
      setSidebarOpen(false);
    }
    // Open shortcuts help with ? (only when not typing in an input)
    if (e.key === '?' && !shortcutsOpen) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      setShortcutsOpen(true);
    }
    // Alt+↑ / Alt+↓ — switch to previous/next session
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (sessions.length < 2) return;
      const idx = sessions.findIndex(s => s.key === activeSession);
      if (idx === -1) return;
      const next = e.key === 'ArrowUp'
        ? (idx - 1 + sessions.length) % sessions.length
        : (idx + 1) % sessions.length;
      switchSession(sessions[next].key);
    }
  }, [sidebarOpen, shortcutsOpen, sessions, activeSession, switchSession]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Still checking stored credentials
  if (authenticated === null) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[var(--pc-bg-base)] text-zinc-500">
        <div className="animate-pulse text-sm">Connecting…</div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!authenticated) {
    return <LoginScreen onConnect={login} error={connectError} isConnecting={isConnecting} />;
  }

  return (
    <ToolCollapseProvider>
    <div className="h-dvh flex overflow-x-hidden bg-[var(--pc-bg-base)] text-zinc-300 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_50%),radial_gradient(ellipse_at_bottom_right,rgba(99,102,241,0.04),transparent_50%)]" role="application" aria-label="PinchChat">
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        onSwitch={switchSession}
        onDelete={deleteSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0" aria-hidden={sidebarOpen ? true : undefined}>
        <Header status={status} sessionKey={activeSession} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} activeSessionData={sessions.find(s => s.key === activeSession)} onLogout={logout} soundEnabled={soundEnabled} onToggleSound={toggleSound} messages={messages} agentAvatarUrl={agentIdentity?.avatar} />
        <ConnectionBanner status={status} />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><div className="animate-pulse text-sm">Loading…</div></div>}>
          <Chat messages={messages} isGenerating={isGenerating} isLoadingHistory={isLoadingHistory} status={status} sessionKey={activeSession} onSend={sendMessage} onAbort={abort} agentAvatarUrl={agentIdentity?.avatar} />
        </Suspense>
      </div>
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
    </ToolCollapseProvider>
  );
}

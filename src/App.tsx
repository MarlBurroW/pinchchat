import { useState } from 'react';
import { useGateway } from './hooks/useGateway';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { LoginScreen } from './components/LoginScreen';
import { ConnectionBanner } from './components/ConnectionBanner';

export default function App() {
  const {
    status, messages, sessions, activeSession, isGenerating,
    sendMessage, abort, switchSession,
    authenticated, login, logout, connectError, isConnecting,
  } = useGateway();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Still checking stored credentials
  if (authenticated === null) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#1e1e24] text-zinc-500">
        <div className="animate-pulse text-sm">Connecting…</div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!authenticated) {
    return <LoginScreen onConnect={login} error={connectError} isConnecting={isConnecting} />;
  }

  return (
    <div className="h-dvh flex bg-[#1e1e24] text-zinc-300 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_50%),radial_gradient(ellipse_at_bottom_right,rgba(99,102,241,0.04),transparent_50%)]" role="application" aria-label="PinchChat">
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        onSwitch={switchSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header status={status} sessionKey={activeSession} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} activeSessionData={sessions.find(s => s.key === activeSession)} onLogout={logout} />
        <ConnectionBanner status={status} />
        <Chat messages={messages} isGenerating={isGenerating} status={status} onSend={sendMessage} onAbort={abort} />
      </div>
    </div>
  );
}

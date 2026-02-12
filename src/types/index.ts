export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  blocks: MessageBlock[];
  isStreaming?: boolean;
  runId?: string;
  isSystemEvent?: boolean;
}

export type MessageBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool_use'; name: string; input: Record<string, unknown>; id?: string }
  | { type: 'tool_result'; content: string; toolUseId?: string; name?: string }
  | { type: 'image'; mediaType: string; data?: string; url?: string };

export interface Session {
  key: string;
  label?: string;
  messageCount?: number;
  isActive?: boolean;
  hasUnread?: boolean;
  totalTokens?: number;
  contextTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  channel?: string;
  kind?: string;
  model?: string;
  agentId?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface GatewayState {
  status: ConnectionStatus;
  sessions: Session[];
  activeSession: string;
  messages: ChatMessage[];
  isGenerating: boolean;
}

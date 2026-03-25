export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  blocks: MessageBlock[];
  isStreaming?: boolean;
  runId?: string;
  isSystemEvent?: boolean;
  metadata?: Record<string, unknown>;
  /** Optimistic send status for user messages */
  sendStatus?: 'sending' | 'sent' | 'error';
  /** Timestamp (ms) when streaming started for this message */
  streamStartedAt?: number;
  /** Total generation time in milliseconds (set when streaming ends) */
  generationTimeMs?: number;
  /** True if this message was restored from local cache (pre-compaction) */
  isArchived?: boolean;
  /** True if this is a visual separator showing where compaction occurred */
  isCompactionSeparator?: boolean;
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
  unreadCount?: number;
  totalTokens?: number;
  contextTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  channel?: string;
  kind?: string;
  model?: string;
  agentId?: string;
  updatedAt?: number;
  lastMessagePreview?: string;
}

export interface AgentIdentity {
  name?: string;
  emoji?: string;
  avatar?: string;
  agentId?: string;
}

export interface ExecApproval {
  id: string;
  command: string;
  commandArgv: string[];
  cwd: string;
  agentId: string;
  sessionKey: string;
  expiresAtMs: number;
  resolvedPath?: string;
  commandPreview?: string;
}

export type ExecApprovalDecision = 'allow-once' | 'allow-always' | 'deny';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'pairing';

export interface GatewayState {
  status: ConnectionStatus;
  sessions: Session[];
  activeSession: string;
  messages: ChatMessage[];
  isGenerating: boolean;
}

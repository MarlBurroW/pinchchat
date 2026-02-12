import { useState, useEffect, useRef, useCallback } from 'react';
import { GatewayClient, type JsonPayload } from '../lib/gateway';
import { genIdempotencyKey } from '../lib/utils';
import { getStoredCredentials, storeCredentials, clearCredentials } from '../lib/credentials';
import type { ChatMessage, MessageBlock, ConnectionStatus, Session } from '../types';

interface ChatPayloadMessage {
  content?: string | Array<{ type: string; text?: string }>;
}

function extractText(message: ChatPayloadMessage | undefined): string {
  if (!message) return '';
  const content = message.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('\n');
  }
  return '';
}

export function useGateway() {
  const clientRef = useRef<GatewayClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState('agent:main:main');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null); // null = checking
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const isConnectingRef = useRef(false);
  const messagesRef = useRef(messages);
  const activeSessionRef = useRef(activeSession);

  // Sync refs in an effect to avoid ref writes during render
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);
  const currentRunIdRef = useRef<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<Set<string>>(new Set());
  const [unreadSessions, setUnreadSessions] = useState<Set<string>>(new Set());

  const handleAgentEvent = useCallback((payload: JsonPayload) => {
    if (payload?.stream !== 'tool') return;
    const data = (payload.data ?? {}) as Record<string, unknown>;
    const phase = data.phase as string | undefined;
    const toolCallId = data.toolCallId as string | undefined;
    const name = (data.name as string) || 'tool';
    if (!toolCallId) return;

    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant' || !last.isStreaming) return prev;

      const updated = { ...last, blocks: [...last.blocks] };

      if (phase === 'start') {
        updated.blocks.push({
          type: 'tool_use' as const,
          name,
          input: (data.args as Record<string, unknown>) ?? {},
          id: toolCallId,
        });
      } else if (phase === 'result') {
        const rawResult = data.result;
        const result = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult, null, 2);
        updated.blocks.push({
          type: 'tool_result' as const,
          content: result?.slice(0, 500) || '',
          toolUseId: toolCallId,
          name,
        });
      }

      return [...prev.slice(0, -1), updated];
    });
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await clientRef.current?.send('sessions.list', {});
      const sessionList = res?.sessions as Array<Record<string, unknown>> | undefined;
      if (sessionList) {
        setSessions(sessionList.map((s) => ({
          key: (s.key || s.sessionKey) as string,
          label: (s.label || s.key || s.sessionKey) as string,
          messageCount: s.messageCount as number | undefined,
          totalTokens: s.totalTokens as number | undefined,
          contextTokens: s.contextTokens as number | undefined,
          inputTokens: s.inputTokens as number | undefined,
          outputTokens: s.outputTokens as number | undefined,
          channel: (s.lastChannel || s.channel) as string | undefined,
          kind: s.kind as string | undefined,
        })));
      }
    } catch {
      // Silently ignore session list failures (e.g. disconnected)
    }
  }, []);

  const loadHistory = useCallback(async (sessionKey: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await clientRef.current?.send('chat.history', { sessionKey, limit: 100 });
      const rawMsgs = res?.messages as Array<Record<string, unknown>> | undefined;
      if (rawMsgs) {
        /* eslint-disable @typescript-eslint/no-explicit-any -- raw gateway history messages have dynamic shape */
        const msgs: ChatMessage[] = rawMsgs.map((m: Record<string, any>, i: number) => {
          const blocks: MessageBlock[] = [];
          if (m.content) {
            if (Array.isArray(m.content)) {
              for (const block of m.content) {
                if (block.type === 'text') blocks.push({ type: 'text', text: block.text });
                else if (block.type === 'thinking') blocks.push({ type: 'thinking', text: block.thinking || block.text || '' });
                else if (block.type === 'image') {
                  const src = block.source || {};
                  blocks.push({ type: 'image', mediaType: src.media_type || block.media_type || 'image/png', data: src.data || block.data, url: block.url || src.url });
                }
                else if (block.type === 'image_url') {
                  blocks.push({ type: 'image', mediaType: 'image/png', url: block.image_url?.url || block.url });
                }
                else if (block.type === 'tool_use') blocks.push({ type: 'tool_use', name: block.name, input: block.input, id: block.id });
                else if (block.type === 'tool_result') blocks.push({ type: 'tool_result', content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2), toolUseId: block.tool_use_id });
                else if (block.type === 'toolCall') blocks.push({ type: 'tool_use', name: block.name, input: block.arguments || block.input, id: block.id });
                else if (block.type === 'toolResult') blocks.push({ type: 'tool_result', content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2), toolUseId: block.toolCallId || block.tool_use_id, name: block.name });
              }
            } else if (typeof m.content === 'string') {
              blocks.push({ type: 'text', text: m.content });
            }
          }
          const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';

          if (m.role === 'toolResult') {
            const toolBlocks: MessageBlock[] = blocks.map(b => {
              if (b.type === 'text') {
                return { type: 'tool_result' as const, content: b.text, toolUseId: m.toolCallId };
              }
              return b;
            });
            return {
              id: m.id || `hist-${i}`,
              role: 'assistant' as const,
              content: '',
              timestamp: m.timestamp || Date.now(),
              blocks: toolBlocks,
              isToolResult: true,
            };
          }

          return {
            id: m.id || `hist-${i}`,
            role,
            content: blocks.filter((b): b is Extract<MessageBlock, { type: 'text' }> => b.type === 'text').map(b => b.text).join(''),
            timestamp: m.timestamp || Date.now(),
            blocks,
          };
        });
        const merged: ChatMessage[] = [];
        for (const msg of msgs) {
          const isToolResult = 'isToolResult' in msg && (msg as ChatMessage & { isToolResult?: boolean }).isToolResult;
          if (isToolResult && merged.length > 0 && merged[merged.length - 1].role === 'assistant') {
            merged[merged.length - 1] = {
              ...merged[merged.length - 1],
              blocks: [...merged[merged.length - 1].blocks, ...msg.blocks],
            };
          } else if (isToolResult) {
            // skip orphan tool results
          } else {
            merged.push(msg);
          }
        }
        setMessages(merged);
      }
    } catch {
      // Silently ignore history load failures
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const setupClient = useCallback((wsUrl: string, token: string) => {
    // Tear down existing client
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    const client = new GatewayClient(wsUrl, token);
    clientRef.current = client;

    client.onStatus((s) => {
      setStatus(s);
      if (s === 'connected') {
        setAuthenticated(true);
        setConnectError(null);
        setIsConnecting(false);
        isConnectingRef.current = false;
        storeCredentials(wsUrl, token);
        loadSessions();
        loadHistory(activeSessionRef.current);
      } else if (s === 'disconnected' && !client.isConnected) {
        // If we never connected successfully, this is an auth/connection error
        if (isConnectingRef.current) {
          setConnectError('Connection failed — check URL and token');
          setIsConnecting(false);
          isConnectingRef.current = false;
          setAuthenticated(false);
        }
      }
    });

    client.onEvent((event, payload) => {
      if (event === 'agent') {
        handleAgentEvent(payload);
        return;
      }
      if (event !== 'chat') return;

      const state = payload.state as string | undefined;
      const runId = payload.runId as string;
      const message = payload.message as ChatPayloadMessage | undefined;
      const errorMessage = payload.errorMessage as string | undefined;
      const evtSession = payload.sessionKey as string | undefined;

      if (evtSession) {
        if (state === 'delta') {
          setActiveSessions(prev => {
            if (prev.has(evtSession)) return prev;
            const next = new Set(prev);
            next.add(evtSession);
            return next;
          });
        } else if (state === 'final' || state === 'error' || state === 'aborted') {
          setActiveSessions(prev => {
            if (!prev.has(evtSession)) return prev;
            const next = new Set(prev);
            next.delete(evtSession);
            return next;
          });
        }
      }

      if (evtSession !== activeSessionRef.current) {
        // Mark non-active sessions as unread when they receive a final message
        if (state === 'final' && evtSession) {
          setUnreadSessions(prev => {
            if (prev.has(evtSession)) return prev;
            const next = new Set(prev);
            next.add(evtSession);
            return next;
          });
        }
        return;
      }

      if (state === 'delta') {
        const text = extractText(message);
        currentRunIdRef.current = runId;

        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.isStreaming && last.runId === runId) {
            const updated = { ...last };
            updated.content = text;
            const nonTextBlocks = updated.blocks.filter(b => b.type !== 'text');
            updated.blocks = [...nonTextBlocks, { type: 'text' as const, text }];
            return [...prev.slice(0, -1), updated];
          }
          const msg: ChatMessage = {
            id: runId + '-' + Date.now(),
            role: 'assistant',
            content: text,
            timestamp: Date.now(),
            blocks: [{ type: 'text', text }],
            isStreaming: true,
            runId,
          };
          return [...prev, msg];
        });
      } else if (state === 'final') {
        currentRunIdRef.current = null;
        setIsGenerating(false);
        loadHistory(activeSessionRef.current);
      } else if (state === 'error') {
        currentRunIdRef.current = null;
        setIsGenerating(false);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.isStreaming && last.runId === runId) {
            return [...prev.slice(0, -1), { ...last, isStreaming: false }];
          }
          return [...prev, {
            id: 'error-' + Date.now(),
            role: 'assistant' as const,
            content: `Error: ${errorMessage || 'unknown error'}`,
            timestamp: Date.now(),
            blocks: [{ type: 'text' as const, text: `Error: ${errorMessage || 'unknown error'}` }],
          }];
        });
      } else if (state === 'aborted') {
        currentRunIdRef.current = null;
        setIsGenerating(false);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.isStreaming) {
            return [...prev.slice(0, -1), { ...last, isStreaming: false }];
          }
          return prev;
        });
      }
    });

    setIsConnecting(true);
    isConnectingRef.current = true;
    setConnectError(null);
    client.connect();
  }, [handleAgentEvent, loadHistory, loadSessions]);

  // On mount: try stored credentials
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const stored = getStoredCredentials();
    if (stored) {
      // Init on mount — setupClient sets state as part of establishing the connection
      setupClient(stored.url, stored.token);
    } else {
      setAuthenticated(false);
    }
  }, [setupClient]);

  const sendMessage = useCallback(async (text: string, attachments?: Array<{ mimeType: string; fileName: string; content: string }>) => {
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      blocks: [{ type: 'text', text }],
    };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      await clientRef.current?.send('chat.send', {
        sessionKey: activeSessionRef.current,
        message: text,
        deliver: false,
        idempotencyKey: genIdempotencyKey(),
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      });
    } catch {
      // Failed to send — stop generating indicator
      setIsGenerating(false);
    }
  }, []);

  const abort = useCallback(async () => {
    try {
      await clientRef.current?.send('chat.abort', { sessionKey: activeSessionRef.current });
    } catch {
      // Ignore abort failures
    }
    setIsGenerating(false);
  }, []);

  const switchSession = useCallback((key: string) => {
    setActiveSession(key);
    activeSessionRef.current = key;
    setMessages([]);
    setUnreadSessions(prev => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    loadHistory(key);
  }, [loadHistory]);

  const login = useCallback((url: string, token: string) => {
    setupClient(url, token);
  }, [setupClient]);

  const logout = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    clearCredentials();
    setAuthenticated(false);
    setMessages([]);
    setSessions([]);
    setStatus('disconnected');
    setConnectError(null);
  }, []);

  // Periodic session refresh every 30s
  useEffect(() => {
    if (status !== 'connected') return;
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, [status, loadSessions]);

  const enrichedSessions = sessions.map(s => ({
    ...s,
    isActive: activeSessions.has(s.key),
    hasUnread: unreadSessions.has(s.key),
  }));

  return {
    status, messages, sessions: enrichedSessions, activeSession, isGenerating, isLoadingHistory,
    sendMessage, abort, switchSession, loadSessions,
    authenticated, login, logout, connectError, isConnecting,
  };
}

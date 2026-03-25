import { useState, useEffect, useCallback, useRef } from 'react';
import type { GatewayClient, JsonPayload } from '../lib/gateway';
import type { ExecApproval, ExecApprovalDecision, ConnectionStatus } from '../types';
import { playNotificationSound } from '../lib/notificationSound';

function parseApproval(payload: JsonPayload): ExecApproval | null {
  const id = payload.id as string | undefined;
  if (!id) return null;

  const req = payload.request as Record<string, unknown> | undefined;
  const plan = (req?.systemRunPlan ?? payload.systemRunPlan) as Record<string, unknown> | undefined;

  return {
    id,
    command: (req?.command as string) || (plan?.commandText as string) || (payload.command as string) || '',
    commandArgv: (req?.commandArgv as string[]) || (plan?.argv as string[]) || (payload.commandArgv as string[]) || [],
    cwd: (req?.cwd as string) || (plan?.cwd as string) || (payload.cwd as string) || '',
    agentId: (req?.agentId as string) || (plan?.agentId as string) || (payload.agentId as string) || '',
    sessionKey: (req?.sessionKey as string) || (plan?.sessionKey as string) || (payload.sessionKey as string) || '',
    expiresAtMs: (payload.expiresAtMs as number) || Date.now() + 60_000,
    resolvedPath: (req?.resolvedPath as string) || (payload.resolvedPath as string) || undefined,
    commandPreview: (plan?.commandPreview as string) || (req?.command as string) || (payload.command as string) || undefined,
  };
}

export function useExecApprovals(
  getClient: () => GatewayClient | null,
  addEventListener: (fn: (event: string, payload: JsonPayload) => void) => () => void,
  status: ConnectionStatus,
) {
  const [pendingApprovals, setPendingApprovals] = useState<ExecApproval[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clear queue on disconnect
  useEffect(() => {
    if (status === 'disconnected') {
      setPendingApprovals([]);
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
    }
  }, [status]);

  // Listen for approval events
  useEffect(() => {
    const cleanup = addEventListener((event, payload) => {
      if (event === 'exec.approval.resolved') {
        const resolvedId = payload.id as string | undefined;
        if (resolvedId) {
          setPendingApprovals(prev => prev.filter(a => a.id !== resolvedId));
        }
        return;
      }

      if (event !== 'exec.approval.requested') return;

      const approval = parseApproval(payload);
      if (!approval) return;

      setPendingApprovals(prev => {
        if (prev.some(a => a.id === approval.id)) return prev;
        return [...prev, approval];
      });

      // Play sound if tab not focused
      if (document.hidden) {
        playNotificationSound();
      }
    });
    return cleanup;
  }, [addEventListener]);

  // Manage expiration timers
  useEffect(() => {
    const currentIds = new Set(pendingApprovals.map(a => a.id));

    // Clear timers for removed approvals
    timersRef.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });

    // Set timers for new approvals
    for (const approval of pendingApprovals) {
      if (timersRef.current.has(approval.id)) continue;
      const remaining = approval.expiresAtMs - Date.now();
      if (remaining <= 0) {
        setPendingApprovals(prev => prev.filter(a => a.id !== approval.id));
      } else {
        const timer = setTimeout(() => {
          timersRef.current.delete(approval.id);
          setPendingApprovals(prev => prev.filter(a => a.id !== approval.id));
        }, remaining);
        timersRef.current.set(approval.id, timer);
      }
    }
  }, [pendingApprovals]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const resolve = useCallback(async (id: string, decision: ExecApprovalDecision) => {
    const client = getClient();
    try {
      await client?.send('exec.approval.resolve', { id, decision });
    } catch {
      // Server may have already expired it — remove locally regardless
    }
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
  }, [getClient]);

  const currentApproval = pendingApprovals[0] ?? null;

  return { pendingApprovals, currentApproval, resolve };
}

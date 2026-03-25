import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

  // Clear queue on disconnect — filter to empty rather than direct setState in effect
  const approvals = useMemo(() => {
    if (status === 'disconnected') return [];
    return pendingApprovals;
  }, [status, pendingApprovals]);

  // Clear timers when disconnected
  useEffect(() => {
    if (status !== 'disconnected') return;
    const timers = timersRef.current;
    timers.forEach(t => clearTimeout(t));
    timers.clear();
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
    const timers = timersRef.current;
    const currentIds = new Set(approvals.map(a => a.id));

    // Clear timers for removed approvals
    timers.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timers.delete(id);
      }
    });

    // Set timers for new approvals
    const expiredIds: string[] = [];
    for (const approval of approvals) {
      if (timers.has(approval.id)) continue;
      const remaining = approval.expiresAtMs - Date.now();
      if (remaining <= 0) {
        expiredIds.push(approval.id);
      } else {
        const timer = setTimeout(() => {
          timers.delete(approval.id);
          setPendingApprovals(prev => prev.filter(a => a.id !== approval.id));
        }, remaining);
        timers.set(approval.id, timer);
      }
    }

    // Remove already-expired approvals in a batched update after the effect
    if (expiredIds.length > 0) {
      const expiredSet = new Set(expiredIds);
      setTimeout(() => {
        setPendingApprovals(prev => prev.filter(a => !expiredSet.has(a.id)));
      }, 0);
    }
  }, [approvals]);

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
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

  const currentApproval = approvals[0] ?? null;

  return { pendingApprovals: approvals, currentApproval, resolve };
}

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../lib/notificationSound', () => ({
  playNotificationSound: vi.fn(),
}));

import { useExecApprovals } from '../useExecApprovals';
import { playNotificationSound } from '../../lib/notificationSound';
import type { JsonPayload } from '../../lib/gateway';

function createMockGateway() {
  const listeners: Array<(event: string, payload: JsonPayload) => void> = [];
  const mockClient = {
    send: vi.fn().mockResolvedValue({}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getClient = () => mockClient as any;
  const addEventListener = (fn: (event: string, payload: JsonPayload) => void) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  };

  const emit = (event: string, payload: JsonPayload) => {
    for (const fn of listeners) fn(event, payload);
  };

  return { getClient, addEventListener, emit, mockClient };
}

function makeApprovalPayload(overrides: Partial<Record<string, unknown>> = {}): JsonPayload {
  return {
    id: 'approval-1',
    command: 'rm -rf /tmp/test',
    commandArgv: ['rm', '-rf', '/tmp/test'],
    cwd: '/home/user',
    agentId: 'agent:main',
    sessionKey: 'agent:main:main',
    expiresAtMs: Date.now() + 60_000,
    ...overrides,
  };
}

describe('useExecApprovals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(playNotificationSound).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with empty queue', () => {
    const { getClient, addEventListener } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));
    expect(result.current.pendingApprovals).toEqual([]);
    expect(result.current.currentApproval).toBeNull();
  });

  it('adds approval to queue on exec.approval.requested event', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload());
    });

    expect(result.current.pendingApprovals).toHaveLength(1);
    expect(result.current.currentApproval?.id).toBe('approval-1');
    expect(result.current.currentApproval?.command).toBe('rm -rf /tmp/test');
  });

  it('ignores non-approval events', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('chat', { state: 'delta' });
      emit('agent', { stream: 'tool' });
    });

    expect(result.current.pendingApprovals).toHaveLength(0);
  });

  it('queues multiple approvals in FIFO order', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a1' }));
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a2' }));
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a3' }));
    });

    expect(result.current.pendingApprovals).toHaveLength(3);
    expect(result.current.currentApproval?.id).toBe('a1');
  });

  it('does not add duplicate approvals', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a1' }));
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a1' }));
    });

    expect(result.current.pendingApprovals).toHaveLength(1);
  });

  it('resolve sends RPC and removes from queue', async () => {
    const { getClient, addEventListener, emit, mockClient } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a1' }));
    });

    await act(async () => {
      await result.current.resolve('a1', 'allow-once');
    });

    expect(mockClient.send).toHaveBeenCalledWith('exec.approval.resolve', { id: 'a1', decision: 'allow-once' });
    expect(result.current.pendingApprovals).toHaveLength(0);
  });

  it('resolve removes from queue even if RPC fails', async () => {
    const { getClient, addEventListener, emit, mockClient } = createMockGateway();
    mockClient.send.mockRejectedValueOnce(new Error('expired'));
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a1' }));
    });

    await act(async () => {
      await result.current.resolve('a1', 'deny');
    });

    expect(result.current.pendingApprovals).toHaveLength(0);
  });

  it('auto-expires approvals', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload({
        id: 'a1',
        expiresAtMs: Date.now() + 5000,
      }));
    });

    expect(result.current.pendingApprovals).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5001);
    });

    expect(result.current.pendingApprovals).toHaveLength(0);
  });

  it('clears queue on disconnect', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result, rerender } = renderHook(
      ({ status }) => useExecApprovals(getClient, addEventListener, status),
      { initialProps: { status: 'connected' as const } },
    );

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a1' }));
    });
    expect(result.current.pendingApprovals).toHaveLength(1);

    rerender({ status: 'disconnected' as const });
    expect(result.current.pendingApprovals).toHaveLength(0);
  });

  it('plays notification sound when tab is hidden', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    const { getClient, addEventListener, emit } = createMockGateway();
    renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload());
    });

    expect(playNotificationSound).toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  });

  it('does not play sound when tab is visible', () => {
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    const { getClient, addEventListener, emit } = createMockGateway();
    renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload());
    });

    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it('parses systemRunPlan fields as fallback', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', {
        id: 'a1',
        expiresAtMs: Date.now() + 60_000,
        systemRunPlan: {
          commandText: 'ls -la',
          argv: ['ls', '-la'],
          cwd: '/home/test',
          agentId: 'sub-agent',
          sessionKey: 'agent:sub:main',
          commandPreview: 'ls -la',
        },
      });
    });

    const approval = result.current.currentApproval!;
    expect(approval.command).toBe('ls -la');
    expect(approval.cwd).toBe('/home/test');
    expect(approval.agentId).toBe('sub-agent');
    expect(approval.commandPreview).toBe('ls -la');
  });

  it('removes approval when exec.approval.resolved event received', () => {
    const { getClient, addEventListener, emit } = createMockGateway();
    const { result } = renderHook(() => useExecApprovals(getClient, addEventListener, 'connected'));

    act(() => {
      emit('exec.approval.requested', makeApprovalPayload({ id: 'a1' }));
    });
    expect(result.current.pendingApprovals).toHaveLength(1);

    act(() => {
      emit('exec.approval.resolved', { id: 'a1', decision: 'allow-once', resolvedBy: 'other-client' });
    });

    expect(result.current.pendingApprovals).toHaveLength(0);
  });
});

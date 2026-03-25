/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ExecApprovalModal } from '../ExecApprovalModal';
import type { ExecApproval } from '../../types';

function makeApproval(overrides: Partial<ExecApproval> = {}): ExecApproval {
  return {
    id: 'test-1',
    command: 'npm run build',
    commandArgv: ['npm', 'run', 'build'],
    cwd: '/home/user/project',
    agentId: 'agent:main',
    sessionKey: 'agent:main:main',
    expiresAtMs: Date.now() + 30_000,
    ...overrides,
  };
}

describe('ExecApprovalModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the command text', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    expect(screen.getByText('npm run build')).toBeDefined();
  });

  it('renders cwd and agent info', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    expect(screen.getByText('/home/user/project')).toBeDefined();
    expect(screen.getByText('agent:main')).toBeDefined();
  });

  it('calls onResolve with deny when Deny button clicked', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    act(() => { vi.advanceTimersByTime(1); }); // flush initial tick
    fireEvent.click(screen.getByText('Deny'));
    expect(onResolve).toHaveBeenCalledWith('test-1', 'deny');
  });

  it('calls onResolve with allow-once when Allow Once button clicked', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    act(() => { vi.advanceTimersByTime(1); }); // flush initial tick
    fireEvent.click(screen.getByText('Allow Once'));
    expect(onResolve).toHaveBeenCalledWith('test-1', 'allow-once');
  });

  it('calls onResolve with allow-always when Allow Always button clicked', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    act(() => { vi.advanceTimersByTime(1); }); // flush initial tick
    fireEvent.click(screen.getByText('Allow Always'));
    expect(onResolve).toHaveBeenCalledWith('test-1', 'allow-always');
  });

  it('calls onResolve with deny on Escape key', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onResolve).toHaveBeenCalledWith('test-1', 'deny');
  });

  it('shows queue count when queueSize > 1', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={3} onResolve={onResolve} />);
    expect(screen.getByText('1 of 3')).toBeDefined();
  });

  it('does not show queue count when queueSize is 1', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    expect(screen.queryByText(/of/)).toBeNull();
  });

  it('uses commandPreview when available', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval({ commandPreview: 'npm run build (preview)' })} queueSize={1} onResolve={onResolve} />);
    expect(screen.getByText('npm run build (preview)')).toBeDefined();
  });

  it('has alertdialog role', () => {
    const onResolve = vi.fn();
    render(<ExecApprovalModal approval={makeApproval()} queueSize={1} onResolve={onResolve} />);
    expect(screen.getByRole('alertdialog')).toBeDefined();
  });
});

/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Polyfill matchMedia before Sidebar module is imported (usePwaInstall reads it at module scope)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const { NewSessionSplitButton } = await import('../Sidebar');

describe('NewSessionSplitButton', () => {
  const onNewSession = vi.fn().mockResolvedValue(undefined);
  const onNewSessionForAgent = vi.fn().mockResolvedValue(undefined);

  it('renders plain New button when agents list is empty', () => {
    render(<NewSessionSplitButton onNewSession={onNewSession} onNewSessionForAgent={onNewSessionForAgent} agents={[]} />);
    expect(screen.getByText('New')).toBeDefined();
    expect(screen.queryByLabelText(/select agent/i)).toBeNull();
  });

  it('renders plain New button when only one agent', () => {
    render(<NewSessionSplitButton onNewSession={onNewSession} onNewSessionForAgent={onNewSessionForAgent} agents={['main']} />);
    expect(screen.getByText('New')).toBeDefined();
    expect(screen.queryByLabelText(/select agent/i)).toBeNull();
  });

  it('renders dropdown chevron when 2+ agents', () => {
    render(<NewSessionSplitButton onNewSession={onNewSession} onNewSessionForAgent={onNewSessionForAgent} agents={['main', 'helper']} />);
    expect(screen.getByText('New')).toBeDefined();
    expect(screen.getByLabelText(/select agent/i)).toBeDefined();
  });

  it('shows agent list when dropdown is opened', () => {
    render(<NewSessionSplitButton onNewSession={onNewSession} onNewSessionForAgent={onNewSessionForAgent} agents={['main', 'helper']} />);
    fireEvent.click(screen.getByLabelText(/select agent/i));
    expect(screen.getByText('main')).toBeDefined();
    expect(screen.getByText('helper')).toBeDefined();
  });

  it('calls onNewSession when New button is clicked', () => {
    onNewSession.mockClear();
    render(<NewSessionSplitButton onNewSession={onNewSession} onNewSessionForAgent={onNewSessionForAgent} agents={['main', 'helper']} />);
    fireEvent.click(screen.getByText('New'));
    expect(onNewSession).toHaveBeenCalledOnce();
  });

  it('calls onNewSessionForAgent with correct id when agent is selected', () => {
    onNewSessionForAgent.mockClear();
    render(<NewSessionSplitButton onNewSession={onNewSession} onNewSessionForAgent={onNewSessionForAgent} agents={['main', 'helper']} />);
    fireEvent.click(screen.getByLabelText(/select agent/i));
    fireEvent.click(screen.getByText('helper'));
    expect(onNewSessionForAgent).toHaveBeenCalledWith('helper');
  });
});

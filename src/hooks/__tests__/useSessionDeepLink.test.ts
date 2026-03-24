/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionDeepLink } from '../useSessionDeepLink';
import type { Session } from '../../types';

function makeSession(key: string): Session {
  return {
    key,
    label: key,
    lastActivity: Date.now(),
    channel: 'webchat',
  } as Session;
}

describe('useSessionDeepLink', () => {
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    // Reset URL
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '', pathname: '/' },
    });
  });

  it('does nothing when no ?session param', () => {
    const switchSession = vi.fn();
    const onNotFound = vi.fn();

    renderHook(() =>
      useSessionDeepLink({
        sessions: [makeSession('s1')],
        authenticated: true,
        isSessionsLoaded: true,
        switchSession,
        onNotFound,
      }),
    );

    expect(switchSession).not.toHaveBeenCalled();
    expect(onNotFound).not.toHaveBeenCalled();
  });

  it('switches to session when param matches', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?session=s2', pathname: '/' },
    });

    const switchSession = vi.fn();
    const onNotFound = vi.fn();

    renderHook(() =>
      useSessionDeepLink({
        sessions: [makeSession('s1'), makeSession('s2')],
        authenticated: true,
        isSessionsLoaded: true,
        switchSession,
        onNotFound,
      }),
    );

    expect(switchSession).toHaveBeenCalledWith('s2');
    expect(onNotFound).not.toHaveBeenCalled();
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it('calls onNotFound when session key not in list', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?session=unknown', pathname: '/' },
    });

    const switchSession = vi.fn();
    const onNotFound = vi.fn();

    vi.useFakeTimers();

    renderHook(() =>
      useSessionDeepLink({
        sessions: [makeSession('s1')],
        authenticated: true,
        isSessionsLoaded: true,
        switchSession,
        onNotFound,
      }),
    );

    vi.runAllTimers();
    vi.useRealTimers();

    expect(switchSession).not.toHaveBeenCalled();
    expect(onNotFound).toHaveBeenCalled();
  });

  it('waits for authentication before switching', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?session=s1', pathname: '/' },
    });

    const switchSession = vi.fn();
    const onNotFound = vi.fn();

    const { rerender } = renderHook(
      ({ authenticated, isSessionsLoaded }) =>
        useSessionDeepLink({
          sessions: [makeSession('s1')],
          authenticated,
          isSessionsLoaded,
          switchSession,
          onNotFound,
        }),
      { initialProps: { authenticated: false, isSessionsLoaded: false } },
    );

    expect(switchSession).not.toHaveBeenCalled();

    rerender({ authenticated: true, isSessionsLoaded: true });
    expect(switchSession).toHaveBeenCalledWith('s1');
  });

  it('cleans session param from URL preserving other params', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?session=s1&foo=bar', pathname: '/app' },
    });

    renderHook(() =>
      useSessionDeepLink({
        sessions: [makeSession('s1')],
        authenticated: true,
        isSessionsLoaded: true,
        switchSession: vi.fn(),
        onNotFound: vi.fn(),
      }),
    );

    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/app?foo=bar');
  });
});

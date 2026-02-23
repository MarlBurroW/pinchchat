/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock notificationSound before importing the hook
vi.mock('../../lib/notificationSound', () => ({
  playNotificationSound: vi.fn(),
}));

import { useNotifications, setBaseTitle } from '../useNotifications';
import { playNotificationSound } from '../../lib/notificationSound';

describe('useNotifications', () => {
  let originalHidden: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    originalHidden = document.hidden;
    // Tab is visible by default
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    document.title = '';
    vi.mocked(playNotificationSound).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'hidden', { value: originalHidden, writable: true, configurable: true });
  });

  it('starts with zero unread and sound enabled by default', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.soundEnabled).toBe(true);
  });

  it('respects stored sound preference', () => {
    localStorage.setItem('pinchchat-notification-sound', 'false');
    const { result } = renderHook(() => useNotifications());
    expect(result.current.soundEnabled).toBe(false);
  });

  it('toggleSound flips the preference and persists it', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.soundEnabled).toBe(true);

    act(() => result.current.toggleSound());
    expect(result.current.soundEnabled).toBe(false);
    expect(localStorage.getItem('pinchchat-notification-sound')).toBe('false');

    act(() => result.current.toggleSound());
    expect(result.current.soundEnabled).toBe(true);
    expect(localStorage.getItem('pinchchat-notification-sound')).toBe('true');
  });

  it('plays preview sound when enabling', () => {
    localStorage.setItem('pinchchat-notification-sound', 'false');
    const { result } = renderHook(() => useNotifications());
    expect(result.current.soundEnabled).toBe(false);

    act(() => result.current.toggleSound());
    expect(playNotificationSound).toHaveBeenCalledWith(0.3);
  });

  it('does not play preview sound when disabling', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.soundEnabled).toBe(true);

    act(() => result.current.toggleSound());
    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it('does not increment unread when tab is visible', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => result.current.notify('Test', 'body'));
    expect(result.current.unreadCount).toBe(0);
  });

  it('increments unread and plays sound when tab is hidden', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    // Fire visibilitychange so the hook picks up the hidden state
    document.dispatchEvent(new Event('visibilitychange'));

    const { result } = renderHook(() => useNotifications());

    // Simulate tab becoming hidden after hook mounts
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    act(() => result.current.notify('New message', 'hello'));
    expect(result.current.unreadCount).toBe(1);
    expect(playNotificationSound).toHaveBeenCalledWith(0.3);

    act(() => result.current.notify('Another', 'world'));
    expect(result.current.unreadCount).toBe(2);
  });

  it('resets unread when tab becomes visible', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    const { result } = renderHook(() => useNotifications());

    act(() => result.current.notify('Msg', 'text'));
    expect(result.current.unreadCount).toBe(1);

    // Tab becomes visible
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.unreadCount).toBe(0);
  });

  it('does not play sound when sound is disabled', () => {
    localStorage.setItem('pinchchat-notification-sound', 'false');
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    const { result } = renderHook(() => useNotifications());
    act(() => result.current.notify('Msg'));
    expect(playNotificationSound).not.toHaveBeenCalled();
  });
});

describe('setBaseTitle', () => {
  it('sets document title with session label', () => {
    setBaseTitle('My Chat');
    expect(document.title).toBe('My Chat — PinchChat');
  });

  it('sets document title to app name when no label', () => {
    setBaseTitle();
    expect(document.title).toBe('PinchChat');
  });

  it('sets document title to app name with undefined', () => {
    setBaseTitle(undefined);
    expect(document.title).toBe('PinchChat');
  });
});

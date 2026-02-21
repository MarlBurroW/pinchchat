/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSendShortcut } from '../useSendShortcut';

const STORAGE_KEY = 'pinchchat-send-on-enter';

describe('useSendShortcut', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to true when no stored preference', () => {
    const { result } = renderHook(() => useSendShortcut());
    expect(result.current.sendOnEnter).toBe(true);
  });

  it('reads stored "true" preference', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const { result } = renderHook(() => useSendShortcut());
    expect(result.current.sendOnEnter).toBe(true);
  });

  it('reads stored "false" preference', () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const { result } = renderHook(() => useSendShortcut());
    expect(result.current.sendOnEnter).toBe(false);
  });

  it('toggles from true to false and persists', () => {
    const { result } = renderHook(() => useSendShortcut());
    expect(result.current.sendOnEnter).toBe(true);

    act(() => result.current.toggle());

    expect(result.current.sendOnEnter).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('toggles from false to true and persists', () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const { result } = renderHook(() => useSendShortcut());

    act(() => result.current.toggle());

    expect(result.current.sendOnEnter).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('toggle is stable across renders', () => {
    const { result, rerender } = renderHook(() => useSendShortcut());
    const firstToggle = result.current.toggle;
    rerender();
    expect(result.current.toggle).toBe(firstToggle);
  });
});

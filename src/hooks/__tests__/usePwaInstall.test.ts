/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// We need to control matchMedia before the module loads
let standaloneMatch = false;
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: query === '(display-mode: standalone)' ? standaloneMatch : false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  onchange: null,
  dispatchEvent: vi.fn(),
}));
Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });

describe('usePwaInstall', () => {
  beforeEach(() => {
    standaloneMatch = false;
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initially canInstall is false and isInstalled is false', async () => {
    const { usePwaInstall } = await import('../usePwaInstall');
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it('sets canInstall to true when beforeinstallprompt fires', async () => {
    const { usePwaInstall } = await import('../usePwaInstall');
    const { result } = renderHook(() => usePwaInstall());

    await act(async () => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('install() calls prompt and returns true on accepted', async () => {
    const { usePwaInstall } = await import('../usePwaInstall');
    const { result } = renderHook(() => usePwaInstall());

    const promptMock = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, {
        prompt: promptMock,
        userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      });
      window.dispatchEvent(event);
    });

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.install();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(accepted).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('install() returns false on dismissed', async () => {
    const { usePwaInstall } = await import('../usePwaInstall');
    const { result } = renderHook(() => usePwaInstall());

    await act(async () => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
      });
      window.dispatchEvent(event);
    });

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.install();
    });

    expect(accepted).toBe(false);
  });

  it('install() returns false when no deferred prompt', async () => {
    const { usePwaInstall } = await import('../usePwaInstall');
    const { result } = renderHook(() => usePwaInstall());

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.install();
    });

    expect(accepted).toBe(false);
  });

  it('sets isInstalled on appinstalled event', async () => {
    const { usePwaInstall } = await import('../usePwaInstall');
    const { result } = renderHook(() => usePwaInstall());

    await act(async () => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('cleans up event listeners on unmount', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { usePwaInstall } = await import('../usePwaInstall');
    const { unmount } = renderHook(() => usePwaInstall());

    expect(addSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});

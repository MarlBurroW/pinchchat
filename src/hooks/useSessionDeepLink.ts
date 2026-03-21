import { useRef, useEffect } from 'react';
import type { Session } from '../types';

interface Params {
  sessions: Session[];
  authenticated: boolean | null;
  isSessionsLoaded: boolean;
  switchSession: (key: string) => void;
  onNotFound: () => void;
}

/**
 * Reads a `?session=<key>` URL param on mount, cleans it from the URL immediately,
 * then switches to that session once authenticated and sessions are loaded.
 * Calls `onNotFound` if the key is not present in the sessions list.
 */
export function useSessionDeepLink({
  sessions,
  authenticated,
  isSessionsLoaded,
  switchSession,
  onNotFound,
}: Params): void {
  // IIFE captures the param on first render — useRef does not accept a lazy initializer.
  const pendingKeyRef = useRef<string | null>((() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('session'); // URLSearchParams.get() auto-decodes percent-encoding
    if (key) {
      params.delete('session');
      const newSearch = params.toString();
      history.replaceState(
        {},
        '',
        window.location.pathname + (newSearch ? '?' + newSearch : '')
      );
    }
    return key;
  })());

  useEffect(() => {
    if (!authenticated || !isSessionsLoaded) return;
    const key = pendingKeyRef.current;
    if (!key) return;
    pendingKeyRef.current = null; // consume — fires at most once
    if (sessions.find(s => s.key === key)) {
      switchSession(key);
    } else {
      setTimeout(onNotFound, 0);
    }
  }, [authenticated, isSessionsLoaded, sessions, switchSession, onNotFound]);
}

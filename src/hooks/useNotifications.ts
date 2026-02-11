import { useState, useEffect, useCallback, useRef } from 'react';

const ORIGINAL_TITLE = document.title;

/**
 * Hook that manages browser notifications and tab title badge
 * when new messages arrive while the tab is not focused.
 */
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const isVisibleRef = useRef(!document.hidden);
  const permissionRef = useRef(Notification.permission);

  // Track tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        // Reset unread when tab becomes visible
        setUnreadCount(0);
        document.title = ORIGINAL_TITLE;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Update tab title when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${ORIGINAL_TITLE}`;
    }
  }, [unreadCount]);

  // Request permission on first user interaction
  useEffect(() => {
    if (permissionRef.current !== 'default') return;
    const requestOnInteraction = () => {
      if (permissionRef.current === 'default') {
        Notification.requestPermission().then(p => {
          permissionRef.current = p;
        });
      }
      document.removeEventListener('click', requestOnInteraction);
    };
    document.addEventListener('click', requestOnInteraction);
    return () => document.removeEventListener('click', requestOnInteraction);
  }, []);

  const notify = useCallback((title: string, body?: string) => {
    if (isVisibleRef.current) return; // Tab is focused, no need

    setUnreadCount(c => c + 1);

    // Send browser notification if permitted
    if (permissionRef.current === 'granted') {
      try {
        const n = new Notification(title, {
          body: body?.slice(0, 200),
          icon: '/logo.png',
          tag: 'pinchchat-message', // Collapse multiple into one
          silent: false,
        });
        // Auto-close after 5s
        setTimeout(() => n.close(), 5000);
        // Focus tab on click
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        // Notifications not supported (e.g. some mobile browsers)
      }
    }
  }, []);

  return { notify, unreadCount };
}

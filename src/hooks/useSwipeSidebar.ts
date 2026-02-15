import { useEffect, useRef, useCallback } from 'react';

const EDGE_ZONE = 30; // px from left edge to start detecting
const MIN_SWIPE = 50; // minimum px distance to trigger
const MAX_Y_DRIFT = 80; // if vertical movement exceeds this, abort

/**
 * Swipe-to-open / swipe-to-close sidebar on touch devices.
 * - Swipe right from the left edge → open
 * - Swipe left anywhere when open → close
 */
export function useSwipeSidebar(
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    // When closed: only detect from left edge
    // When open: detect anywhere (to close)
    if (!isOpen && touch.clientX > EDGE_ZONE) return;

    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isSwipingRef.current = false;
  }, [isOpen]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStart.current.x;
    const dy = Math.abs(touch.clientY - touchStart.current.y);

    // Too much vertical drift → not a horizontal swipe
    if (dy > MAX_Y_DRIFT) {
      touchStart.current = null;
      return;
    }

    if (Math.abs(dx) > 10) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    if (!touch) { touchStart.current = null; return; }

    const dx = touch.clientX - touchStart.current.x;
    const dy = Math.abs(touch.clientY - touchStart.current.y);
    const elapsed = Date.now() - touchStart.current.time;
    touchStart.current = null;

    // Only act on horizontal swipes
    if (dy > MAX_Y_DRIFT || elapsed > 500) return;

    if (!isOpen && dx > MIN_SWIPE) {
      onOpen();
    } else if (isOpen && dx < -MIN_SWIPE) {
      onClose();
    }
  }, [isOpen, onOpen, onClose]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
}

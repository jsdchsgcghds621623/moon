import { useRef, useCallback, useMemo } from 'react';

const MOVE_THRESHOLD_PX = 12;
const SCROLL_DELTA_PX = 4;

function isTouchLikePointer(pointerType: string) {
  return pointerType === 'touch' || pointerType === 'pen';
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  while (el) {
    if (el.classList.contains('scroll-container')) return el;
    const style = window.getComputedStyle(el);
    const scrollableX =
      (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
      el.scrollWidth > el.clientWidth;
    if (scrollableX) return el;
    el = el.parentElement;
  }
  return null;
}

type GestureState = {
  x: number;
  y: number;
  scrollLeft: number;
  scrollParent: HTMLElement | null;
  cancelled: boolean;
};

/**
 * Touch / pen: open only on a short tap with little movement and no carousel scroll.
 * Mouse: unchanged click behavior via onClick.
 */
export function useTapWithoutScroll(isTouchDevice: boolean, onActivate: () => void) {
  const gestureRef = useRef<GestureState | null>(null);
  const activatedRef = useRef(false);
  const lastPointerTypeRef = useRef<string>('mouse');

  const beginGesture = useCallback(
    (x: number, y: number, target: HTMLElement) => {
      if (!isTouchDevice) return;
      const scrollParent = findScrollParent(target);
      gestureRef.current = {
        x,
        y,
        scrollLeft: scrollParent?.scrollLeft ?? 0,
        scrollParent,
        cancelled: false,
      };
      activatedRef.current = false;
    },
    [isTouchDevice]
  );

  const cancelGesture = useCallback(() => {
    gestureRef.current = null;
  }, []);

  const markGestureCancelled = useCallback(() => {
    if (gestureRef.current) gestureRef.current.cancelled = true;
  }, []);

  const endGesture = useCallback(
    (x: number, y: number) => {
      const g = gestureRef.current;
      gestureRef.current = null;
      if (!g || !isTouchDevice || g.cancelled) return;

      if (g.scrollParent) {
        const scrollDelta = Math.abs(g.scrollParent.scrollLeft - g.scrollLeft);
        if (scrollDelta > SCROLL_DELTA_PX) return;
      }

      const dx = Math.abs(x - g.x);
      const dy = Math.abs(y - g.y);
      if (dx < MOVE_THRESHOLD_PX && dy < MOVE_THRESHOLD_PX) {
        activatedRef.current = true;
        onActivate();
      }
    },
    [isTouchDevice, onActivate]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      lastPointerTypeRef.current = e.pointerType;
      if (!isTouchDevice || !isTouchLikePointer(e.pointerType)) return;
      beginGesture(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    },
    [isTouchDevice, beginGesture]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    const dx = Math.abs(e.clientX - g.x);
    const dy = Math.abs(e.clientY - g.y);
    if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
      g.cancelled = true;
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isTouchDevice || !isTouchLikePointer(e.pointerType)) return;
      endGesture(e.clientX, e.clientY);
    },
    [isTouchDevice, endGesture]
  );

  const onPointerCancel = useCallback(() => {
    cancelGesture();
  }, [cancelGesture]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isTouchDevice || e.touches.length !== 1) return;
      const t = e.touches[0];
      beginGesture(t.clientX, t.clientY, e.currentTarget as HTMLElement);
    },
    [isTouchDevice, beginGesture]
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (!g || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - g.x);
    const dy = Math.abs(t.clientY - g.y);
    if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
      g.cancelled = true;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isTouchDevice) return;
      const t = e.changedTouches[0];
      if (!t) return;
      endGesture(t.clientX, t.clientY);
    },
    [isTouchDevice, endGesture]
  );

  const onTouchCancel = useCallback(() => {
    cancelGesture();
  }, [cancelGesture]);

  const rootPointerHandlers = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    }),
    [
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    ]
  );

  const onRootClick = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchDevice) {
        if (activatedRef.current) {
          activatedRef.current = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Mouse on hybrid / touch-capable OS — pointer handlers only handle touch/pen
        if (lastPointerTypeRef.current === 'mouse') {
          e.stopPropagation();
          onActivate();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      onActivate();
    },
    [isTouchDevice, onActivate]
  );

  return { rootPointerHandlers, onRootClick, markGestureCancelled };
}

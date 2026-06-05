import { useCallback, type KeyboardEvent, type RefObject } from 'react';

export function useCarouselKeyboard(
  carouselRef: RefObject<HTMLDivElement | null>,
  scroll: (direction: 'left' | 'right') => void
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const el = carouselRef.current;
      if (!el) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          scroll('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          scroll('right');
          break;
        case 'Home':
          e.preventDefault();
          el.scrollTo({ left: 0, behavior: 'smooth' });
          break;
        case 'End':
          e.preventDefault();
          el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
          break;
        default:
          break;
      }
    },
    [carouselRef, scroll]
  );

  return { handleKeyDown };
}

/** Opacity classes for carousel nav buttons */
export function carouselControlOpacity(showAlways: boolean): string {
  return showAlways
    ? 'opacity-90 hover:opacity-100'
    : 'opacity-0 group-hover:opacity-100';
}

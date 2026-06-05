import { useState, useRef, useCallback, memo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedMediaCard } from './OptimizedMediaCard';
import { Movie, TVShow } from '@/lib/tmdb';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDevice } from '@/context/DeviceContext';
import { carouselControlOpacity, useCarouselKeyboard } from '@/hooks/use-carousel-keyboard';

interface MediaCarouselProps {
  title: string;
  items: (Movie | TVShow)[];
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  isLoading?: boolean;
}

export const MediaCarousel = memo(
  ({ title, items, onPlay, onMoreInfo, isLoading = false }: MediaCarouselProps) => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [maxScroll, setMaxScroll] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isRowHovered, setIsRowHovered] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const { showCarouselControls, isTV } = useDevice();

    // Measure max scroll on mount + resize
    useEffect(() => {
      const measure = () => {
        if (!carouselRef.current) return;
        setMaxScroll(
          carouselRef.current.scrollWidth - carouselRef.current.clientWidth
        );
      };
      measure();
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }, [items]);

    const canScrollLeft = scrollPosition > 2;
    const canScrollRight = scrollPosition < maxScroll - 2;

    const scroll = useCallback(
      (direction: 'left' | 'right') => {
        if (!carouselRef.current || isScrolling) return;
        setIsScrolling(true);
        const scrollAmount = carouselRef.current.clientWidth * 0.85;
        const newPosition =
          direction === 'left'
            ? Math.max(0, scrollPosition - scrollAmount)
            : Math.min(maxScroll, scrollPosition + scrollAmount);

        carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });

        setTimeout(() => {
          setIsScrolling(false);
          if (carouselRef.current) {
            setScrollPosition(carouselRef.current.scrollLeft);
          }
        }, 500);
      },
      [scrollPosition, maxScroll, isScrolling]
    );

    const { handleKeyDown } = useCarouselKeyboard(carouselRef, scroll);

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (isLoading) {
      return (
        <div className="px-4 sm:px-6 lg:px-[60px] mb-8">
          {/* Title skeleton */}
          <div className="w-44 h-5 bg-white/10 rounded animate-pulse mb-3" />
          <div className="flex gap-2 sm:gap-[0.5vw]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-[4px] bg-[#1a1a1a] animate-pulse"
                style={{
                  width: 'clamp(100px, 13vw, 210px)',
                  aspectRatio: '2/3',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (!items.length) return null;

    return (
      <div
        className="relative mb-[2.5vw] px-0"
        onMouseEnter={() => setIsRowHovered(true)}
        onMouseLeave={() => setIsRowHovered(false)}
      >
        {/* ── Row title ──────────────────────────────────────────────────── */}
        <div className="px-4 sm:px-6 lg:px-[60px] mb-2 flex items-center gap-2 group/title">
          <h2
            className="text-white font-bold text-[0.9rem] sm:text-[1rem] lg:text-[1.1rem] tracking-wide select-none"
            style={{ fontFamily: "'Netflix Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          >
            {title}
          </h2>
          {/* "Explore All" appears on row hover — Netflix style */}
          <span
            className={`flex items-center gap-0.5 text-[0.7rem] font-semibold text-[#54b9c5] tracking-wider uppercase transition-all duration-300 cursor-pointer whitespace-nowrap
              ${isRowHovered && !isMobile ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}
          >
            Explore All
            <ChevronRight className="h-3 w-3 mt-[1px]" />
          </span>
        </div>

        {/* ── Track + arrows ─────────────────────────────────────────────── */}
        <div className="relative overflow-visible">
          {/* Left gradient + arrow */}
          <div
            className={`absolute left-0 top-0 bottom-0 z-20 flex items-center
              transition-opacity duration-300
              ${canScrollLeft && !isMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Edge fade */}
            <div className="absolute inset-0 w-[60px] bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none" />
            {/* Arrow button */}
            <button
              onClick={() => scroll('left')}
              disabled={isScrolling}
              aria-label={`Scroll ${title} left`}
              className="relative z-10 flex items-center justify-center
                w-[40px] h-full
                text-white transition-transform duration-200
                hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed
                focus:outline-none"
            >
              <ChevronLeft className="h-7 w-7 sm:h-9 sm:w-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" strokeWidth={2.5} />
            </button>
          </div>

          {/* Right gradient + arrow */}
          <div
            className={`absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end
              transition-opacity duration-300
              ${canScrollRight && !isMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="absolute inset-0 w-[60px] ml-auto bg-gradient-to-l from-black via-black/60 to-transparent pointer-events-none" />
            <button
              onClick={() => scroll('right')}
              disabled={isScrolling}
              aria-label={`Scroll ${title} right`}
              className="relative z-10 flex items-center justify-center
                w-[40px] h-full
                text-white transition-transform duration-200
                hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed
                focus:outline-none"
            >
              <ChevronRight className="h-7 w-7 sm:h-9 sm:w-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Scrollable track ─────────────────────────────────────────── */}
          <div
            ref={carouselRef}
            role="region"
            aria-label={title}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onScroll={(e) => {
              if (!isScrolling) setScrollPosition(e.currentTarget.scrollLeft);
            }}
            className={`
              flex gap-[0.35vw] sm:gap-[0.4vw]
              overflow-x-scroll scroll-container outline-none
              px-4 sm:px-6 lg:px-[60px]
              pb-[2vw]
              /* Give the row extra vertical padding so
                 scaled-up cards don't clip at top/bottom */
              pt-[0.5vw]
              /* Prevent vertical overflow from clipping hover-scale */
              overflow-y-visible
            `}
            /* Netflix uses a slight negative-margin trick so the
               first/last card aligns with the page gutter */
            style={{ scrollbarWidth: 'none' }}
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                className="relative z-0 flex-shrink-0 scroll-snap-align-start hover:z-[100]"
                style={{
                  width: 'clamp(100px, 13vw, 210px)',
                  // Staggered fade-in on first paint
                  animation: `netflixFadeIn 0.4s ease forwards`,
                  animationDelay: `${Math.min(index * 40, 400)}ms`,
                  opacity: 0,
                }}
              >
                <OptimizedMediaCard
                  item={item}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Progress dots (mobile only) ────────────────────────────────── */}
        {isMobile && maxScroll > 0 && (
          <div className="flex justify-center gap-1 mt-1">
            {Array.from({ length: Math.ceil(maxScroll / 200) + 1 }).map((_, i) => {
              const segW = maxScroll / (Math.ceil(maxScroll / 200));
              const active = Math.round(scrollPosition / segW) === i;
              return (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    active ? 'w-4 h-1 bg-white' : 'w-1 h-1 bg-white/30'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Keyframe for staggered card reveal */}
        <style>{`
          @keyframes netflixFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  },
  (prev, next) =>
    prev.items.length === next.items.length &&
    prev.isLoading === next.isLoading &&
    prev.title === next.title &&
    prev.items.every((item, i) => item.id === next.items[i]?.id)
);

MediaCarousel.displayName = 'MediaCarousel';
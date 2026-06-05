
import { useState, useRef, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Play, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TMDB_IMAGE_URL, Movie, TVShow } from '@/lib/tmdb';
import { motion } from 'framer-motion';
import { useContinueWatching, type ContinueWatchingItem } from '@/hooks/useContinueWatching';
import { useIsTouchDevice } from '@/hooks/use-mobile';
import { useDevice } from '@/context/DeviceContext';
import { carouselControlOpacity, useCarouselKeyboard } from '@/hooks/use-carousel-keyboard';
import { useTapWithoutScroll } from '@/hooks/useTapWithoutScroll';

interface ContinueWatchingSlideProps {
  item: ContinueWatchingItem;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  removeFromContinueWatching: (contentId: number, mediaType: 'movie' | 'tv') => void;
}

const ContinueWatchingSlide = memo(
  ({ item, onMoreInfo, removeFromContinueWatching }: ContinueWatchingSlideProps) => {
    const isTouchDevice = useIsTouchDevice();
    const title = 'title' in item.content ? item.content.title : item.content.name;
    const posterUrl = item.content.poster_path
      ? `${TMDB_IMAGE_URL.w500}${item.content.poster_path}`
      : '/placeholder.svg';

    const openMore = useCallback(
      () => onMoreInfo(item.content, item.mediaType),
      [item.content, item.mediaType, onMoreInfo]
    );
    const { rootPointerHandlers, onRootClick } = useTapWithoutScroll(isTouchDevice, openMore);

    return (
      <motion.div
        className="flex-shrink-0 w-32 sm:w-48 touch-pan-x"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div
          className="relative group/card cursor-pointer touch-pan-x"
          onClick={onRootClick}
          {...rootPointerHandlers}
        >
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={posterUrl}
              alt={title}
              className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover/card:scale-105"
              loading="lazy"
            />

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div
                className="h-full bg-netflix-red transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>

            <Badge className="absolute top-2 left-2 bg-netflix-red text-white border-none">Continue</Badge>

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoreInfo(item.content, item.mediaType);
                }}
              >
                <Play className="h-6 w-6 fill-current" />
              </Button>
            </div>
          </div>

          <h3 className="mt-2 text-sm font-medium text-foreground line-clamp-2">{title}</h3>

          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{Math.round(item.progress)}% watched</p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromContinueWatching(item.content.id, item.mediaType);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Continue Watching
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    );
  }
);

ContinueWatchingSlide.displayName = 'ContinueWatchingSlide';

interface ContinueWatchingCarouselProps {
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}

export const ContinueWatchingCarousel = ({ onPlay, onMoreInfo }: ContinueWatchingCarouselProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { continueWatchingItems, removeFromContinueWatching } = useContinueWatching();
  const { showCarouselControls, isTV } = useDevice();
  const controlOpacity = carouselControlOpacity(showCarouselControls);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!carouselRef.current) return;

    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    carouselRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
    setScrollPosition(newPosition);
  }, [scrollPosition]);

  const { handleKeyDown } = useCarouselKeyboard(carouselRef, scroll);

  if (!continueWatchingItems.length) return null;

  return (
    <div className="group px-4 lg:px-16 mb-8 animate-fade-in">
      <h2 className="netflix-section-title">Continue Watching</h2>
      
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-12 bg-black/50 hover:bg-black/70 rounded-none ${controlOpacity} transition-opacity ${isTV ? 'min-w-11' : ''}`}
          onClick={() => scroll('left')}
          style={{ display: scrollPosition > 0 ? 'flex' : 'none' }}
          aria-label="Scroll Continue Watching left"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        {/* Carousel */}
        <div
          ref={carouselRef}
          role="region"
          aria-label="Continue Watching"
          tabIndex={0}
          className="flex gap-4 overflow-x-scroll overscroll-x-contain touch-pan-x scroll-container pb-4 tv-focus-ring outline-none"
          onKeyDown={handleKeyDown}
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          {continueWatchingItems.map((item) => (
            <ContinueWatchingSlide
              key={`${item.content.id}-${item.mediaType}`}
              item={item}
              onMoreInfo={onMoreInfo}
              removeFromContinueWatching={removeFromContinueWatching}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-12 bg-black/50 hover:bg-black/70 rounded-none ${controlOpacity} transition-opacity ${isTV ? 'min-w-11' : ''}`}
          onClick={() => scroll('right')}
          aria-label="Scroll Continue Watching right"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};

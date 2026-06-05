import { useState, useRef, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, ChevronDown } from 'lucide-react';
import { TMDB_IMAGE_URL, Movie, TVShow } from '@/lib/tmdb';
import { useMyList } from '@/hooks/useMyList';
import { useIsMobile, useIsTouchDevice } from '@/hooks/use-mobile';
import { useTapWithoutScroll } from '@/hooks/useTapWithoutScroll';
import { useDevice } from '@/context/DeviceContext';
import { carouselControlOpacity, useCarouselKeyboard } from '@/hooks/use-carousel-keyboard';

// ─── Rank numeral style ───────────────────────────────────────────────────────
// Netflix uses Bebas Neue, enormous, transparent with a thick white stroke.
// Rank 1 always gets the red glow; every card gets it on hover.
const rankSizes =
  'text-[100px] sm:text-[130px] md:text-[150px] lg:text-[170px] xl:text-[190px] 2xl:text-[210px]';

const rankBaseStyle: React.CSSProperties = {
  fontFamily: "'Bebas Neue', 'Arial Black', Impact, sans-serif",
  fontWeight: 900,
  fontStyle: 'normal',
  WebkitTextStroke: '6px rgba(255,255,255,0.88)',
  color: 'transparent',
  lineHeight: 0.85,
  letterSpacing: '-4px',
  userSelect: 'none',
  display: 'block',
};

function rankStyle(index: number, hovered: boolean): React.CSSProperties {
  const glow = index === 0 || hovered
    ? 'drop-shadow(0 0 20px rgba(229,9,20,0.7)) drop-shadow(0 4px 24px rgba(0,0,0,1))'
    : 'drop-shadow(0 4px 20px rgba(0,0,0,0.95))';
  return { ...rankBaseStyle, filter: glow, transition: 'filter 0.35s ease' };
}

// ─── Trending badge ───────────────────────────────────────────────────────────
const BADGE: React.CSSProperties = {
  background: '#E50914',
  color: '#fff',
  fontSize: '8px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '2px 6px',
  borderRadius: '2px',
  boxShadow: '0 2px 8px rgba(229,9,20,0.55)',
};

// ─── Slide ────────────────────────────────────────────────────────────────────
interface Top10SlideProps {
  item: Movie | TVShow;
  index: number;
  mobileItemsToShow: 3 | 4;
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  hoveredId: number | null;
  onHoverChange: (id: number | null) => void;
  isInMyList: (id: number) => boolean;
  toggleMyList: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}

const Top10Slide = memo(({
  item, index, mobileItemsToShow,
  onPlay, onMoreInfo,
  hoveredId, onHoverChange,
  isInMyList, toggleMyList,
}: Top10SlideProps) => {
  const isTouchDevice = useIsTouchDevice();
  const mediaType: 'movie' | 'tv' = 'title' in item ? 'movie' : 'tv';
  const title = 'title' in item ? item.title : item.name;
  const posterUrl = item.poster_path
    ? item.poster_path.startsWith('http')
      ? item.poster_path
      : `${TMDB_IMAGE_URL.w500}${item.poster_path}`
    : '';
  const isHovered = hoveredId === item.id;
  const inList = isInMyList(item.id);

  const openMore = useCallback(() => onMoreInfo(item, mediaType), [item, mediaType, onMoreInfo]);
  const { rootPointerHandlers, onRootClick } = useTapWithoutScroll(isTouchDevice, openMore);

  const mobileWidth = mobileItemsToShow === 3
    ? 'w-[calc(33.333%-4px)]'
    : 'w-[calc(25%-4px)]';

  return (
    <div
      className={`
        flex-shrink-0 flex items-end cursor-pointer relative select-none
        ${mobileWidth} md:w-auto
        transition-transform duration-350 ease-out origin-bottom
        hover:scale-[1.12] hover:z-30
        group/slide
      `}
      style={{ animationDelay: `${index * 70}ms` }}
      onMouseEnter={() => onHoverChange(item.id)}
      onMouseLeave={() => onHoverChange(null)}
      onClick={onRootClick}
      {...rootPointerHandlers}
    >
      {/* ── Giant rank numeral ── */}
      {/* Sits behind the poster, overlapping it by ~16-20px */}
      <div
        className={`${rankSizes} relative flex-shrink-0 z-10`}
        style={{
          ...rankStyle(index, isHovered),
          marginRight: '-14px',
        }}
        aria-label={`Rank ${index + 1}`}
      >
        {index + 1}
      </div>

      {/* ── Poster card ── */}
      <div className="relative flex-shrink-0 z-20
        w-[72px] sm:w-[96px] md:w-[108px] lg:w-[120px] xl:w-[132px] 2xl:w-[144px]">

        {/* Poster image */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            className="
              block w-full
              h-[108px] sm:h-[144px] md:h-[162px] lg:h-[180px] xl:h-[200px] 2xl:h-[216px]
              object-cover rounded-[4px]
              border-2 border-transparent
              transition-all duration-350 ease-out
              group-hover/slide:border-white/30
              group-hover/slide:brightness-[1.07] group-hover/slide:saturate-[1.1]
              brightness-90
              shadow-[4px_0_28px_rgba(0,0,0,0.8)]
              group-hover/slide:shadow-[0_8px_40px_rgba(0,0,0,0.95)]
            "
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        ) : (
          <div className="
            w-full h-[180px] rounded-[4px] bg-zinc-800
            flex items-center justify-center
          ">
            <span className="text-zinc-600 text-xs">No image</span>
          </div>
        )}

        {/* Trending / new badge — top 3 only */}
        {index < 3 && (
          <div
            className="absolute top-[5px] left-[5px] z-10"
            style={BADGE}
          >
            {index === 0 ? '#1 Today' : index === 1 ? 'Top 10' : 'Trending'}
          </div>
        )}

        {/* Hover overlay — dark gradient + action buttons */}
        <div
          className={`
            absolute inset-0 rounded-[4px] z-20
            flex flex-col justify-end
            bg-gradient-to-t from-black/97 via-black/40 to-transparent
            transition-opacity duration-280 ease-out
            hidden sm:flex
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div className="p-[8px] sm:p-[10px] space-y-[6px]">
            {/* Title */}
            <p className="
              text-white font-bold leading-[1.3]
              text-[9px] sm:text-[10px] lg:text-[11px]
              line-clamp-2
              [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]
            ">
              {title}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[4px]">
                {/* Play */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onPlay(item, mediaType); }}
                  aria-label={`Play ${title}`}
                  className="
                    w-[26px] h-[26px] sm:w-[28px] sm:h-[28px]
                    rounded-full bg-white
                    flex items-center justify-center flex-shrink-0
                    transition-all duration-180 ease-out
                    hover:scale-[1.18]
                    hover:shadow-[0_0_16px_rgba(255,255,255,0.5)]
                  "
                >
                  <Play className="w-[10px] h-[10px] fill-black text-black ml-[1px]" />
                </button>

                {/* My List */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMyList(item, mediaType); }}
                  aria-label={inList ? `Remove ${title} from list` : `Add ${title} to list`}
                  className={`
                    w-[26px] h-[26px] sm:w-[28px] sm:h-[28px]
                    rounded-full border flex items-center justify-center flex-shrink-0
                    transition-all duration-180 ease-out hover:scale-[1.18]
                    ${inList
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-black/60 border-white/60 text-white hover:border-white hover:bg-white/18'
                    }
                  `}
                >
                  <Plus className={`w-[11px] h-[11px] transition-transform duration-300 ${inList ? 'rotate-45' : ''}`} />
                </button>
              </div>

              {/* More info */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoreInfo(item, mediaType); }}
                aria-label={`More info about ${title}`}
                className="
                  w-[26px] h-[26px] sm:w-[28px] sm:h-[28px]
                  rounded-full bg-black/60 border border-white/60 text-white
                  flex items-center justify-center flex-shrink-0
                  transition-all duration-180 ease-out
                  hover:border-white hover:bg-white/18 hover:scale-[1.18]
                "
              >
                <ChevronDown className="w-[11px] h-[11px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Top10Slide.displayName = 'Top10Slide';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonSlide = ({ i }: { i: number }) => (
  <div
    className="flex-shrink-0 flex items-end"
    style={{ animationDelay: `${i * 70}ms` }}
  >
    <div className="w-[80px] h-[90px] bg-white/8 rounded animate-pulse mr-[-10px]" />
    <div className="w-[108px] h-[162px] bg-white/10 rounded-[4px] animate-pulse" />
  </div>
);

// ─── Carousel ─────────────────────────────────────────────────────────────────
interface Top10CarouselProps {
  title: string;
  items: (Movie | TVShow)[];
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  isLoading?: boolean;
  mobileItemsToShow?: 3 | 4;
}

export const Top10Carousel = ({
  title, items, onPlay, onMoreInfo,
  isLoading = false, mobileItemsToShow = 4,
}: Top10CarouselProps) => {
  const [scrollPos, setScrollPos] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [scrolling, setScrolling] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isInMyList, toggleMyList } = useMyList();
  const { showCarouselControls, isTV } = useDevice();
  const ctrlOpacity = carouselControlOpacity(showCarouselControls);

  const scroll = useCallback((dir: 'left' | 'right') => {
    if (!ref.current || scrolling) return;
    setScrolling(true);
    const amount = ref.current.clientWidth * 0.75;
    const next = dir === 'left'
      ? Math.max(0, scrollPos - amount)
      : scrollPos + amount;
    ref.current.scrollTo({ left: next, behavior: 'smooth' });
    setTimeout(() => { setScrolling(false); setScrollPos(next); }, 380);
  }, [scrollPos, scrolling]);

  const { handleKeyDown } = useCarouselKeyboard(ref, scroll);

  if (isLoading) {
    return (
      <div className="w-full mb-10 animate-fade-in">
        <div className="px-4 lg:px-16 mb-4">
          <div className="w-64 h-6 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 px-4 lg:px-16 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonSlide key={i} i={i} />)}
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  const top10 = items.slice(0, 10);

  return (
    <div className="group/row w-full mb-10 animate-fade-in overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-[10px] px-4 lg:px-16 mb-4 sm:mb-6">
        <h2 className="text-white font-bold text-[18px] sm:text-[20px] lg:text-[22px]
          tracking-tight leading-none">
          {title}
        </h2>

        {/* Authentic N + TOP 10 badge matching Netflix exactly */}
        <span className="
          hidden sm:inline-flex items-center gap-0
          bg-[#E50914] rounded-[3px] overflow-hidden
          text-white
        ">
          <span className="
            font-black text-[14px] leading-none
            px-[5px] py-[2px]
            border-r border-white/30
            tracking-tight
          " style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
            N
          </span>
          <span className="
            font-black text-[11px] leading-none
            px-[5px] py-[2px] tracking-[.08em]
          " style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
            TOP 10
          </span>
        </span>
      </div>

      {/* ── Track ── */}
      <div className="relative w-full">

        {/* Left arrow — appears on group hover */}
        {scrollPos > 0 && (
          <button
            onClick={() => scroll('left')}
            disabled={scrolling}
            aria-label={`Scroll ${title} left`}
            className={`
              absolute left-0 top-0 h-full z-20
              w-[40px] sm:w-[50px] lg:w-[60px]
              flex items-center justify-center
              bg-gradient-to-r from-black/85 to-transparent
              opacity-0 group-hover/row:opacity-100
              transition-opacity duration-300
              ${scrolling ? 'cursor-not-allowed' : 'cursor-pointer'}
              ${ctrlOpacity}
            `}
          >
            <span className="
              flex items-center justify-center
              w-[34px] h-[70px] rounded-[3px]
              bg-black/70 border border-white/20
              hover:bg-zinc-800/90 hover:border-white/50
              transition-all duration-200
              backdrop-blur-sm
            ">
              <ChevronLeft className={`w-5 h-5 text-white ${scrolling ? 'animate-pulse' : ''}`} />
            </span>
          </button>
        )}

        {/* Scroll track */}
        <div
          ref={ref}
          role="region"
          aria-label={title}
          tabIndex={0}
          className="
            flex items-end
            gap-[2px] sm:gap-[3px] lg:gap-[4px]
            px-4 lg:px-16
            pb-8
            overflow-x-auto scroll-smooth
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            outline-none tv-focus-ring
          "
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            if (!scrolling) setScrollPos(e.currentTarget.scrollLeft);
          }}
        >
          {top10.map((item, i) => (
            <Top10Slide
              key={item.id}
              item={item}
              index={i}
              mobileItemsToShow={mobileItemsToShow}
              onPlay={onPlay}
              onMoreInfo={onMoreInfo}
              hoveredId={hoveredItem}
              onHoverChange={setHoveredItem}
              isInMyList={isInMyList}
              toggleMyList={toggleMyList}
            />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          disabled={scrolling}
          aria-label={`Scroll ${title} right`}
          className={`
            absolute right-0 top-0 h-full z-20
            w-[40px] sm:w-[50px] lg:w-[60px]
            flex items-center justify-center
            bg-gradient-to-l from-black/85 to-transparent
            opacity-0 group-hover/row:opacity-100
            transition-opacity duration-300
            ${scrolling ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${ctrlOpacity}
          `}
        >
          <span className="
            flex items-center justify-center
            w-[34px] h-[70px] rounded-[3px]
            bg-black/70 border border-white/20
            hover:bg-zinc-800/90 hover:border-white/50
            transition-all duration-200
            backdrop-blur-sm
          ">
            <ChevronRight className={`w-5 h-5 text-white ${scrolling ? 'animate-pulse' : ''}`} />
          </span>
        </button>
      </div>
    </div>
  );
};
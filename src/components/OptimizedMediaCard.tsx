import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Play, Plus, ChevronDown, ThumbsUp, Check, Volume2, VolumeX } from 'lucide-react';
import { TMDB_IMAGE_URL, Movie, TVShow } from '@/lib/tmdb';
import { useMyList } from '@/hooks/useMyList';
import { useIsMobile, useIsTouchDevice } from '@/hooks/use-mobile';
import { useDevice } from '@/context/DeviceContext';
import { useTapWithoutScroll } from '@/hooks/useTapWithoutScroll';
import { LazyImage } from './LazyImage';
import { motion, AnimatePresence } from 'framer-motion';

const netflixNLogo = '/lovable-uploads/b39cfe51-d347-4b50-924c-4a5d672ff09c.png';

interface MediaCardProps {
  item: Movie | TVShow;
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  linkAsAnime?: boolean;
  /** Optional 1-based rank for "Top 10" rows */
  rank?: number;
  /** Optional 0-100 watch progress for "Continue Watching" rows */
  progress?: number;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
  10768: 'War & Politics',
};

/* ─── tiny reusable icon button ─────────────────────────────────── */
const IconBtn = ({
  onClick, title, filled = false, children,
}: {
  onClick?: (e: React.MouseEvent) => void;
  title: string;
  filled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick ?? ((e) => e.stopPropagation())}
    title={title}
    aria-label={title}
    className={`
      w-8 h-8 rounded-full flex items-center justify-center
      transition-all duration-150 active:scale-95
      ${filled
        ? 'bg-white hover:bg-white/85 shadow-md'
        : 'border-2 border-[#808080] text-white hover:border-white hover:bg-white/10'
      }
    `}
  >
    {children}
  </button>
);

/* ─── component ─────────────────────────────────────────────────── */
export const OptimizedMediaCard = React.memo(
  ({ item, onPlay, onMoreInfo, rank, progress }: MediaCardProps) => {
    const [isHovered, setIsHovered]   = useState(false);
    const [isMuted,   setIsMuted]     = useState(true);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { isInMyList, toggleMyList } = useMyList();
    const isMobile      = useIsMobile();
    const isTouchDevice = useIsTouchDevice();
    const { isTV }      = useDevice();

    /* ── derived data ──────────────────────────────────────────── */
    const {
      title, releaseYear, mediaType,
      posterUrl, backdropUrl,
      isNew, matchPct, genreLabels,
      isContinueWatching,
    } = useMemo(() => {
      const title =
        'title' in item ? item.title : item.name;
      const releaseDate =
        'release_date' in item ? item.release_date : item.first_air_date;
      const mediaType: 'movie' | 'tv' =
        'title' in item ? 'movie' : 'tv';

      const releaseYear = releaseDate
        ? new Date(releaseDate).getFullYear() : null;

      const isNew = releaseDate
        ? Date.now() - new Date(releaseDate).getTime() < 30 * 24 * 60 * 60 * 1000
        : false;

      const matchPct = Math.min(99, Math.round((item.vote_average / 10) * 100));

      const genreLabels = (item.genre_ids ?? [])
        .slice(0, 3)
        .map((id) => GENRE_MAP[id])
        .filter(Boolean) as string[];

      const posterUrl = item.poster_path
        ? item.poster_path.startsWith('http')
          ? item.poster_path
          : `${TMDB_IMAGE_URL.w500}${item.poster_path}`
        : '/placeholder.svg';

      const backdropUrl = item.backdrop_path
        ? item.backdrop_path.startsWith('http')
          ? item.backdrop_path
          : `${TMDB_IMAGE_URL.w500}${item.backdrop_path}`
        : posterUrl;

      return {
        title, releaseYear, mediaType,
        posterUrl, backdropUrl,
        isNew, matchPct, genreLabels,
        isContinueWatching: progress !== undefined,
      };
    }, [item, progress]);

    /* ── handlers ──────────────────────────────────────────────── */
    const handleMyList = useCallback(
      (e: React.MouseEvent) => { e.stopPropagation(); toggleMyList(item, mediaType); },
      [item, mediaType, toggleMyList],
    );
    const handlePlay = useCallback(
      (e: React.MouseEvent) => { e.stopPropagation(); onPlay(item, mediaType); },
      [item, mediaType, onPlay],
    );
    const handleMoreInfo = useCallback(
      (e: React.MouseEvent) => { e.stopPropagation(); onMoreInfo(item, mediaType); },
      [item, mediaType, onMoreInfo],
    );
    const openMoreInfo = useCallback(
      () => onMoreInfo(item, mediaType),
      [item, mediaType, onMoreInfo],
    );

    const { rootPointerHandlers, onRootClick } = useTapWithoutScroll(
      isTouchDevice, openMoreInfo,
    );

    /* ── delayed hover — 450 ms like real Netflix ──────────────── */
    const handleMouseEnter = useCallback(() => {
      if (isMobile || isTV) return;
      hoverTimeout.current = setTimeout(() => setIsHovered(true), 450);
    }, [isMobile, isTV]);

    const handleMouseLeave = useCallback(() => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      setIsHovered(false);
      setIsMuted(true);
    }, []);

    const inList = isInMyList(item.id);

    const panelWidth = rank
      ? 'clamp(200px, 15vw, 260px)'
      : 'clamp(220px, 18vw, 300px)';

    /* ─────────────────────────────────────────────────────────── */
    return (
      <div
        className="relative z-0 hover:z-[100]"
        style={{ zIndex: isHovered ? 100 : undefined }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Top-10 rank number ───────────────────────────────── */}
        {rank && (
          <span
            aria-hidden="true"
            className="
              pointer-events-none select-none
              absolute -left-8 bottom-0 z-10
              font-black leading-none text-[7rem]
              text-[#141414]
            "
            style={{ WebkitTextStroke: '4px #555', lineHeight: 1 }}
          >
            {rank}
          </span>
        )}

        {/* ── Base poster card ──────────────────────────────────── */}
        <div
          className={`
            relative overflow-hidden cursor-pointer select-none
            rounded-[3px] tv-focus-ring
            ${isContinueWatching ? 'aspect-video' : 'aspect-[2/3]'}
            ${rank ? 'ml-6' : ''}
          `}
          onClick={onRootClick}
          {...rootPointerHandlers}
        >
          <LazyImage
            src={isContinueWatching ? backdropUrl : posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: isHovered ? 'scale(1.04)' : 'scale(1)' }}
          />

          {/* Netflix N logo */}
          <div className="absolute top-1.5 left-1.5 z-10">
            <img
              src={netflixNLogo}
              alt="Netflix"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain drop-shadow"
            />
          </div>

          {/* NEW badge */}
          {isNew && (
            <div className="absolute top-1.5 right-1.5 z-10">
              <span className="
                bg-[#E50914] text-white font-black
                text-[8px] sm:text-[9px] tracking-wider
                px-1 py-0.5 rounded-sm leading-none
              ">
                NEW
              </span>
            </div>
          )}

          {/* Continue-watching progress bar on poster */}
          {isContinueWatching && progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
              <div
                className="h-full bg-[#E50914] transition-all duration-500"
                style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              />
            </div>
          )}

          {/* TV: always-visible title strip */}
          {isTV && (
            <div className="
              absolute bottom-0 left-0 right-0
              px-2 py-1.5 z-10
              bg-gradient-to-t from-black/90 to-transparent
            ">
              <h3 className="text-white text-[11px] font-semibold line-clamp-2 leading-snug">
                {title}
              </h3>
            </div>
          )}

          {/* Mobile press feedback */}
          {isMobile && (
            <div className="
              absolute inset-0
              bg-black/0 active:bg-black/25
              transition-colors duration-100
            " />
          )}
        </div>

        {/* ── Desktop hover pop-up panel ────────────────────────── */}
        <AnimatePresence>
          {isHovered && !isMobile && !isTV && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{   opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="
                absolute left-1/2 -translate-x-1/2 z-[100]
                rounded-md overflow-hidden
                shadow-[0_12px_48px_rgba(0,0,0,0.9)]
                border border-[#333]
              "
              style={{
                width: panelWidth,
                top: 0,
                transformOrigin: 'top center',
              }}
            >
              {/* Backdrop thumbnail */}
              <div
                className="group/thumb relative w-full aspect-video cursor-pointer"
                onClick={handleMoreInfo}
              >
                <img
                  src={backdropUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* bottom fade */}
                <div className="
                  absolute inset-0
                  bg-gradient-to-t from-[#141414]/80 via-transparent to-transparent
                " />

                {/* Play on hover */}
                <button
                  type="button"
                  onClick={handlePlay}
                  className="
                    absolute inset-0 flex items-center justify-center
                    opacity-0 group-hover/thumb:opacity-100
                    transition-opacity duration-200
                    focus:outline-none
                  "
                >
                  <div className="
                    w-12 h-12 rounded-full bg-white/90
                    flex items-center justify-center shadow-xl
                    scale-90 group-hover/thumb:scale-100
                    transition-transform duration-200
                  ">
                    <Play className="h-5 w-5 text-black fill-black ml-0.5" />
                  </div>
                </button>

                {/* Mute toggle */}
                <button
                  title={isMuted ? 'Unmute' : 'Mute'}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m); }}
                  className="
                    absolute bottom-2 right-2
                    w-6 h-6 rounded-full
                    border border-white/60 bg-black/60 text-white
                    flex items-center justify-center
                    hover:border-white hover:bg-black/80
                    transition-all duration-150
                    opacity-0 group-hover/thumb:opacity-100
                  "
                >
                  {isMuted
                    ? <VolumeX className="h-3 w-3" />
                    : <Volume2 className="h-3 w-3" />
                  }
                </button>
              </div>

              {/* Info panel */}
              <div
                className="px-3 pt-2.5 pb-3.5 space-y-2.5"
                style={{ background: '#141414' }}
              >
                {/* Title */}
                <h3
                  className="text-white font-bold text-[0.8rem] leading-snug line-clamp-1"
                  style={{
                    fontFamily:
                      "'Netflix Sans','Helvetica Neue',Helvetica,Arial,sans-serif",
                  }}
                >
                  {title}
                </h3>

                {/* Action row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <IconBtn onClick={handlePlay} title="Play" filled>
                      <Play className="h-4 w-4 text-black fill-black ml-0.5" />
                    </IconBtn>

                    <IconBtn
                      onClick={handleMyList}
                      title={inList ? 'Remove from My List' : 'Add to My List'}
                    >
                      {inList
                        ? <Check className="h-3.5 w-3.5" />
                        : <Plus  className="h-4   w-4"   />
                      }
                    </IconBtn>

                    <IconBtn title="I like this">
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>

                  <IconBtn onClick={handleMoreInfo} title="More Info">
                    <ChevronDown className="h-4 w-4" />
                  </IconBtn>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 text-[11px] flex-wrap">
                  <span className="text-[#46d369] font-bold">{matchPct}% Match</span>
                  {releaseYear && (
                    <span className="text-[#bcbcbc]">{releaseYear}</span>
                  )}
                  <span className="
                    border border-[#808080] text-[#bcbcbc]
                    text-[9px] px-1 py-[1px] rounded-sm leading-none
                  ">
                    {mediaType === 'movie' ? 'Movie' : 'Series'}
                  </span>
                  <span className="
                    border border-[#808080] text-[#bcbcbc]
                    text-[9px] px-1 py-[1px] rounded-sm leading-none
                  ">
                    HD
                  </span>
                </div>

                {/* Genre dots */}
                {genreLabels.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {genreLabels.map((g, i) => (
                      <React.Fragment key={g}>
                        <span className="text-[#bcbcbc] text-[10px]">{g}</span>
                        {i < genreLabels.length - 1 && (
                          <span className="w-[3px] h-[3px] rounded-full bg-[#808080] inline-block" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Continue-watching footer */}
                {isContinueWatching && progress !== undefined && (
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#bcbcbc]">
                      <span>{progress}% watched</span>
                      <span>{100 - progress}% remaining</span>
                    </div>
                    <div className="w-full h-[3px] bg-[#555] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E50914] rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
  (prev, next) =>
    prev.item.id           === next.item.id &&
    prev.item.vote_average === next.item.vote_average &&
    prev.rank              === next.rank &&
    prev.progress          === next.progress,
);

OptimizedMediaCard.displayName = 'OptimizedMediaCard';
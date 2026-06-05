import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Play, Plus, ChevronDown, ThumbsUp, Check } from 'lucide-react';
import { TMDB_IMAGE_URL, Movie, TVShow } from '@/lib/tmdb';
import { useMyList } from '@/hooks/useMyList';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile, useIsTouchDevice } from '@/hooks/use-mobile';
import { useTapWithoutScroll } from '@/hooks/useTapWithoutScroll';
import { LazyImage } from './LazyImage';

const netflixNLogo = '/lovable-uploads/b39cfe51-d347-4b50-924c-4a5d672ff09c.png';

interface MediaCardProps {
  item: Movie | TVShow;
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}

// Derive a short genre label from genre_ids (TMDB genre map subset)
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

export const MediaCard = React.memo(({ item, onPlay, onMoreInfo }: MediaCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isInMyList, toggleMyList } = useMyList();
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();

  const { title, releaseYear, mediaType, posterUrl, backdropUrl, isNew, matchPct, genreLabels } =
    useMemo(() => {
      const title = 'title' in item ? item.title : item.name;
      const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
      const mediaType: 'movie' | 'tv' = 'title' in item ? 'movie' : 'tv';
      const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;

      const isNew = releaseDate
        ? Date.now() - new Date(releaseDate).getTime() < 30 * 24 * 60 * 60 * 1000
        : false;

      const matchPct = Math.min(99, Math.round((item.vote_average / 10) * 100));

      const genreLabels = (item.genre_ids || [])
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
        title,
        releaseYear,
        mediaType,
        posterUrl,
        backdropUrl,
        isNew,
        matchPct,
        genreLabels,
      };
    }, [item]);

  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onPlay(item, mediaType); },
    [item, mediaType, onPlay]
  );
  const handleMyListClick = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); toggleMyList(item, mediaType); },
    [item, mediaType, toggleMyList]
  );
  const handleMoreInfoClick = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onMoreInfo(item, mediaType); },
    [item, mediaType, onMoreInfo]
  );
  const openMoreInfo = useCallback(
    () => onMoreInfo(item, mediaType),
    [item, mediaType, onMoreInfo]
  );

  const { rootPointerHandlers, onRootClick } = useTapWithoutScroll(isTouchDevice, openMoreInfo);

  // Delayed hover — Netflix waits ~500ms before expanding
  const handleMouseEnter = () => {
    if (isMobile) return;
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 450);
  };
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(false);
  };

  const inList = isInMyList(item.id);

  return (
    <div
      className="relative"
      style={{ zIndex: isHovered ? 50 : 'auto' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Base card (poster) ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[3px] cursor-pointer select-none"
        style={{ aspectRatio: '2/3' }}
        onClick={onRootClick}
        {...rootPointerHandlers}
      >
        <LazyImage
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: isHovered ? 'scale(1.04)' : 'scale(1)' }}
        />

        {/* Netflix N logo */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <img src={netflixNLogo} alt="N" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain drop-shadow" />
        </div>

        {/* NEW badge */}
        {isNew && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <span className="bg-[#E50914] text-white text-[8px] sm:text-[9px] font-black px-1 py-0.5 rounded-sm leading-none tracking-wider">
              NEW
            </span>
          </div>
        )}

        {/* Mobile tap overlay — just a subtle gradient, no hover panel */}
        {isMobile && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 active:opacity-100 transition-opacity duration-150" />
        )}
      </div>

      {/* ── Desktop hover card (expands below, Netflix style) ─────────── */}
      <AnimatePresence>
        {isHovered && !isMobile && (
          <motion.div
            key="hover-panel"
            initial={{ opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 4 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute left-1/2 -translate-x-1/2 z-50 rounded-md overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.85)]"
            style={{
              width: 'clamp(220px, 18vw, 300px)',
              top: 0,
              // Pull up so it aligns from top of poster
              transformOrigin: 'top center',
            }}
          >
            {/* ── Backdrop thumbnail ─────────────────────────────────── */}
            <div
              className="relative w-full cursor-pointer"
              style={{ aspectRatio: '16/9' }}
              onClick={handlePlayClick}
            >
              <img
                src={backdropUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Dark overlay so play icon is visible */}
              <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors duration-200" />
              {/* Play icon on thumb hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                  <Play className="h-6 w-6 text-black fill-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* ── Info panel ─────────────────────────────────────────── */}
            <div className="bg-[#141414] px-3 pt-3 pb-4 space-y-2.5">
              {/* Title */}
              <h3
                className="text-white font-bold text-[0.8rem] leading-snug line-clamp-1"
                style={{ fontFamily: "'Netflix Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                {title}
              </h3>

              {/* Action row */}
              <div className="flex items-center justify-between">
                {/* Left: Play, My List, Like */}
                <div className="flex items-center gap-1.5">
                  {/* Play */}
                  <button
                    onClick={handlePlayClick}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center
                               hover:bg-white/85 transition-colors duration-150 shadow-md"
                    title="Play"
                  >
                    <Play className="h-4 w-4 text-black fill-black ml-0.5" />
                  </button>

                  {/* My List */}
                  <button
                    onClick={handleMyListClick}
                    className="w-8 h-8 rounded-full border-2 border-[#808080] flex items-center justify-center
                               text-white hover:border-white transition-colors duration-150"
                    title={inList ? 'Remove from My List' : 'Add to My List'}
                  >
                    {inList
                      ? <Check className="h-4 w-4" />
                      : <Plus className="h-4 w-4" />
                    }
                  </button>

                  {/* Like (thumbs up) */}
                  <button
                    className="w-8 h-8 rounded-full border-2 border-[#808080] flex items-center justify-center
                               text-white hover:border-white transition-colors duration-150"
                    title="I like this"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Right: More Info chevron */}
                <button
                  onClick={handleMoreInfoClick}
                  className="w-8 h-8 rounded-full border-2 border-[#808080] flex items-center justify-center
                             text-white hover:border-white transition-colors duration-150"
                  title="More Info"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Meta row: match, year, type */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-green-500 font-bold">{matchPct}% Match</span>
                {releaseYear && <span className="text-[#bcbcbc]">{releaseYear}</span>}
                <span className="border border-[#808080] text-[#bcbcbc] text-[9px] px-1 py-[1px] rounded-sm leading-none">
                  {mediaType === 'movie' ? 'Movie' : 'Series'}
                </span>
                <span className="border border-[#808080] text-[#bcbcbc] text-[9px] px-1 py-[1px] rounded-sm leading-none">
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
                        <span className="w-1 h-1 rounded-full bg-[#808080] inline-block" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

import { memo, useCallback } from 'react';
import { Play } from 'lucide-react';
import { Movie, TVShow } from '@/lib/tmdb';
import { MediaCard } from './MediaCard';
import { useIsMobile, useIsTouchDevice } from '@/hooks/use-mobile';
import { useTapWithoutScroll } from '@/hooks/useTapWithoutScroll';

interface MobileRowProps {
  item: Movie | TVShow;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl: string;
  year: string;
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}

const MobileRow = memo(
  ({ item, mediaType, title, posterUrl, year, onPlay, onMoreInfo }: MobileRowProps) => {
    const isTouchDevice = useIsTouchDevice();
    const openMore = useCallback(() => onMoreInfo(item, mediaType), [item, mediaType, onMoreInfo]);
    const { rootPointerHandlers, onRootClick } = useTapWithoutScroll(isTouchDevice, openMore);

    return (
      <div
        className="flex items-center gap-3 py-2.5 border-b border-white/[0.07] cursor-pointer group"
        onClick={onRootClick}
        {...rootPointerHandlers}
      >
        <div className="w-[45px] h-[64px] flex-shrink-0 rounded-[2px] overflow-hidden bg-[#2a2a2a]">
          <img src={posterUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-medium leading-snug line-clamp-2">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            {year && <span className="text-white/40 text-[11px]">{year}</span>}
            <span className="text-white/30 text-[11px]">
              {mediaType === 'tv' ? 'TV Series' : 'Movie'}
            </span>
          </div>
          {item.overview && (
            <p className="text-white/40 text-[11px] mt-1 line-clamp-2 leading-relaxed">
              {item.overview}
            </p>
          )}
        </div>

        <button
          type="button"
          className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0 text-white/60 hover:text-white hover:border-white transition-all active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onPlay(item, mediaType);
          }}
          aria-label={`Play ${title}`}
        >
          <Play className="h-3.5 w-3.5 fill-current ml-[1px]" />
        </button>
      </div>
    );
  }
);

MobileRow.displayName = 'MobileRow';

interface SearchResultsProps {
  results: (Movie | TVShow)[];
  query: string;
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  isLoading?: boolean;
}

const getMediaType = (item: Movie | TVShow): 'movie' | 'tv' =>
  'title' in item ? 'movie' : 'tv';

const getTitle = (item: Movie | TVShow) => ('title' in item ? item.title : item.name);

const getYear = (item: Movie | TVShow) =>
  ('release_date' in item ? item.release_date : item.first_air_date)?.slice(0, 4) ?? '';

const getPosterUrl = (item: Movie | TVShow) =>
  item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '/placeholder.svg';

export const SearchResults = ({
  results,
  query,
  onPlay,
  onMoreInfo,
  isLoading = false,
}: SearchResultsProps) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="px-4 lg:px-16 pt-20 pb-8">
        <div className="h-5 w-52 bg-white/10 rounded animate-pulse mb-8" />
        {isMobile ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-[45px] h-[64px] bg-white/10 rounded-[2px] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                  <div className="h-2 bg-white/10 rounded w-1/3" />
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/10 animate-pulse rounded-[2px]" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!query) return null;

  return (
    <div className="px-4 lg:px-16 pt-20 pb-12 animate-fade-in">
      <p className="text-white/60 text-[13px] mb-6 tracking-wide">
        {results.length > 0 ? (
          <>
            Results for <span className="text-white font-medium">&quot;{query}&quot;</span>
          </>
        ) : (
          <>
            No results found for <span className="text-white font-medium">&quot;{query}&quot;</span>
          </>
        )}
      </p>

      {results.length > 0 &&
        (isMobile ? (
          <div>
            {results.map((item) => (
              <MobileRow
                key={item.id}
                item={item}
                mediaType={getMediaType(item)}
                title={getTitle(item)}
                posterUrl={getPosterUrl(item)}
                year={getYear(item)}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {results.map((item) => (
              <MediaCard key={item.id} item={item} onPlay={onPlay} onMoreInfo={onMoreInfo} />
            ))}
          </div>
        ))}
    </div>
  );
};

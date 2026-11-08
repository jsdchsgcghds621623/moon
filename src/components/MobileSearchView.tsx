import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Play, ChevronLeft } from 'lucide-react';
import { Movie, TVShow } from '@/lib/tmdb';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch, useTrending } from '@/hooks/useTMDBQuery';
import {
  getSearchMediaType,
  getSearchTitle,
  getSearchYear,
  getSearchPosterUrl,
} from '@/lib/searchHelpers';

const STORAGE_DISPLAY = 'mf_current_search';
const STORAGE_FOCUS = 'mf_search_focus';

interface SearchRowProps {
  item: Movie | TVShow;
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}

const SearchRow = memo(({ item, onPlay, onMoreInfo }: SearchRowProps) => {
  const mediaType = getSearchMediaType(item);
  const title = getSearchTitle(item);
  const year = getSearchYear(item);

  const handleRowClick = () => onMoreInfo(item, mediaType);

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] active:bg-white/[0.06] cursor-pointer"
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      <div className="w-[52px] h-[74px] flex-shrink-0 rounded-[3px] overflow-hidden bg-[#2a2a2a]">
        <img
          src={getSearchPosterUrl(item, 'w92')}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-[15px] font-medium leading-snug line-clamp-2">{title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {year && <span className="text-white/45 text-xs">{year}</span>}
          <span className="text-white/35 text-xs">
            {mediaType === 'tv' ? 'TV Series' : 'Movie'}
          </span>
          {item.vote_average > 0 && (
            <span className="text-[#46d369] text-xs font-semibold">
              {Math.round(item.vote_average * 10)}% Match
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="w-10 h-10 rounded-full border-2 border-white/50 flex items-center justify-center flex-shrink-0 text-white active:scale-95 transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          onPlay(item, mediaType);
        }}
        aria-label={`Play ${title}`}
      >
        <Play className="h-4 w-4 fill-current ml-0.5" />
      </button>
    </div>
  );
});

SearchRow.displayName = 'SearchRow';

interface MobileSearchViewProps {
  initialQuery?: string;
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onQueryChange?: (query: string) => void;
}

export const MobileSearchView = ({
  initialQuery = '',
  onPlay,
  onMoreInfo,
  onQueryChange,
}: MobileSearchViewProps) => {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQ = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: results = [], isLoading } = useSearch(
    debouncedQ,
    debouncedQ.trim().length > 0
  );
  const { data: trending = [] } = useTrending('all', 'week');

  const updateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      onQueryChange?.(value);
      const trimmed = value.trim();
      if (trimmed) {
        sessionStorage.setItem(STORAGE_DISPLAY, trimmed);
      } else {
        sessionStorage.removeItem(STORAGE_DISPLAY);
      }
    },
    [onQueryChange]
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_FOCUS) === '1') {
      sessionStorage.removeItem(STORAGE_FOCUS);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, []);

  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  const handleClose = () => {
    sessionStorage.removeItem(STORAGE_DISPLAY);
    sessionStorage.removeItem('mf_pending_search');
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/browse');
    }
  };

  const showTrending = !debouncedQ.trim();
  const trendingItems = trending.slice(0, 12);

  return (
    <div className="fixed inset-0 z-[100] bg-[#141414] flex flex-col pt-safe pb-safe">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.08] shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-10 text-white/90 active:text-white"
          aria-label="Close search"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex-1 flex items-center gap-2 bg-[#1f1f1f] border border-white/20 rounded-sm px-3 py-2 min-w-0">
          <Search className="h-4 w-4 text-white/50 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Titles, people, genres"
            aria-label="Search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-white text-base placeholder:text-white/35 outline-none min-w-0"
          />
          {isLoading && debouncedQ.trim() ? (
            <Loader2 className="h-4 w-4 text-white/50 animate-spin flex-shrink-0" aria-hidden />
          ) : query ? (
            <button
              type="button"
              onClick={() => updateQuery('')}
              className="text-white/50 p-1 active:text-white"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="text-white/80 text-sm font-medium px-1 active:text-white shrink-0"
        >
          Cancel
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {showTrending ? (
          <div className="py-4">
            <p className="px-4 text-white/50 text-xs uppercase tracking-widest mb-3">
              Top searches
            </p>
            {trendingItems.length > 0 ? (
              trendingItems.map((item) => (
                <SearchRow
                  key={`trend-${item.id}`}
                  item={item}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                />
              ))
            ) : (
              <p className="px-4 text-white/40 text-sm text-center py-12">
                Search for movies, TV shows, and more
              </p>
            )}
          </div>
        ) : isLoading ? (
          <div className="py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-[52px] h-[74px] bg-white/10 rounded-[3px]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-4 py-16 text-center text-white/40 text-sm">
            No results for &quot;{debouncedQ}&quot;
          </p>
        ) : (
          <div>
            <p className="px-4 py-3 text-white/50 text-xs">
              {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{debouncedQ}&quot;
            </p>
            {results.map((item) => (
              <SearchRow
                key={`${getSearchMediaType(item)}-${item.id}`}
                item={item}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

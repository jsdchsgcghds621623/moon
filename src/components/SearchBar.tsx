import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { Movie, TVShow, searchMulti } from '@/lib/tmdb';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavbarSearchRegistry } from '@/context/NavbarSearchContext';
import {
  getSearchMediaType,
  getSearchTitle,
  getSearchPosterUrl,
  isSearchMediaResult,
} from '@/lib/searchHelpers';

const STORAGE_PENDING = 'mf_pending_search';
const STORAGE_DISPLAY = 'mf_current_search';
const STORAGE_FOCUS = 'mf_search_focus';

interface SearchBarProps {
  onSearchOpen?: (open: boolean) => void;
}

export const SearchBar = ({ onSearchOpen }: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebounce(query, 300);

  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { notifySearch, onPlay, onMoreInfo } = useNavbarSearchRegistry();

  const openSearch = useCallback(() => {
    if (isMobile) {
      sessionStorage.setItem(STORAGE_FOCUS, '1');
      if (location.pathname !== '/search') {
        navigate('/search');
      }
      onSearchOpen?.(true);
      return;
    }
    setIsOpen(true);
    onSearchOpen?.(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [isMobile, location.pathname, navigate, onSearchOpen]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSuggestions([]);
    setActiveIndex(-1);
    onSearchOpen?.(false);
  }, [onSearchOpen]);

  const commitFullSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      notifySearch(trimmed);

      if (trimmed) {
        sessionStorage.setItem(STORAGE_DISPLAY, trimmed);
        if (location.pathname === '/search') return;

        if (location.pathname === '/browse' || location.pathname === '/') {
          return;
        }

        sessionStorage.setItem(STORAGE_PENDING, trimmed);
        navigate('/search');
      } else {
        sessionStorage.removeItem(STORAGE_PENDING);
        sessionStorage.removeItem(STORAGE_DISPLAY);
        if (location.pathname === '/search') {
          navigate('/browse');
        }
      }
    },
    [location.pathname, navigate, notifySearch]
  );

  useEffect(() => {
    if (location.pathname !== '/search') return;
    setIsOpen(true);
    const pending = sessionStorage.getItem(STORAGE_PENDING);
    const stored = sessionStorage.getItem(STORAGE_DISPLAY) || '';
    const initial = pending || stored;
    if (initial) {
      setQuery(initial);
      notifySearch(initial);
      if (pending) sessionStorage.removeItem(STORAGE_PENDING);
    }
  }, [location.pathname, notifySearch]);

  useEffect(() => {
    if (location.pathname !== '/search' || !isOpen) return;
    notifySearch(debouncedQ);
    const trimmed = debouncedQ.trim();
    if (trimmed) {
      sessionStorage.setItem(STORAGE_DISPLAY, trimmed);
    } else {
      sessionStorage.removeItem(STORAGE_DISPLAY);
    }
  }, [debouncedQ, location.pathname, isOpen, notifySearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, closeSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeSearch]);

  useEffect(() => {
    if (!debouncedQ.trim()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    searchMulti(debouncedQ)
      .then((res) => {
        if (!cancelled) {
          const items = (res.results ?? []).filter(isSearchMediaResult).slice(0, 8);
          setSuggestions(items);
          setActiveIndex(-1);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const handleSuggestionSelect = (item: Movie | TVShow) => {
    if (onMoreInfo) {
      onMoreInfo(item, getSearchMediaType(item));
    }
    closeSearch();
  };

  const handlePlayClick = (e: React.MouseEvent, item: Movie | TVShow) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(item, getSearchMediaType(item));
    }
    closeSearch();
  };

  const handleSeeAll = () => {
    commitFullSearch(query);
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSuggestionSelect(suggestions[activeIndex]);
      } else if (query.trim()) {
        handleSeeAll();
      }
    }
  };

  if (isMobile && location.pathname === '/search') {
    return null;
  }

  if (isMobile) {
    return (
      <button
        type="button"
        onClick={openSearch}
        className="flex md:hidden items-center justify-center w-8 h-8 text-white/80 hover:text-white transition-colors rounded-md active:bg-white/10"
        aria-label="Open search"
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative hidden md:flex items-center">
      {!isOpen && (
        <button
          type="button"
          onClick={openSearch}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-white/80 hover:text-white transition-colors rounded-md hover:bg-white/10"
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <div
          className="
            flex items-center gap-2
            border border-white/70 bg-black/90 backdrop-blur-md
            pl-3 pr-2 py-1.5
            w-[220px] sm:w-[280px] md:w-[340px]
            transition-all duration-200
          "
        >
          <Search className="h-4 w-4 text-white/60 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Titles, people, genres"
            aria-label="Search"
            aria-expanded={Boolean(query && (suggestions.length || isLoading))}
            aria-autocomplete="list"
            className="
              flex-1 bg-transparent text-white text-sm placeholder:text-white/40
              outline-none border-none caret-white min-w-0
            "
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-white/50 animate-spin flex-shrink-0" aria-hidden />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="text-white/50 hover:text-white transition-colors flex-shrink-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={closeSearch}
              className="text-white/50 hover:text-white transition-colors flex-shrink-0"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {isOpen && query && (
        <div
          role="listbox"
          className="
            absolute top-full right-0 mt-1 z-[200]
            w-[min(100vw-1.5rem,320px)] sm:w-[400px] md:w-[480px]
            bg-[#141414] border border-white/10
            shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto
          "
        >
          {suggestions.length === 0 && !isLoading && (
            <div className="px-4 py-5 text-sm text-white/40 text-center">
              No results for &quot;{query}&quot;
            </div>
          )}

          {suggestions.map((item, index) => {
            const title = getSearchTitle(item);
            const mediaType = getSearchMediaType(item);
            const year =
              'release_date' in item
                ? item.release_date?.slice(0, 4)
                : item.first_air_date?.slice(0, 4);

            return (
              <div
                key={`${mediaType}-${item.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`
                  flex items-center gap-3 px-3 py-2.5 cursor-pointer
                  transition-colors duration-100 group
                  ${index === activeIndex ? 'bg-white/15' : 'hover:bg-white/10'}
                  ${index > 0 ? 'border-t border-white/[0.06]' : ''}
                `}
                onClick={() => handleSuggestionSelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="w-[45px] h-[64px] flex-shrink-0 rounded-[2px] overflow-hidden bg-[#2a2a2a]">
                  <img
                    src={getSearchPosterUrl(item)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-medium leading-snug line-clamp-2">
                    {title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {year && <span className="text-white/45 text-[11px]">{year}</span>}
                    <span className="text-white/30 text-[11px]">
                      {mediaType === 'tv' ? 'TV Series' : 'Movie'}
                    </span>
                    {item.vote_average > 0 && (
                      <span className="text-[#46d369] text-[11px] font-medium">
                        {Math.round(item.vote_average * 10)}% Match
                      </span>
                    )}
                  </div>
                </div>

                {onPlay && (
                  <button
                    type="button"
                    className="
                      w-8 h-8 rounded-full border border-white/40
                      flex items-center justify-center flex-shrink-0
                      text-white/60 hover:text-white hover:border-white
                      opacity-0 group-hover:opacity-100 focus:opacity-100
                      transition-all duration-150
                    "
                    onClick={(e) => handlePlayClick(e, item)}
                    aria-label={`Play ${title}`}
                  >
                    <svg className="h-3.5 w-3.5 fill-current ml-[1px]" viewBox="0 0 16 16" aria-hidden>
                      <path d="M3 2l10 6-10 6z" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {suggestions.length > 0 && (
            <div className="border-t border-white/[0.06] px-4 py-3 text-center">
              <button
                type="button"
                className="text-[12px] text-white/50 hover:text-white transition-colors tracking-wide uppercase"
                onClick={handleSeeAll}
              >
                See all results for &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

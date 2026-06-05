import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchResults } from '@/components/SearchResults';
import { MobileSearchView } from '@/components/MobileSearchView';
import { MediaModalLazy as MediaModal } from '@/components/MediaModalLazy';
import { useRegisterNavbarSearch, useRegisterNavbarSearchActions } from '@/context/NavbarSearchContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Movie, TVShow } from '@/lib/tmdb';
import { useSearch } from '@/hooks/useTMDBQuery';

const STORAGE_PENDING = 'mf_pending_search';
const STORAGE_DISPLAY = 'mf_current_search';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (
      sessionStorage.getItem(STORAGE_PENDING) ||
      sessionStorage.getItem(STORAGE_DISPLAY) ||
      ''
    );
  });

  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const { addToContinueWatching } = useContinueWatching();

  const { data: searchResults = [], isLoading: isSearching } = useSearch(
    query,
    query.trim().length > 0
  );

  useEffect(() => {
    let createdMeta: HTMLMetaElement | null = null;
    const existing = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const previous = existing?.getAttribute('content') ?? null;

    if (existing) {
      existing.setAttribute('content', 'noindex, nofollow');
    } else {
      createdMeta = document.createElement('meta');
      createdMeta.setAttribute('name', 'robots');
      createdMeta.setAttribute('content', 'noindex, nofollow');
      document.head.appendChild(createdMeta);
    }

    return () => {
      if (createdMeta) {
        createdMeta.remove();
      } else if (existing) {
        if (previous) existing.setAttribute('content', previous);
        else existing.removeAttribute('content');
      }
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== '/search') return;

    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('q');
    if (fromUrl) {
      setQuery(fromUrl);
      sessionStorage.setItem(STORAGE_DISPLAY, fromUrl);
      navigate('/search', { replace: true });
      return;
    }

    const pending = sessionStorage.getItem(STORAGE_PENDING);
    const stored = sessionStorage.getItem(STORAGE_DISPLAY);
    const initial = pending || stored;
    if (initial) {
      setQuery(initial);
      if (pending) sessionStorage.removeItem(STORAGE_PENDING);
      sessionStorage.setItem(STORAGE_DISPLAY, initial);
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (location.pathname === '/search') {
      sessionStorage.setItem(STORAGE_DISPLAY, query);
    }
  }, [query, location.pathname]);

  const handlePlay = useCallback(async (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    try {
      setSelectedItem(item);
      setSelectedMediaType(mediaType);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error playing content:', error);
    }
  }, []);

  const handleMoreInfo = useCallback((item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  }, []);

  const navbarSearchActions = useMemo(
    () => ({ onPlay: handlePlay, onMoreInfo: handleMoreInfo }),
    [handlePlay, handleMoreInfo]
  );

  useRegisterNavbarSearch(setQuery);
  useRegisterNavbarSearchActions(navbarSearchActions);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
  }, []);

  const modal = (
    <MediaModal
      isOpen={isModalOpen && selectedItem !== null}
      onClose={closeModal}
      item={selectedItem}
      mediaType={selectedMediaType}
      onPlay={handlePlay}
      onMoreInfo={handleMoreInfo}
    />
  );

  if (isMobile) {
    return (
      <>
        <MobileSearchView
          initialQuery={query}
          onQueryChange={setQuery}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
        />
        {modal}
      </>
    );
  }

  return (
    <>
      <SearchResults
        results={searchResults}
        query={query}
        onPlay={handlePlay}
        onMoreInfo={handleMoreInfo}
        isLoading={isSearching}
      />
      {modal}
    </>
  );
};

export default Search;

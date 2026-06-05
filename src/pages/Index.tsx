import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { MediaCarousel } from '@/components/MediaCarousel';
import { SearchResults } from '@/components/SearchResults';
import { MyListSection } from '@/components/MyListSection';
// import { ContinueWatchingCarousel } from '@/components/ContinueWatchingCarousel';
import { Top10Carousel } from '@/components/Top10Carousel';
import { useRegisterNavbarSearch, useRegisterNavbarSearchActions } from '@/context/NavbarSearchContext';

// Lazy load heavy components
const MediaModal = lazy(() => import('@/components/MediaModalLazy').then(module => ({ default: module.MediaModalLazy })));
const TrailerModal = lazy(() => import('@/components/TrailerModal').then(module => ({ default: module.TrailerModal })));

import {
  Movie,
  TVShow,
  getMovieDetails,
  getTVShowDetails,
} from '@/lib/tmdb';
import {
  useTrending,
  usePopularMovies,
  usePopularTVShows,
  useTopRatedTVShows,
  useUpcomingMovies,
  useNowPlayingMovies,
  useMoviesByGenre,
  useNetflixMovies,
  useSearch,
  useAnimeShows,
  useKDramaShows,
  useSciFiFantasyShows,
  useIndianMovies,
} from '@/hooks/useTMDBQuery';
// import { useContinueWatching } from '@/hooks/useContinueWatching';
import { deduplicateContent, filterDuplicates } from '@/utils/deduplication';

const scheduleIdleWork = (cb: () => void) => {
  const w = window as Window & {
    requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout: 350 });
    return () => w.cancelIdleCallback?.(id);
  }
  const t = window.setTimeout(cb, 350);
  return () => window.clearTimeout(t);
};

const Index = memo(() => {
  const [currentSection, setCurrentSection] = useState('home');
  const [idleFeedsActive, setIdleFeedsActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<'continue-watching' | 'default'>('default');
  
  // const { addToContinueWatching } = useContinueWatching();

  useEffect(() => scheduleIdleWork(() => setIdleFeedsActive(true)), []);

  // Above-the-fold + dedupe sources: load immediately. Lower rows: after idle (see idleFeedsActive).
  const { data: trending = [], isLoading: isTrendingLoading } = useTrending('all', 'week');
  const { data: popularMovies = [], isLoading: isPopularMoviesLoading } = usePopularMovies();
  const { data: popularTVShows = [], isLoading: isPopularTVLoading } = usePopularTVShows();
  const { data: nowPlayingMovies = [], isLoading: isNowPlayingLoading } = useNowPlayingMovies();
  const { data: netflixMovies = [], isLoading: isNetflixMoviesLoading } = useNetflixMovies();

  const { data: topRatedTVShows = [], isLoading: isTopRatedTVLoading } = useTopRatedTVShows(idleFeedsActive);
  const { data: upcomingMovies = [], isLoading: isUpcomingLoading } = useUpcomingMovies(idleFeedsActive);
  const { data: actionMovies = [], isLoading: isActionLoading } = useMoviesByGenre(28, idleFeedsActive);
  const { data: indianMovies = [], isLoading: isIndianLoading } = useIndianMovies(idleFeedsActive);
  const { data: horrorMovies = [], isLoading: isHorrorLoading } = useMoviesByGenre(27, idleFeedsActive);
  const { data: animeShows = [], isLoading: isAnimeLoading } = useAnimeShows(idleFeedsActive);
  const { data: kDramaShows = [], isLoading: isKDramaLoading } = useKDramaShows(idleFeedsActive);
  const { data: sciFiFantasyShows = [], isLoading: isSciFiFantasyLoading } = useSciFiFantasyShows(idleFeedsActive);

  // Search with React Query
  const { data: searchResults = [], isLoading: isSearching } = useSearch(searchQuery, searchQuery.trim().length > 0);
  
  // Determine if any content is loading
  const isLoading = isTrendingLoading || isPopularMoviesLoading || isPopularTVLoading;

  // Deduplicate content across categories to prevent repetition
  const deduplicatedContent = useMemo(() => {
    const allContent = {
      trending,
      nowPlaying: nowPlayingMovies,
      popularMovies,
      popularTVShows,
      topRatedTVShows,
      upcomingMovies,
      actionMovies,
      indianMovies,
      horrorMovies,
      animeShows,
      kDramaShows,
      sciFiFantasyShows,
    };

    return deduplicateContent(allContent, [
      'trending',
      'nowPlaying',
      'popularMovies',
      'popularTVShows',
    ]);
  }, [
    trending,
    nowPlayingMovies,
    popularMovies,
    popularTVShows,
    topRatedTVShows,
    upcomingMovies,
    actionMovies,
    indianMovies,
    horrorMovies,
    animeShows,
    kDramaShows,
    sciFiFantasyShows
  ]);

  // Debounced search handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setCurrentSection('search');
      } else {
        setCurrentSection('home');
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setCurrentSection('search');
    } else {
      setCurrentSection('home');
    }
  }, []);

  const handlePlay = useCallback(async (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    try {
      // addToContinueWatching(item, mediaType, Math.random() * 60 + 10);

      const details = mediaType === 'movie' 
        ? await getMovieDetails(item.id)
        : await getTVShowDetails(item.id);
      
      const trailer = details.videos?.results.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (trailer) {
        setTrailerKey(trailer.key);
        setIsTrailerOpen(true);
      } else {
        // Fallback: open modal if no trailer
        setSelectedItem(item);
        setSelectedMediaType(mediaType);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error playing content:', error);
    }
  }, []);

  const handleMoreInfo = useCallback((item: Movie | TVShow, mediaType: 'movie' | 'tv', source?: 'continue-watching') => {
    // Prevent opening modal if it's already open with the same item
    if (isModalOpen && selectedItem?.id === item.id) {
      return;
    }
    
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setSelectedSource(source || 'default');
    setIsModalOpen(true);
  }, [isModalOpen, selectedItem]);

  const navbarSearchActions = useMemo(
    () => ({ onPlay: handlePlay, onMoreInfo: handleMoreInfo }),
    [handlePlay, handleMoreInfo]
  );

  useRegisterNavbarSearch(handleSearch);
  useRegisterNavbarSearchActions(navbarSearchActions);

  const renderContent = useCallback(() => {
    if (currentSection === 'search') {
      return (
        <SearchResults
          results={searchResults}
          query={searchQuery}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isSearching}
        />
      );
    }

    if (currentSection === 'my-list') {
      return (
        <MyListSection
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
        />
      );
    }

    // Home section with carousels - Only render visible carousels initially
    return (
      <>
        <HeroSection onPlayClick={handlePlay} onInfoClick={handleMoreInfo} />
        
        <div className="space-y-8 pb-16">
          {/* Continue Watching disabled
          <ContinueWatchingCarousel
            onPlay={handlePlay}
            onMoreInfo={(item, mediaType) => handleMoreInfo(item, mediaType, 'continue-watching')}
          />
          */}

          <MediaCarousel
            title="Trending Now"
            items={deduplicatedContent.trending}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isTrendingLoading}
          />
          
          <Top10Carousel
            title="Top 10 Series in Netflix Today"
            items={deduplicatedContent.popularTVShows}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isPopularTVLoading}
            mobileItemsToShow={3}
          />
          
          <Top10Carousel
            title="Top 10 Movies in Netflix Today"
            items={netflixMovies}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isNetflixMoviesLoading}
            mobileItemsToShow={3}
          />
          
          <MediaCarousel
            title="New & Popular"
            items={deduplicatedContent.nowPlaying}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isNowPlayingLoading}
          />
          
          <MediaCarousel
            title="Top Anime Series"
            items={deduplicatedContent.animeShows}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isAnimeLoading}
          />
          
          <MediaCarousel
            title="Must-Watch K-Dramas"
            items={deduplicatedContent.kDramaShows}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isKDramaLoading}
          />
          
          <MediaCarousel
            title="Sci-Fi & Fantasy Series"
            items={deduplicatedContent.sciFiFantasyShows}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isSciFiFantasyLoading}
          />
          
          <MediaCarousel
            title="Top Rated TV Shows"
            items={deduplicatedContent.topRatedTVShows}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isTopRatedTVLoading}
          />
          
          <MediaCarousel
            title="Coming Soon - This Month & Next"
            items={deduplicatedContent.upcomingMovies}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isUpcomingLoading}
          />
          
          <MediaCarousel
            title="Action Movies"
            items={deduplicatedContent.actionMovies}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isActionLoading}
          />
          
          <MediaCarousel
            title="Indian Cinema Hits"
            items={deduplicatedContent.indianMovies}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isIndianLoading}
          />
          
          <MediaCarousel
            title="Horror Movies"
            items={deduplicatedContent.horrorMovies}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isHorrorLoading}
          />
        </div>
      </>
    );
  }, [
    currentSection,
    searchResults,
    searchQuery,
    isSearching,
    deduplicatedContent,
    isTrendingLoading,
    isNowPlayingLoading,
    isPopularTVLoading,
    isNetflixMoviesLoading,
    isAnimeLoading,
    isKDramaLoading,
    isSciFiFantasyLoading,
    isTopRatedTVLoading,
    isUpcomingLoading,
    isActionLoading,
    isIndianLoading,
    isHorrorLoading,
    handlePlay,
    handleMoreInfo
  ]);

  return (
    <>
      {renderContent()}
      
      {/* Modals - Lazy loaded */}
      <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
        {selectedItem && (
          <MediaModal
            isOpen={isModalOpen}
            onClose={() => {
              // Add slight delay to prevent rapid state changes
              if (isModalOpen) {
                setIsModalOpen(false);
                setTimeout(() => {
                  setSelectedItem(null);
                  setSelectedSource('default');
                }, 100);
              }
            }}
            item={selectedItem}
            mediaType={selectedMediaType}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            source={selectedSource}
          />
        )}
        
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          videoKey={trailerKey}
          title={selectedItem ? ('title' in selectedItem ? selectedItem.title : selectedItem.name) : ''}
        />
      </Suspense>
    </>
  );
});

Index.displayName = 'Index';
export default Index;

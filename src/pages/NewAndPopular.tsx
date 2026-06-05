import { useState, useMemo } from 'react';
import { MediaCarousel } from '@/components/MediaCarousel';
import { MediaModalLazy as MediaModal } from '@/components/MediaModalLazy';
import { TrailerModal } from '@/components/TrailerModal';
import { HeroSection } from '@/components/HeroSection';
import { Top10Carousel } from '@/components/Top10Carousel';
import { Movie, TVShow, getMovieDetails, getTVShowDetails } from '@/lib/tmdb';
import {
  useTrending,
  usePopularMovies,
  usePopularTVShows,
  useUpcomingMovies,
  useNowPlayingMovies,
  useTop10NetflixMovies,
  useTop10NetflixSeries,
} from '@/hooks/useTMDBQuery';
// import { useContinueWatching } from '@/hooks/useContinueWatching';
import { deduplicateContent, filterByDate, filterHighQuality } from '@/utils/deduplication';

const NewAndPopular = () => {
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  
  // const { addToContinueWatching } = useContinueWatching();
  
  // Fetch trending and new content
  const { data: trendingAll = [], isLoading: isTrendingAllLoading } = useTrending('all', 'week');
  const { data: trendingMovies = [], isLoading: isTrendingMoviesLoading } = useTrending('movie', 'week');
  const { data: trendingTV = [], isLoading: isTrendingTVLoading } = useTrending('tv', 'week');
  const { data: popularMovies = [], isLoading: isPopularMoviesLoading } = usePopularMovies();
  const { data: popularTVShows = [], isLoading: isPopularTVLoading } = usePopularTVShows();
  const { data: upcomingMovies = [], isLoading: isUpcomingLoading } = useUpcomingMovies();
  const { data: nowPlayingMovies = [], isLoading: isNowPlayingLoading } = useNowPlayingMovies();
  const { data: top10NetflixMovies = [], isLoading: isTop10NetflixMoviesLoading } = useTop10NetflixMovies();
  const { data: top10NetflixSeries = [], isLoading: isTop10NetflixSeriesLoading } = useTop10NetflixSeries();

  // Apply filters and deduplication - focus on recent, high-quality content
  const filteredCategories = useMemo(() => {
    // Filter mixed content for trending
    const mixedTrending = trendingAll.map(item => {
      // Determine if it's a movie or TV show and apply appropriate filters
      const isMovie = 'title' in item;
      const filtered = filterByDate([item], isMovie ? 'movie' : 'tv');
      return filtered.length > 0 ? filterHighQuality(filtered)[0] : null;
    }).filter(Boolean) as (Movie | TVShow)[];

    const categories = {
      'Trending Now': mixedTrending,
      'New Releases': filterHighQuality(filterByDate(nowPlayingMovies, 'movie')),
      'Top 10 Movies in Netflix Today': top10NetflixMovies,
      'Top 10 Series in Netflix Today': top10NetflixSeries,
      'Trending Movies': filterHighQuality(filterByDate(trendingMovies, 'movie')),
      'Trending TV Shows': filterHighQuality(filterByDate(trendingTV, 'tv')),
      'Upcoming Movies': filterByDate(upcomingMovies, 'movie'), // Don't filter quality for upcoming
      'Popular TV Shows': filterHighQuality(filterByDate(popularTVShows, 'tv')),
    };

    const priorityOrder = [
      'Trending Now',
      'New Releases',
      'Top 10 Movies in Netflix Today',
      'Top 10 Series in Netflix Today',
      'Trending Movies',
      'Trending TV Shows',
      'Upcoming Movies',
      'Popular TV Shows'
    ];

    return deduplicateContent(categories, priorityOrder);
  }, [
    trendingAll, nowPlayingMovies, top10NetflixMovies, top10NetflixSeries,
    trendingMovies, trendingTV, upcomingMovies, popularTVShows
  ]);

  const handlePlay = async (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
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
        setSelectedItem(item);
        setSelectedMediaType(mediaType);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error playing content:', error);
    }
  };

  const handleMoreInfo = (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  };

  return (
    <>
      <HeroSection onPlayClick={handlePlay} onInfoClick={handleMoreInfo} />
      
      <div className="space-y-8 pb-16 pt-8 px-2 sm:px-4 lg:px-8">
        <MediaCarousel
          title="Trending Now"
          items={filteredCategories['Trending Now'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTrendingAllLoading}
        />
        
        <MediaCarousel
          title="New Releases"
          items={filteredCategories['New Releases'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isNowPlayingLoading}
        />
        
        <Top10Carousel
          title="Top 10 Movies in Netflix Today"
          items={filteredCategories['Top 10 Movies in Netflix Today'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTop10NetflixMoviesLoading}
          mobileItemsToShow={3}
        />
        
        <Top10Carousel
          title="Top 10 Series in Netflix Today"
          items={filteredCategories['Top 10 Series in Netflix Today'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTop10NetflixSeriesLoading}
          mobileItemsToShow={3}
        />
        
        <MediaCarousel
          title="Trending Movies"
          items={filteredCategories['Trending Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTrendingMoviesLoading}
        />
        
        <MediaCarousel
          title="Trending TV Shows"
          items={filteredCategories['Trending TV Shows'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTrendingTVLoading}
        />
        
        <MediaCarousel
          title="Coming Soon - This Month & Next"
          items={filteredCategories['Upcoming Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isUpcomingLoading}
        />
        
        <MediaCarousel
          title="Popular TV Shows"
          items={filteredCategories['Popular TV Shows'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isPopularTVLoading}
        />
      </div>
      
      {/* Modals - Only render when we have an item */}
      {selectedItem && (
        <MediaModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          mediaType={selectedMediaType}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
        />
      )}
      
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoKey={trailerKey}
        title={selectedItem ? ('title' in selectedItem ? selectedItem.title : selectedItem.name) : ''}
      />
    </>
  );
};

export default NewAndPopular;
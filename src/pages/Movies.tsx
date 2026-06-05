
import { useState, useMemo } from 'react';
import { MediaCarousel } from '@/components/MediaCarousel';
import { MediaModalLazy as MediaModal } from '@/components/MediaModalLazy';
import { TrailerModal } from '@/components/TrailerModal';
import { HeroSection } from '@/components/HeroSection';
import { Top10Carousel } from '@/components/Top10Carousel';
import { Movie, TVShow, getMovieDetails } from '@/lib/tmdb';
import {
  usePopularMovies,
  useTopRatedMovies,
  useUpcomingMovies,
  useNowPlayingMoviesCinemeta,
  useMoviesByGenre,
  useActionMoviesCinemeta,
  useHorrorMoviesCinemeta,
  useThrillerMoviesCinemeta,
  useDramaMoviesCinemeta,
  useSciFiMoviesCinemeta,
  useAnimationMoviesCinemeta,
  useCrimeMoviesCinemeta,
  useTop10NetflixMovies,
  useTop10NetflixSeries,
} from '@/hooks/useTMDBQuery';
// import { useContinueWatching } from '@/hooks/useContinueWatching';
import { applyContentFilters } from '@/utils/deduplication';

const Movies = () => {
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  
  // const { addToContinueWatching } = useContinueWatching();
  
  // Fetch movie data
  const { data: popularMovies = [], isLoading: isPopularLoading } = usePopularMovies();
  const { data: topRatedMovies = [], isLoading: isTopRatedLoading } = useTopRatedMovies();
  const { data: upcomingMovies = [], isLoading: isUpcomingLoading } = useUpcomingMovies();
  const { data: nowPlayingMovies = [], isLoading: isNowPlayingLoading } = useNowPlayingMoviesCinemeta();
  const { data: actionMovies = [], isLoading: isActionLoading } = useActionMoviesCinemeta();
  const { data: comedyMovies = [], isLoading: isComedyLoading } = useMoviesByGenre(35);
  const { data: horrorMovies = [], isLoading: isHorrorLoading } = useHorrorMoviesCinemeta();
  const { data: thrillerMovies = [], isLoading: isThrillerLoading } = useThrillerMoviesCinemeta();
  const { data: dramaMovies = [], isLoading: isDramaLoading } = useDramaMoviesCinemeta();
  const { data: sciFiMovies = [], isLoading: isSciFiLoading } = useSciFiMoviesCinemeta();
  const { data: animationMovies = [], isLoading: isAnimationLoading } = useAnimationMoviesCinemeta();
  const { data: crimeMovies = [], isLoading: isCrimeLoading } = useCrimeMoviesCinemeta();
  
  // Netflix Top 10 - using same hooks as homepage
  const { data: top10NetflixMovies = [], isLoading: isTop10NetflixLoading } = useTop10NetflixMovies();
  const { data: top10NetflixSeries = [], isLoading: isTop10NetflixSeriesLoading } = useTop10NetflixSeries();

  // Apply filters and deduplication
  const filteredCategories = useMemo(() => {
    const categories = {
      'Popular Movies': popularMovies,
      'Now Playing': nowPlayingMovies,
      'Top 10 Movies in Netflix Today': top10NetflixMovies,
      'Top 10 Series in Netflix Today': top10NetflixSeries,
      'Top Rated Movies': topRatedMovies,
      'Upcoming Movies': upcomingMovies,
      'Action Movies': actionMovies,
      'Comedy Movies': comedyMovies,
      'Horror Movies': horrorMovies,
      'Thriller Movies': thrillerMovies,
      'Drama Movies': dramaMovies,
      'Sci-Fi Movies': sciFiMovies,
      'Animation Movies': animationMovies,
      'Crime Movies': crimeMovies,
    };

    const priorityOrder = [
      'Popular Movies',
      'Now Playing',
      'Top 10 Movies in Netflix Today',
      'Top 10 Series in Netflix Today',
      'Top Rated Movies',
      'Upcoming Movies',
      'Action Movies',
      'Comedy Movies',
      'Horror Movies',
      'Thriller Movies',
      'Drama Movies',
      'Sci-Fi Movies',
      'Animation Movies',
      'Crime Movies'
    ];

    return applyContentFilters(categories, 'movie', priorityOrder);
  }, [
    popularMovies, nowPlayingMovies, top10NetflixMovies, top10NetflixSeries, topRatedMovies, upcomingMovies,
    actionMovies, comedyMovies, horrorMovies, thrillerMovies,
    dramaMovies, sciFiMovies, animationMovies, crimeMovies
  ]);

  const handlePlay = async (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    try {
      // addToContinueWatching(item, mediaType, Math.random() * 60 + 10);

      const details = await getMovieDetails(item.id);
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
          title="Popular Movies"
          items={filteredCategories['Popular Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isPopularLoading}
        />
        
        <MediaCarousel
          title="Now Playing"
          items={filteredCategories['Now Playing'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isNowPlayingLoading}
        />
        
        <Top10Carousel
          title="Top 10 Movies in Netflix Today"
          items={filteredCategories['Top 10 Movies in Netflix Today'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTop10NetflixLoading}
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
          title="Top Rated Movies"
          items={filteredCategories['Top Rated Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTopRatedLoading}
        />
        
        <MediaCarousel
          title="Coming Soon - This Month & Next"
          items={filteredCategories['Upcoming Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isUpcomingLoading}
        />
        
        <MediaCarousel
          title="Action Movies"
          items={filteredCategories['Action Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isActionLoading}
        />
        
        <MediaCarousel
          title="Comedy Movies"
          items={filteredCategories['Comedy Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isComedyLoading}
        />
        
        <MediaCarousel
          title="Horror Movies"
          items={filteredCategories['Horror Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isHorrorLoading}
        />
        
        <MediaCarousel
          title="Thriller Movies"
          items={filteredCategories['Thriller Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isThrillerLoading}
        />
        
        <MediaCarousel
          title="Drama Movies"
          items={filteredCategories['Drama Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isDramaLoading}
        />
        
        <MediaCarousel
          title="Sci-Fi Movies"
          items={filteredCategories['Sci-Fi Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isSciFiLoading}
        />
        
        <MediaCarousel
          title="Animation Movies"
          items={filteredCategories['Animation Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isAnimationLoading}
        />
        
        <MediaCarousel
          title="Crime Movies"
          items={filteredCategories['Crime Movies'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isCrimeLoading}
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

export default Movies;

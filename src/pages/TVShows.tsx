import { useState, useMemo } from 'react';
import { MediaCarousel } from '@/components/MediaCarousel';
import { MediaModalLazy as MediaModal } from '@/components/MediaModalLazy';
import { TrailerModal } from '@/components/TrailerModal';
import { HeroSection } from '@/components/HeroSection';
import { Top10Carousel } from '@/components/Top10Carousel';
import { Movie, TVShow, getTVShowDetails } from '@/lib/tmdb';
import {
  usePopularTVShows,
  useTopRatedTVShows,
  useKDramaShows,
  useCrimeSeriesCinemeta,
  useFantasySeriesCinemeta,
  useComedySeriesCinemeta,
  useDramaSeriesCinemeta,
  useTop10NetflixSeries,
  useTop10NetflixMovies,
} from '@/hooks/useTMDBQuery';
// import { useContinueWatching } from '@/hooks/useContinueWatching';
import { applyContentFilters } from '@/utils/deduplication';

const TVShows = () => {
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('tv');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  
  // const { addToContinueWatching } = useContinueWatching();
  
  // Fetch TV show data
  const { data: popularTVShows = [], isLoading: isPopularLoading } = usePopularTVShows();
  const { data: topRatedTVShows = [], isLoading: isTopRatedLoading } = useTopRatedTVShows();
  const { data: kDramaShows = [], isLoading: isKDramaLoading } = useKDramaShows();
  const { data: dramaTVShows = [], isLoading: isDramaLoading } = useDramaSeriesCinemeta();
  const { data: comedyTVShows = [], isLoading: isComedyLoading } = useComedySeriesCinemeta();
  const { data: crimeTV = [], isLoading: isCrimeLoading } = useCrimeSeriesCinemeta();
  const { data: sciFiTV = [], isLoading: isSciFiLoading } = useFantasySeriesCinemeta();
  
  // Netflix Top 10 - using same hooks as homepage
  const { data: top10NetflixSeries = [], isLoading: isTop10NetflixSeriesLoading } = useTop10NetflixSeries();
  const { data: top10NetflixMovies = [], isLoading: isTop10NetflixMoviesLoading } = useTop10NetflixMovies();

  // Apply filters and deduplication - remove old shows and reality/kids content
  const filteredCategories = useMemo(() => {
    const categories = {
      'Popular TV Shows': popularTVShows,
      'Top Rated TV Shows': topRatedTVShows,
      'Top 10 Movies in Netflix Today': top10NetflixMovies,
      'Top 10 Series in Netflix Today': top10NetflixSeries,
      'Must-Watch K-Dramas': kDramaShows,
      'Drama Series': dramaTVShows,
      'Comedy Series': comedyTVShows,
      'Crime Series': crimeTV,
      'Sci-Fi & Fantasy': sciFiTV,
    };

    const priorityOrder = [
      'Popular TV Shows',
      'Top Rated TV Shows',
      'Top 10 Movies in Netflix Today',
      'Top 10 Series in Netflix Today',
      'Must-Watch K-Dramas',
      'Drama Series',
      'Comedy Series',
      'Crime Series',
      'Sci-Fi & Fantasy'
    ];

    return applyContentFilters(categories, 'tv', priorityOrder);
  }, [
    popularTVShows, topRatedTVShows, top10NetflixMovies, top10NetflixSeries, kDramaShows, dramaTVShows,
    comedyTVShows, crimeTV, sciFiTV
  ]);

  const handlePlay = async (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    try {
      // addToContinueWatching(item, mediaType, Math.random() * 60 + 10);

      const details = await getTVShowDetails(item.id);
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
          title="Popular TV Shows"
          items={filteredCategories['Popular TV Shows'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isPopularLoading}
        />
        
        <MediaCarousel
          title="Top Rated TV Shows"
          items={filteredCategories['Top Rated TV Shows'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isTopRatedLoading}
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
          title="Must-Watch K-Dramas"
          items={filteredCategories['Must-Watch K-Dramas'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isKDramaLoading}
        />
        
        <MediaCarousel
          title="Drama Series"
          items={filteredCategories['Drama Series'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isDramaLoading}
        />
        
        <MediaCarousel
          title="Comedy Series"
          items={filteredCategories['Comedy Series'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isComedyLoading}
        />
        
        <MediaCarousel
          title="Crime Series"
          items={filteredCategories['Crime Series'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isCrimeLoading}
        />
        
        <MediaCarousel
          title="Sci-Fi & Fantasy"
          items={filteredCategories['Sci-Fi & Fantasy'] || []}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          isLoading={isSciFiLoading}
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

export default TVShows;

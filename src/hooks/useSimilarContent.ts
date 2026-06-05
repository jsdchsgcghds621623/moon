import { useQuery } from '@tanstack/react-query';
import { Movie, TVShow } from '@/lib/tmdb';
import { useMoviesByGenre, useTVShowsByGenre, usePopularMovies, usePopularTVShows } from './useTMDBQuery';

// Hook to get similar content based on genres
export const useSimilarContent = (item: Movie | TVShow | null, mediaType: 'movie' | 'tv') => {
  const genres = item?.genre_ids || [];
  const primaryGenre = genres[0] || 28; // Default to Action genre if no genre
  
  // ALWAYS call all hooks with the same parameters to maintain hook stability
  // Never use dynamic enabled flags - always fetch and filter in JavaScript
  const { data: moviesByGenre = [], isLoading: isMoviesGenreLoading } = useMoviesByGenre(primaryGenre);
  const { data: tvShowsByGenre = [], isLoading: isTVGenreLoading } = useTVShowsByGenre(primaryGenre);
  const { data: popularMovies = [], isLoading: isPopularMoviesLoading } = usePopularMovies();
  const { data: popularTVShows = [], isLoading: isPopularTVLoading } = usePopularTVShows();

  // Select the right data after all hooks are called
  const isMovie = mediaType === 'movie';
  
  // Use genre content if item has genres, otherwise use popular content
  const hasValidGenres = item && genres.length > 0;
  const genreContent = isMovie ? moviesByGenre : tvShowsByGenre;
  const fallbackContent = isMovie ? popularMovies : popularTVShows;
  const selectedContent = hasValidGenres ? genreContent : fallbackContent;
  
  const isGenreLoading = isMovie ? isMoviesGenreLoading : isTVGenreLoading;
  const fallbackLoading = isMovie ? isPopularMoviesLoading : isPopularTVLoading;

  // Filter out the current item and limit results
  const similarContent = selectedContent
    .filter(content => content.id !== item?.id)
    .slice(0, 20);

  return {
    data: similarContent,
    isLoading: isGenreLoading || fallbackLoading,
  };
};

// Hook to get recommendations based on multiple genres
export const useRecommendations = (item: Movie | TVShow | null, mediaType: 'movie' | 'tv') => {
  const genres = item?.genre_ids || [];
  
  return useQuery({
    queryKey: ['recommendations', item?.id, mediaType],
    queryFn: async () => {
      if (!item || genres.length === 0) return [];

      // Get content from all genres the item belongs to
      const recommendations: (Movie | TVShow)[] = [];
      
      // This is a simplified recommendation system
      // In a real app, you'd use TMDB's recommendations endpoint
      return recommendations.slice(0, 12);
    },
    enabled: !!item && genres.length > 0,
  });
};
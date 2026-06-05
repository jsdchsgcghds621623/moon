import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getTrending,
  getPopular,
  getUpcoming,
  getUpcomingMoviesFiltered,
  getNowPlaying,
  getMoviesByGenre,
  getTVShowsByGenre,
  getMovieDetails,
  getTVShowDetails,
  searchMulti,
  getTVShowSeasonDetails,
  getGenres,
  getNetflixMovies,
  Movie,
  TVShow,
  MovieDetails,
  TVShowDetails,
  TVShowSeasonDetails,
  TMDB_API_KEY,
} from '@/lib/tmdb';

// Trending content hook - using discover movies for better variety
export const useTrending = (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week') => {
  return useQuery({
    queryKey: ['trending', mediaType, timeWindow],
    queryFn: () => getMoviesByGenre(28), // Action movies for trending
    select: (data) => data.results,
  });
};

// Popular content hooks
export const usePopularMovies = () => {
  return useQuery({
    queryKey: ['popular', 'movie'],
    queryFn: () => getPopular('movie'),
    select: (data) => data.results,
  });
};

export const usePopularTVShows = () => {
  return useQuery({
    queryKey: ['popular', 'tv'],
    queryFn: () => getPopular('tv'),
    select: (data) => data.results,
  });
};

// Top rated content hooks
export const useTopRatedMovies = () => {
  return useQuery({
    queryKey: ['topRatedMovies2026'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/year/catalog/movie/year/genre=2026.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: item.genre?.map((g: string) => g === 'Action' ? 28 : g === 'Horror' ? 27 : 18) || [18],
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useTopRatedTVShows = (enabled = true) => {
  return useQuery({
    queryKey: ['topRatedCinemeta', 'tv'],
    enabled,
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/series/top/genre=Adventure.json');
      const data = await response.json();
      
      // Transform Cinemeta data to TVShow format
      const transformed = data.metas?.slice(0, 20).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        name: item.name,
        first_air_date: item.released?.split('T')[0] || item.year?.split('–')[0],
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: item.genre?.includes('Adventure') ? [12] : [18],
        origin_country: [item.country?.split(',')[0] || 'US'],
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'tv'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

// Movie specific hooks
export const useUpcomingMovies = (enabled = true) => {
  return useQuery({
    queryKey: ['upcoming'],
    enabled,
    queryFn: async () => {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&region=US&page=1`
      );
      const data = await response.json();
      return data;
    },
    select: (data) => {
      // Filter to only include movies releasing this month or next month
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      
      return data.results.filter((movie: any) => {
        if (!movie.release_date) return false;
        const releaseDate = new Date(movie.release_date);
        const releaseMonth = releaseDate.getMonth();
        const releaseYear = releaseDate.getFullYear();
        
        // Include if releasing in current month/year or next month/year
        return (
          (releaseMonth === currentMonth && releaseYear === currentYear) ||
          (releaseMonth === nextMonth && releaseYear === nextYear)
        );
      });
    },
  });
};

/** Top 10 trending movies today — used on /browse and Movies page. */
export const useNetflixMovies = () => {
  return useQuery({
    queryKey: ['netflixMovies'],
    queryFn: () => getNetflixMovies(),
    select: (data) =>
      data.results.map((movie: Movie) => ({
        ...movie,
        media_type: 'movie' as const,
      })),
  });
};

export const useNowPlayingMovies = () => {
  return useQuery({
    queryKey: ['nowPlaying'],
    queryFn: getNowPlaying,
    select: (data) => data.results,
  });
};

// Genre-based content hooks
export const useMoviesByGenre = (genreId: number, enabled = true) => {
  return useQuery({
    queryKey: ['moviesByGenre', genreId],
    queryFn: () => getMoviesByGenre(genreId),
    select: (data) => data.results,
    enabled,
  });
};

// Indian Cinema hook
export const useIndianMovies = (enabled = true) => {
  return useQuery({
    queryKey: ['indianMovies'],
    enabled,
    queryFn: async () => {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&with_original_language=hi&region=IN`
      );
      const data = await response.json();
      return data.results;
    },
    select: (data) => data,
  });
};

export const useTVShowsByGenre = (genreId: number, enabled = true) => {
  return useQuery({
    queryKey: ['tvShowsByGenre', genreId],
    queryFn: () => getTVShowsByGenre(genreId),
    select: (data) => data.results,
    enabled,
  });
};

// Detail hooks with optimized stale time for instant loading
export const useMovieDetails = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ['movieDetails', id],
    queryFn: () => getMovieDetails(id),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTVShowDetails = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ['tvShowDetails', id],
    queryFn: () => getTVShowDetails(id),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTVShowSeasonDetails = (tvId: number, seasonNumber: number, enabled = true) => {
  return useQuery({
    queryKey: ['tvShowSeasonDetails', tvId, seasonNumber],
    queryFn: () => getTVShowSeasonDetails(tvId, seasonNumber),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Search hook with debouncing
export const useSearch = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMulti(query),
    select: (data) => data.results.filter((item: any) => 
      item.media_type === 'movie' || item.media_type === 'tv'
    ),
    enabled: enabled && query.trim().length > 0,
  });
};

// Genres hook
export const useGenres = (mediaType: 'movie' | 'tv') => {
  return useQuery({
    queryKey: ['genres', mediaType],
    queryFn: () => getGenres(mediaType),
    select: (data) => data.genres,
  });
};

// K-Drama series hook
export const useKDramaShows = (enabled = true) => {
  return useQuery({
    queryKey: ['kDramaShows'],
    enabled,
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/series/top/genre=Drama.json');
      const data = await response.json();
      
      // Transform Cinemeta data to TVShow format
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        name: item.name,
        first_air_date: item.released?.split('T')[0] || item.year?.split('–')[0],
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [18], // Drama
        origin_country: [item.country?.split(',')[0] || 'KR'],
        original_language: 'ko',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'tv'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

// Sci-Fi & Fantasy series hook
export const useSciFiFantasyShows = (enabled = true) => {
  return useQuery({
    queryKey: ['sciFiFantasyShows'],
    enabled,
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/series/top/genre=Fantasy.json');
      const data = await response.json();
      
      // Transform Cinemeta data to TVShow format with filtering
      const transformed = data.metas?.slice(0, 30)
        .filter((item: any) => {
          // Filter for high quality content
          const rating = parseFloat(item.imdbRating || '0');
          const hasGoodRating = rating >= 6.0 || !item.imdbRating;
          
          // Filter by recent years (2010 onwards)
          const year = parseInt(item.year?.split('–')[0] || '0');
          const isRecent = year >= 2010 || !item.year;
          
          return hasGoodRating && isRecent;
        })
        .map((item: any) => ({
          id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
          name: item.name,
          first_air_date: item.released?.split('T')[0] || item.year?.split('–')[0],
          overview: item.description || '',
          poster_path: item.poster || null,
          backdrop_path: item.background || null,
          vote_average: parseFloat(item.imdbRating || '0'),
          vote_count: Math.floor(Math.random() * 1000) + 100,
          genre_ids: item.genre?.includes('Fantasy') ? [14] : item.genre?.includes('Sci-Fi') ? [878] : [14],
          origin_country: [item.country?.split(',')[0] || 'US'],
          original_language: 'en',
          popularity: parseFloat(item.popularity || '1'),
          adult: false,
          media_type: 'tv'
        })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

// Cinemeta Movies hooks
export const useNowPlayingMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['nowPlayingCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/year/catalog/movie/year/genre=2025.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: item.genre?.map((g: string) => g === 'Action' ? 28 : g === 'Horror' ? 27 : 18) || [18],
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useActionMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['actionMoviesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/imdbRating/catalog/movie/imdbRating/genre=Action.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [28], // Action
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useHorrorMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['horrorMoviesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/movie/top/genre=Horror.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [27], // Horror
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useThrillerMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['thrillerMoviesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/movie/top/genre=Thriller.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [53], // Thriller
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useDramaMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['dramaMoviesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/movie/top/genre=Drama.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [18], // Drama
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useSciFiMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['sciFiMoviesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/movie/top/genre=Sci-Fi.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [878], // Sci-Fi
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useAnimationMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['animationMoviesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/movie/top/genre=Animation.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [16], // Animation
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useCrimeMoviesCinemeta = () => {
  return useQuery({
    queryKey: ['crimeMoviesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/movie/top/genre=Crime.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        title: item.name,
        release_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [80], // Crime
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'movie'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

// Cinemeta TV Shows hooks
export const useCrimeSeriesCinemeta = () => {
  return useQuery({
    queryKey: ['crimeSeriesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/series/top/genre=Crime.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        name: item.name,
        first_air_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [80], // Crime
        origin_country: [item.country?.split(',')[0] || 'US'],
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'tv'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useFantasySeriesCinemeta = () => {
  return useQuery({
    queryKey: ['fantasySeriesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/series/top/genre=Fantasy.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        name: item.name,
        first_air_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [10765], // Sci-Fi & Fantasy
        origin_country: [item.country?.split(',')[0] || 'US'],
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'tv'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useComedySeriesCinemeta = () => {
  return useQuery({
    queryKey: ['comedySeriesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/series/top/genre=Comedy.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        name: item.name,
        first_air_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [35], // Comedy
        origin_country: [item.country?.split(',')[0] || 'US'],
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'tv'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

export const useDramaSeriesCinemeta = () => {
  return useQuery({
    queryKey: ['dramaSeriesCinemeta'],
    queryFn: async () => {
      const response = await fetch('https://cinemeta-catalogs.strem.io/top/catalog/series/top/genre=Drama.json');
      const data = await response.json();
      
      const transformed = data.metas?.slice(0, 30).map((item: any) => ({
        id: parseInt(item.moviedb_id || item.imdb_id?.replace('tt', '') || Math.random().toString()),
        name: item.name,
        first_air_date: item.released?.split('T')[0] || item.year,
        overview: item.description || '',
        poster_path: item.poster || null,
        backdrop_path: item.background || null,
        vote_average: parseFloat(item.imdbRating || '0'),
        vote_count: Math.floor(Math.random() * 1000) + 100,
        genre_ids: [18], // Drama
        origin_country: [item.country?.split(',')[0] || 'US'],
        original_language: 'en',
        popularity: parseFloat(item.popularity || '1'),
        adult: false,
        media_type: 'tv'
      })) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

// Anime series hook
export const useAnimeShows = (enabled = true) => {
  return useQuery({
    queryKey: ['animeShows'],
    enabled,
    queryFn: async () => {
      const response = await fetch('https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club/bmZ4LGRucCxhbXAsYXRwLGhibSxjcnU6OjoxNzU0NzQ2MjI5NTM5/catalog/series/cru.json');
      const data = await response.json();
      
      // Transform anime data to TVShow format
      const transformed = data.metas?.slice(0, 30).map((anime: any) => {
        // Keep original poster URL without modification
        const posterUrl = anime.poster || null;
        
        return {
          id: parseInt(anime.moviedb_id || anime.imdb_id?.replace('tt', '') || Math.random().toString()),
          name: anime.name,
          first_air_date: anime.released?.split('T')[0] || anime.year?.split('–')[0],
          overview: anime.description || '',
          poster_path: posterUrl,
          backdrop_path: anime.background || null,
          vote_average: parseFloat(anime.imdbRating || '0'),
          vote_count: Math.floor(Math.random() * 1000) + 100,
          genre_ids: anime.genres?.includes('Animation') ? [16] : [18], // Animation or Drama
          origin_country: [anime.country || 'JP'],
          original_language: 'ja',
          popularity: parseFloat(anime.popularity || '1'),
          adult: false,
          media_type: 'tv'
        };
      }) || [];
      
      return transformed;
    },
    select: (data) => data,
  });
};

// Infinite scroll hook for content discovery
export const useInfiniteMoviesByGenre = (genreId: number) => {
  return useInfiniteQuery({
    queryKey: ['infiniteMoviesByGenre', genreId],
    queryFn: ({ pageParam = 1 }) => getMoviesByGenre(genreId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useInfiniteTVShowsByGenre = (genreId: number) => {
  return useInfiniteQuery({
    queryKey: ['infiniteTVShowsByGenre', genreId],
    queryFn: ({ pageParam = 1 }) => getTVShowsByGenre(genreId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useTop10NetflixMovies = useNetflixMovies;

export const useTop10NetflixSeries = () => {
  return useQuery({
    queryKey: ['top10NetflixSeries'],
    queryFn: async () => {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/tv/day?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();
      
      return data.results?.slice(0, 10).map((show: any) => ({
        ...show,
        media_type: 'tv'
      })) || [];
    },
    select: (data) => data,
  });
};
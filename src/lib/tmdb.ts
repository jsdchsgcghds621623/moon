import axios from 'axios';
import { getRuntimeDeviceFlags } from './device-detection';

export const TMDB_API_KEY =
  (import.meta.env.VITE_TMDB_API_KEY as string | undefined)?.trim() ?? '';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const tmdbApi = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export const TMDB_IMAGE_URL = {
  w185: `${IMAGE_BASE_URL}/w185`,
  w300: `${IMAGE_BASE_URL}/w300`,
  w342: `${IMAGE_BASE_URL}/w342`,
  w500: `${IMAGE_BASE_URL}/w500`,
  w780: `${IMAGE_BASE_URL}/w780`,
  w1280: `${IMAGE_BASE_URL}/w1280`,
  original: `${IMAGE_BASE_URL}/original`,
};

// Get appropriate image size based on device type
export const getImageUrl = (size: 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500') => {
  const { isTV, isMobile } = getRuntimeDeviceFlags();

  if (isTV) {
    return TMDB_IMAGE_URL.w342;
  }

  if (isMobile) {
    return TMDB_IMAGE_URL.w342;
  }

  return TMDB_IMAGE_URL[size];
};

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
  vote_count: number;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
  vote_count: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string;
  }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
}

export interface TVShowDetails extends TVShow {
  genres: Genre[];
  episode_run_time: number[];
  status: string;
  tagline: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Array<{
    id: number;
    name: string;
    poster_path: string;
    season_number: number;
    episode_count: number;
  }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
}

// API functions
export const getTrending = async (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week') => {
  const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
  return response.data;
};

export const getPopular = async (mediaType: 'movie' | 'tv') => {
  const response = await tmdbApi.get(`/${mediaType}/popular`);
  return response.data;
};

export const getTopRated = async (mediaType: 'movie' | 'tv') => {
  const response = await tmdbApi.get(`/${mediaType}/top_rated`);
  return response.data;
};

export const getUpcoming = async () => {
  const response = await tmdbApi.get('/movie/upcoming');
  return response.data;
};

export const getNowPlaying = async () => {
  const response = await tmdbApi.get('/movie/now_playing');
  return response.data;
};

export const getGenres = async (mediaType: 'movie' | 'tv') => {
  const response = await tmdbApi.get(`/genre/${mediaType}/list`);
  return response.data;
};

export const getMoviesByGenre = async (genreId: number, page: number = 1) => {
  const response = await tmdbApi.get('/discover/movie', {
    params: {
      with_genres: genreId,
      page,
    },
  });
  return response.data;
};

export const getTVShowsByGenre = async (genreId: number, page: number = 1) => {
  const response = await tmdbApi.get('/discover/tv', {
    params: {
      with_genres: genreId,
      page,
    },
  });
  return response.data;
};

export const getMovieDetails = async (id: number): Promise<MovieDetails> => {
  const response = await tmdbApi.get(`/movie/${id}`, {
    params: {
      append_to_response: 'videos,credits',
    },
  });
  return response.data;
};

export const getTVShowDetails = async (id: number): Promise<TVShowDetails> => {
  const response = await tmdbApi.get(`/tv/${id}`, {
    params: {
      append_to_response: 'videos,credits',
    },
  });
  return response.data;
};

export const searchMovies = async (query: string, page: number = 1) => {
  const response = await tmdbApi.get('/search/movie', {
    params: {
      query,
      page,
    },
  });
  return response.data;
};

export const searchTVShows = async (query: string, page: number = 1) => {
  const response = await tmdbApi.get('/search/tv', {
    params: {
      query,
      page,
    },
  });
  return response.data;
};

export const searchMulti = async (query: string, page: number = 1) => {
  const response = await tmdbApi.get('/search/multi', {
    params: {
      query,
      page,
    },
  });
  return response.data;
};

/** Top 10 trending movies today (TMDB trending/movie/day). */
export const getNetflixMovies = async () => {
  const response = await tmdbApi.get('/trending/movie/day');
  const results = (response.data.results ?? []).slice(0, 10);
  return { ...response.data, results };
};

export const getUpcomingMoviesFiltered = async () => {
  const response = await tmdbApi.get('/movie/upcoming');
  const today = new Date();
  
  // Filter to only include movies with future release dates
  const filteredMovies = response.data.results.filter((movie: Movie) => {
    const releaseDate = new Date(movie.release_date);
    return releaseDate > today;
  });
  
  return {
    ...response.data,
    results: filteredMovies
  };
};

export const getTVShowSeasonDetails = async (tvId: number, seasonNumber: number): Promise<TVShowSeasonDetails> => {
  const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`);
  return response.data;
};

export interface TVShowSeasonDetails {
  _id: string;
  air_date: string;
  episodes: Episode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string;
  season_number: number;
  vote_average: number;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string;
  episode_number: number;
  production_code: string;
  runtime: number;
  season_number: number;
  show_id: number;
  still_path: string;
}
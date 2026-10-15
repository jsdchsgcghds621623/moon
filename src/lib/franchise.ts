import franchiseData from '../../franchisecollection.json';
import { Movie, TVShow } from './tmdb';

export interface FranchiseCollectionTMDBItem {
  id: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  original_title?: string;
  original_name?: string;
}

export interface FranchiseCollectionMovie {
  title: string;
  tmdb: FranchiseCollectionTMDBItem;
}

export interface FranchiseCollectionEntry {
  rank: number;
  name: string;
  total_box_office_billions: number;
  number_of_movies: number;
  poster: string;
  movies: FranchiseCollectionMovie[];
  tv_series?: FranchiseCollectionMovie[];
}

export interface FranchiseCollectionDetail {
  franchise: FranchiseCollectionEntry;
  movies: Movie[];
  tvSeries: TVShow[];
}

export interface FranchiseDisplayItem extends Movie {
  franchiseSlug: string;
  franchiseOverview: string;
  franchiseRank: number;
  franchisePosterDescription: string;
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toMovie = (item: FranchiseCollectionMovie): Movie => {
  const tmdb = item.tmdb;
  return {
    id: tmdb.id,
    title: item.title,
    overview: tmdb.overview || item.title,
    poster_path: tmdb.poster_path || '/placeholder.svg',
    backdrop_path: tmdb.backdrop_path || tmdb.poster_path || '/placeholder.svg',
    release_date: tmdb.release_date || tmdb.first_air_date || '',
    vote_average: tmdb.vote_average ?? 0,
    genre_ids: [12],
    adult: false,
    original_language: 'en',
    original_title: tmdb.original_title || item.title,
    popularity: tmdb.popularity ?? 0,
    video: false,
    vote_count: Math.max(0, Math.round((tmdb.vote_average ?? 0) * 100)),
  };
};

const toTVShow = (item: FranchiseCollectionMovie): TVShow => {
  const tmdb = item.tmdb;
  return {
    id: tmdb.id,
    name: item.title,
    overview: tmdb.overview || item.title,
    poster_path: tmdb.poster_path || '/placeholder.svg',
    backdrop_path: tmdb.backdrop_path || tmdb.poster_path || '/placeholder.svg',
    first_air_date: tmdb.first_air_date || tmdb.release_date || '',
    vote_average: tmdb.vote_average ?? 0,
    genre_ids: [10765],
    origin_country: ['US'],
    original_language: 'en',
    original_name: tmdb.original_name || item.title,
    popularity: tmdb.popularity ?? 0,
    vote_count: Math.max(0, Math.round((tmdb.vote_average ?? 0) * 100)),
  };
};

export const getFranchiseCollectionCards = (): FranchiseDisplayItem[] => {
  return [...franchiseData.franchises]
    .sort((a, b) => a.rank - b.rank)
    .map((franchise) => {
      const firstItem = franchise.movies[0]?.tmdb ?? franchise.tv_series?.[0]?.tmdb;
      const poster = firstItem?.poster_path || firstItem?.backdrop_path || '/placeholder.svg';
      const backdrop = firstItem?.backdrop_path || firstItem?.poster_path || poster;
      const releaseDate = firstItem?.release_date || firstItem?.first_air_date || '';
      const voteAverage = firstItem?.vote_average ?? 0;
      return {
        id: 100000 + franchise.rank,
        title: franchise.name,
        overview: franchise.poster,
        poster_path: poster,
        backdrop_path: backdrop,
        release_date: releaseDate,
        vote_average: voteAverage,
        genre_ids: [12],
        adult: false,
        original_language: 'en',
        original_title: franchise.name,
        popularity: firstItem?.popularity ?? 0,
        video: false,
        vote_count: Math.max(0, Math.round(voteAverage * 100)),
        franchiseSlug: slugify(franchise.name),
        franchiseOverview: franchise.poster,
        franchiseRank: franchise.rank,
        franchisePosterDescription: franchise.poster,
      };
    });
};

export const getFranchiseCollectionBySlug = (slug: string): FranchiseCollectionDetail => {
  const franchise = franchiseData.franchises.find(
    (entry) => slugify(entry.name) === slug.toLowerCase()
  );

  if (!franchise) {
    throw new Error(`Franchise not found: ${slug}`);
  }

  return {
    franchise,
    movies: franchise.movies.map(toMovie),
    tvSeries: (franchise.tv_series || []).map(toTVShow),
  };
};

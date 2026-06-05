import { Movie, TVShow } from '@/lib/tmdb';

export const getSearchMediaType = (item: Movie | TVShow): 'movie' | 'tv' =>
  'title' in item ? 'movie' : 'tv';

export const getSearchTitle = (item: Movie | TVShow): string =>
  'title' in item ? item.title : item.name;

export const getSearchYear = (item: Movie | TVShow): string =>
  ('release_date' in item ? item.release_date : item.first_air_date)?.slice(0, 4) ?? '';

export const getSearchPosterUrl = (item: Movie | TVShow, size: 'w92' | 'w200' = 'w92'): string =>
  item.poster_path
    ? `https://image.tmdb.org/t/p/${size}${item.poster_path}`
    : '/placeholder.svg';

export const isSearchMediaResult = (item: unknown): item is Movie | TVShow => {
  if (!item || typeof item !== 'object') return false;
  const r = item as { media_type?: string; title?: string; name?: string };
  if (r.media_type === 'movie' || r.media_type === 'tv') return true;
  return Boolean(r.title || r.name);
};

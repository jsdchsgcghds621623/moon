import type { Movie, MovieDetails, TVShow, TVShowDetails } from '@/lib/tmdb';
import { TMDB_IMAGE_URL } from '@/lib/tmdb';

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() ||
  'https://moonflix.site';

export const SITE_NAME = 'Moonflix.site';

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'title';
}

export function buildMediaSlug(title: string, id: number): string {
  return `${slugifyTitle(title)}-${id}`;
}

export function parseMediaIdFromSlug(slug: string | undefined): number | null {
  if (!slug) return null;
  const match = slug.match(/-(\d+)$/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}

export type MediaRouteType = 'movie' | 'tv' | 'anime';

export function getMediaPath(
  mediaType: 'movie' | 'tv',
  title: string,
  id: number,
  options?: { asAnime?: boolean }
): string {
  const prefix: MediaRouteType = options?.asAnime
    ? 'anime'
    : mediaType === 'movie'
      ? 'movie'
      : 'tv';
  return `/${prefix}/${buildMediaSlug(title, id)}`;
}

export function routeTypeToMediaType(routeType: MediaRouteType): 'movie' | 'tv' {
  return routeType === 'movie' ? 'movie' : 'tv';
}

export function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function posterUrl(path: string | null | undefined): string {
  if (!path) return absoluteUrl('/lovable-uploads/Moonflix.png');
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_URL.w780}${path}`;
}

export function getMediaTitle(item: Movie | TVShow | MovieDetails | TVShowDetails): string {
  return 'title' in item ? item.title : item.name;
}

export function getMediaYear(item: Movie | TVShow | MovieDetails | TVShowDetails): string | null {
  const date = 'release_date' in item ? item.release_date : item.first_air_date;
  if (!date) return null;
  return String(new Date(date).getFullYear());
}

export function buildMoviePageTitle(title: string, year: string | null): string {
  const y = year ? ` (${year})` : '';
  return `${title}${y} Watch Online Free — ${SITE_NAME}`;
}

export function buildMovieDescription(
  title: string,
  overview: string,
  mediaType: 'movie' | 'tv'
): string {
  const kind = mediaType === 'movie' ? 'movie' : 'TV show';
  const trimmed = overview?.trim().slice(0, 155);
  if (trimmed) {
    return `Watch ${title} online in HD. ${trimmed}${overview.length > 155 ? '…' : ''} Stream free ${kind}s on ${SITE_NAME}.`;
  }
  return `Watch ${title} online in HD quality. Stream free ${kind}s and series on ${SITE_NAME}.`;
}

export function buildMovieJsonLd(
  details: MovieDetails | TVShowDetails,
  mediaType: 'movie' | 'tv',
  pageUrl: string
): Record<string, unknown> {
  const title = getMediaTitle(details);
  const image = posterUrl(details.poster_path || details.backdrop_path);
  const year = getMediaYear(details);
  const rating = details.vote_average;
  const count = details.vote_count || 1;

  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': mediaType === 'movie' ? 'Movie' : 'TVSeries',
    name: title,
    description: details.overview || undefined,
    image,
    url: pageUrl,
  };

  if (year) {
    if (mediaType === 'movie') base.datePublished = year;
    else base.startDate = year;
  }

  if (rating > 0) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      bestRating: '10',
      worstRating: '0',
      ratingCount: count,
    };
  }

  if ('genres' in details && details.genres?.length) {
    base.genre = details.genres.map((g) => g.name);
  }

  if (mediaType === 'tv' && 'number_of_seasons' in details) {
    base.numberOfSeasons = details.number_of_seasons;
  }

  return base;
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const SEO_CATEGORY_PAGES: Array<{
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  mediaType: 'movie' | 'tv' | 'mixed';
  genreId?: number;
  keywords: string[];
}> = [
  {
    path: '/trending',
    title: `Trending Movies & TV Shows — ${SITE_NAME}`,
    description: `Browse trending movies and TV shows today. Watch free Bollywood, Hollywood, and web series in HD on ${SITE_NAME}.`,
    h1: 'Trending Movies & TV Shows',
    intro: 'Discover what is trending right now — popular movies, hit series, and new releases updated daily.',
    mediaType: 'mixed',
    keywords: ['trending movies', 'trending tv shows', 'popular today'],
  },
  {
    path: '/top-rated',
    title: `Top Rated Movies & TV — ${SITE_NAME}`,
    description: `Watch top rated movies and TV series online in HD. IMDb-style picks and critic favorites on ${SITE_NAME}.`,
    h1: 'Top Rated Movies & TV Shows',
    intro: 'Explore highest-rated titles — acclaimed films and binge-worthy series loved by viewers worldwide.',
    mediaType: 'mixed',
    keywords: ['top rated movies', 'best tv shows', 'imdb top'],
  },
  {
    path: '/comedy-movies',
    title: `Comedy Movies Watch Online Free — ${SITE_NAME}`,
    description: `Stream comedy movies online in HD. Bollywood comedy, Hollywood rom-coms, and more on ${SITE_NAME}.`,
    h1: 'Comedy Movies',
    intro: 'Laugh out loud with our comedy collection — from Bollywood hits to Hollywood blockbusters.',
    mediaType: 'movie',
    genreId: 35,
    keywords: ['comedy movies', 'funny movies', 'comedy films online'],
  },
  {
    path: '/action-movies',
    title: `Action Movies Watch Online Free — ${SITE_NAME}`,
    description: `Watch action movies online in HD. Thrillers, martial arts, and blockbuster action on ${SITE_NAME}.`,
    h1: 'Action Movies',
    intro: 'High-octane action films — superheroes, chase scenes, and edge-of-your-seat adventures.',
    mediaType: 'movie',
    genreId: 28,
    keywords: ['action movies', 'action films', 'watch action online'],
  },
  {
    path: '/horror-movies',
    title: `Horror Movies Watch Online Free — ${SITE_NAME}`,
    description: `Stream horror movies online in HD. Scary films, supernatural thrillers on ${SITE_NAME}.`,
    h1: 'Horror Movies',
    intro: 'Spine-chilling horror picks for late-night streaming.',
    mediaType: 'movie',
    genreId: 27,
    keywords: ['horror movies', 'scary movies online'],
  },
  {
    path: '/anime',
    title: `Anime Watch Online Free — ${SITE_NAME}`,
    description: `Watch anime series and movies online in HD. Slice of life, shonen, fantasy anime on ${SITE_NAME}.`,
    h1: 'Anime Series & Movies',
    intro: 'Japanese animation — trending anime series, classics, and new seasonal releases.',
    mediaType: 'tv',
    genreId: 16,
    keywords: ['anime online', 'watch anime free', 'anime series'],
  },
  {
    path: '/korean-drama',
    title: `Korean Drama Watch Online — ${SITE_NAME}`,
    description: `Stream K-drama and Korean TV series online in HD on ${SITE_NAME}.`,
    h1: 'Korean Drama (K-Drama)',
    intro: 'Romance, thriller, and slice-of-life Korean dramas in one place.',
    mediaType: 'tv',
    keywords: ['korean drama', 'k-drama online', 'kdrama streaming'],
  },
  {
    path: '/hindi-movies',
    title: `Hindi & Bollywood Movies — ${SITE_NAME}`,
    description: `Watch Hindi and Bollywood movies online in HD. Dual audio and Bollywood hits on ${SITE_NAME}.`,
    h1: 'Hindi & Bollywood Movies',
    intro: 'Bollywood blockbusters, Hindi dubbed Hollywood, and Indian regional cinema.',
    mediaType: 'movie',
    keywords: ['hindi movies', 'bollywood movies online', 'hindi dubbed'],
  },
  {
    path: '/sci-fi-movies',
    title: `Sci-Fi Movies Watch Online — ${SITE_NAME}`,
    description: `Stream science fiction movies and sci-fi TV in HD on ${SITE_NAME}.`,
    h1: 'Sci-Fi Movies & Series',
    intro: 'Space operas, dystopian futures, and mind-bending science fiction.',
    mediaType: 'movie',
    genreId: 878,
    keywords: ['sci-fi movies', 'science fiction online'],
  },
];

export const STATIC_SITEMAP_PATHS = [
  '/',
  '/browse',
  '/movies',
  '/tv-shows',
  '/new-popular',
  '/my-list',
  '/disclaimer',
  '/what-is-moonflix',
  ...SEO_CATEGORY_PAGES.map((c) => c.path),
];

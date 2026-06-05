import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Play, Star, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeoHead } from '@/components/SeoHead';
import { MediaCarousel } from '@/components/MediaCarousel';
import { LazyImage } from '@/components/LazyImage';
import {
  Movie,
  TVShow,
  TMDB_IMAGE_URL,
} from '@/lib/tmdb';
import {
  useMovieDetails,
  useTVShowDetails,
} from '@/hooks/useTMDBQuery';
import { useSimilarContent } from '@/hooks/useSimilarContent';
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildMovieDescription,
  buildMovieJsonLd,
  buildMoviePageTitle,
  getMediaTitle,
  getMediaYear,
  parseMediaIdFromSlug,
  posterUrl,
  routeTypeToMediaType,
  SITE_NAME,
  type MediaRouteType,
} from '@/lib/seo';

const MediaModal = lazy(() =>
  import('@/components/MediaModalLazy').then((m) => ({ default: m.MediaModalLazy }))
);

function getRouteTypeFromPath(pathname: string): MediaRouteType {
  if (pathname.startsWith('/anime/')) return 'anime';
  if (pathname.startsWith('/tv/')) return 'tv';
  return 'movie';
}

const MediaDetailPage = () => {
  const { pathname } = useLocation();
  const routeType = getRouteTypeFromPath(pathname);
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mediaId = parseMediaIdFromSlug(slug);
  const mediaType = routeTypeToMediaType(routeType);
  const asAnime = routeType === 'anime';

  const { data: movieDetails, isLoading: movieLoading } = useMovieDetails(
    mediaId ?? 0,
    mediaType === 'movie' && !!mediaId
  );
  const { data: tvDetails, isLoading: tvLoading } = useTVShowDetails(
    mediaId ?? 0,
    mediaType === 'tv' && !!mediaId
  );

  const details = mediaType === 'movie' ? movieDetails : tvDetails;
  const isLoading = mediaType === 'movie' ? movieLoading : tvLoading;

  const listItem = useMemo((): Movie | TVShow | null => {
    if (!details) return null;
    if (mediaType === 'movie') {
      return details as Movie;
    }
    return details as TVShow;
  }, [details, mediaType]);

  const { data: similar = [] } = useSimilarContent(listItem, mediaType);

  const [isModalOpen, setIsModalOpen] = useState(
    () => searchParams.get('play') === '1'
  );

  const canonicalPath = `/${routeType}/${slug ?? ''}`;
  const pageUrl = absoluteUrl(canonicalPath);

  const title = details ? getMediaTitle(details) : 'Loading…';
  const year = details ? getMediaYear(details) : null;
  const seoTitle = details
    ? buildMoviePageTitle(title, year)
    : `Watch Online — ${SITE_NAME}`;
  const seoDescription = details
    ? buildMovieDescription(title, details.overview, mediaType)
    : `Watch movies and TV shows online in HD on ${SITE_NAME}.`;

  const handlePlay = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const [similarItem, setSimilarItem] = useState<Movie | TVShow | null>(null);
  const [similarMediaType, setSimilarMediaType] = useState<'movie' | 'tv'>('movie');
  const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);

  const handleMoreInfo = useCallback((item: Movie | TVShow, type: 'movie' | 'tv') => {
    setSimilarItem(item);
    setSimilarMediaType(type);
    setIsSimilarModalOpen(true);
  }, []);

  if (!mediaId) {
    return (
      <>
        <SeoHead
          title={`Not Found — ${SITE_NAME}`}
          description="This title could not be found."
          canonicalPath="/browse"
          noindex
        />
        <div className="px-4 lg:px-16 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid link</h1>
          <Button asChild>
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
      </>
    );
  }

  if (!isLoading && !details) {
    return (
      <>
        <SeoHead
          title={`Not Found — ${SITE_NAME}`}
          description="This title could not be found."
          canonicalPath="/browse"
          noindex
        />
        <div className="px-4 lg:px-16 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Title not found</h1>
          <Button asChild>
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
      </>
    );
  }

  const backdrop = details?.backdrop_path
    ? `${TMDB_IMAGE_URL.w1280}${details.backdrop_path}`
    : posterUrl(details?.poster_path);
  const genres = 'genres' in (details || {}) ? (details as { genres?: { name: string }[] }).genres : [];
  const runtime =
    details && 'runtime' in details && details.runtime
      ? `${details.runtime} min`
      : details && 'episode_run_time' in details && details.episode_run_time?.[0]
        ? `${details.episode_run_time[0]} min / ep`
        : null;

  const jsonLd = details
    ? [
        buildMovieJsonLd(details, mediaType, pageUrl),
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/browse' },
          {
            name: mediaType === 'movie' ? 'Movies' : asAnime ? 'Anime' : 'TV Shows',
            path: mediaType === 'movie' ? '/movies' : asAnime ? '/anime' : '/tv-shows',
          },
          { name: title, path: canonicalPath },
        ]),
      ]
    : undefined;

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        image={posterUrl(details?.poster_path || details?.backdrop_path)}
        type={mediaType === 'movie' ? 'video.movie' : 'video.tv_show'}
        jsonLd={jsonLd}
      />

      <article className="pb-12">
        <div className="relative w-full aspect-[21/9] max-h-[70vh] overflow-hidden bg-black">
          {details && (
            <img
              src={backdrop}
              alt={`${title} backdrop`}
              className="w-full h-full object-cover opacity-60"
              fetchPriority="high"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-16 pb-8">
            <nav className="text-sm text-muted-foreground mb-3 flex flex-wrap items-center gap-1">
              <Link to="/browse" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link
                to={mediaType === 'movie' ? '/movies' : asAnime ? '/anime' : '/tv-shows'}
                className="hover:text-foreground"
              >
                {mediaType === 'movie' ? 'Movies' : asAnime ? 'Anime' : 'TV Shows'}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{title}</span>
            </nav>

            {isLoading ? (
              <div className="h-10 w-64 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
                  {title}
                  {year && (
                    <span className="text-muted-foreground font-normal text-xl md:text-2xl ml-2">
                      ({year})
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                  {details && details.vote_average > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {details.vote_average.toFixed(1)} / 10
                    </span>
                  )}
                  {year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {year}
                    </span>
                  )}
                  {runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {runtime}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres?.map((g) => (
                    <Badge key={g.name} variant="secondary">
                      {g.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button size="lg" className="gap-2" onClick={handlePlay} disabled={!details}>
                    <Play className="h-5 w-5 fill-current" />
                    Watch Now
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-4 lg:px-16 mt-8 grid lg:grid-cols-[240px_1fr] gap-8">
          {details?.poster_path && (
            <LazyImage
              src={posterUrl(details.poster_path)}
              alt={`${title} poster`}
              className="w-full max-w-[240px] rounded-md shadow-lg hidden lg:block"
            />
          )}
          <div className="space-y-6 max-w-3xl">
            <section>
              <h2 className="text-xl font-semibold mb-2">Synopsis</h2>
              <p className="text-muted-foreground leading-relaxed">
                {details?.overview ||
                  `${title} is available to stream in HD on ${SITE_NAME}. Browse cast, episodes, and similar titles below.`}
              </p>
            </section>

            {'tagline' in (details || {}) && (details as { tagline?: string })?.tagline && (
              <p className="italic text-muted-foreground">
                {(details as { tagline: string }).tagline}
              </p>
            )}

            <section>
              <h2 className="text-xl font-semibold mb-2">About {title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                Watch <strong>{title}</strong>
                {year ? ` (${year})` : ''} online for free in HD on {SITE_NAME}.{' '}
                {mediaType === 'movie'
                  ? 'Stream this movie with fast playback and a Netflix-style experience.'
                  : 'Binge episodes with season lists, trailers, and continue watching.'}{' '}
                Explore related titles below or add this to your My List from the player.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">FAQ</h2>
              <dl className="space-y-4 text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Can I watch {title} for free?</dt>
                  <dd className="mt-1">
                    Yes — {SITE_NAME} lets you stream {title} online without a subscription fee.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">What quality is available?</dt>
                  <dd className="mt-1">
                    Titles are streamed in HD where sources allow, with adaptive playback on mobile and desktop.
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        {similar.length > 0 && listItem && (
          <div className="mt-10">
            <MediaCarousel
              title="More Like This"
              items={similar}
              onPlay={() => handlePlay()}
              onMoreInfo={handleMoreInfo}
            />
          </div>
        )}
      </article>

      {listItem && (
        <Suspense fallback={null}>
          <MediaModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              if (searchParams.get('play') === '1') {
                navigate(canonicalPath, { replace: true });
              }
            }}
            item={listItem}
            mediaType={mediaType}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
          />
        </Suspense>
      )}

      {similarItem && (
        <Suspense fallback={null}>
          <MediaModal
            isOpen={isSimilarModalOpen}
            onClose={() => {
              setIsSimilarModalOpen(false);
              setSimilarItem(null);
            }}
            item={similarItem}
            mediaType={similarMediaType}
            onPlay={() => setIsSimilarModalOpen(true)}
            onMoreInfo={handleMoreInfo}
          />
        </Suspense>
      )}
    </>
  );
};

export default MediaDetailPage;

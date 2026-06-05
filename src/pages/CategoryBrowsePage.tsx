import { useMemo, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead';
import { MediaCarousel } from '@/components/MediaCarousel';
import { MediaModalLazy as MediaModal } from '@/components/MediaModalLazy';
import {
  usePopularMovies,
  usePopularTVShows,
  useTopRatedMovies,
  useTopRatedTVShows,
  useMoviesByGenre,
  useTVShowsByGenre,
  useAnimeShows,
  useKDramaShows,
  useIndianMovies,
  useTrending,
} from '@/hooks/useTMDBQuery';
import { Movie, TVShow } from '@/lib/tmdb';
import { SEO_CATEGORY_PAGES, SITE_NAME, buildBreadcrumbJsonLd } from '@/lib/seo';

const CategoryBrowsePage = () => {
  const { pathname } = useLocation();
  const config = SEO_CATEGORY_PAGES.find((c) => c.path === pathname);

  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: trending = [] } = useTrending('all', 'week');
  const { data: popularMovies = [] } = usePopularMovies();
  const { data: popularTV = [] } = usePopularTVShows();
  const { data: topMovies = [] } = useTopRatedMovies();
  const { data: topTV = [] } = useTopRatedTVShows();
  const { data: comedy = [] } = useMoviesByGenre(35);
  const { data: action = [] } = useMoviesByGenre(28);
  const { data: horror = [] } = useMoviesByGenre(27);
  const { data: sciFiMovies = [] } = useMoviesByGenre(878);
  const { data: sciFiTv = [] } = useTVShowsByGenre(10765);
  const { data: animeTv = [] } = useTVShowsByGenre(16);
  const { data: animeShows = [] } = useAnimeShows();
  const { data: kDrama = [] } = useKDramaShows();
  const { data: hindi = [] } = useIndianMovies();

  const items = useMemo((): Array<Movie | TVShow> => {
    if (!config) return [];
    switch (config.path) {
      case '/trending':
        return [...popularMovies.slice(0, 12), ...popularTV.slice(0, 12), ...trending].slice(0, 40);
      case '/top-rated':
        return [...topMovies.slice(0, 20), ...topTV.slice(0, 20)];
      case '/comedy-movies':
        return comedy;
      case '/action-movies':
        return action;
      case '/horror-movies':
        return horror;
      case '/anime':
        return animeShows.length ? animeShows : animeTv;
      case '/korean-drama':
        return kDrama;
      case '/hindi-movies':
        return hindi;
      case '/sci-fi-movies':
        return [...sciFiMovies.slice(0, 24), ...sciFiTv.slice(0, 16)];
      default:
        return popularMovies;
    }
  }, [
    config,
    trending,
    popularMovies,
    popularTV,
    topMovies,
    topTV,
    comedy,
    action,
    horror,
    sciFiMovies,
    sciFiTv,
    animeShows,
    animeTv,
    kDrama,
    hindi,
  ]);

  const handleMoreInfo = useCallback((item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  }, []);

  const handlePlay = useCallback((item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  }, []);

  if (!config) {
    return (
      <div className="px-4 lg:px-16 py-20 text-center">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <Link to="/browse" className="text-primary underline mt-4 inline-block">
          Go to Browse
        </Link>
      </div>
    );
  }

  const jsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/browse' },
    { name: config.h1, path: config.path },
  ]);

  return (
    <>
      <SeoHead
        title={config.title}
        description={config.description}
        canonicalPath={config.path}
        jsonLd={jsonLd}
      />

      <div className="px-4 lg:px-16 py-8">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/browse" className="hover:text-foreground">
            Home
          </Link>
          {' / '}
          <span className="text-foreground">{config.h1}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">{config.h1}</h1>
        <p className="text-muted-foreground max-w-3xl mb-6 leading-relaxed">{config.intro}</p>

        <section className="prose prose-invert max-w-3xl mb-8 text-muted-foreground text-sm">
          <p>
            Browse {config.keywords.join(', ')} on {SITE_NAME}. Click any title for details, cast, and
            episodes — then watch in HD.
          </p>
        </section>

        <MediaCarousel
          title={config.h1}
          items={items}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
        />

        <section className="mt-12 max-w-3xl space-y-4 text-muted-foreground text-sm">
          <h2 className="text-lg font-semibold text-foreground">Explore more on Moonflix</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {SEO_CATEGORY_PAGES.filter((c) => c.path !== config.path).map((c) => (
              <li key={c.path}>
                <Link to={c.path} className="hover:text-primary underline underline-offset-2">
                  {c.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/movies" className="hover:text-primary underline underline-offset-2">
                All Movies
              </Link>
            </li>
            <li>
              <Link to="/tv-shows" className="hover:text-primary underline underline-offset-2">
                All TV Shows
              </Link>
            </li>
          </ul>
        </section>
      </div>

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
    </>
  );
};

export default CategoryBrowsePage;

import { useState, useEffect, useCallback } from 'react';
import { Play, Plus, Info, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TMDB_IMAGE_URL, Movie, TVShow, getTrending, getTVShowDetails } from '@/lib/tmdb';
import { useMyList } from '@/hooks/useMyList';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeroSectionProps {
  onPlayClick: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onInfoClick: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}

const WEDNESDAY_BANNER =
  'https://image.tmdb.org/t/p/original/cbODFqkcmRgrYH8NkG4Q4Hcg8Z1.jpg';

const WEDNESDAY_ID = 273240;

export const HeroSection = ({
  onPlayClick,
  onInfoClick,
}: HeroSectionProps) => {
  const [featuredContent, setFeaturedContent] = useState<Movie | TVShow | null>(null);
  const [wednesdayData, setWednesdayData] = useState<TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const isMobile = useIsMobile();
  const { isInMyList, toggleMyList } = useMyList();

  /* ───────────────── FETCH ───────────────── */
  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedContent = async () => {
      const mobileViewport =
        typeof window !== 'undefined' && window.innerWidth < 768;

      try {
        if (mobileViewport) {
          const wednesdayResponse = await getTVShowDetails(WEDNESDAY_ID);

          if (cancelled) return;

          setWednesdayData(wednesdayResponse);
          setFeaturedContent(wednesdayResponse);
          return;
        }

        const [wednesdayResponse, trendingResponse] = await Promise.all([
          getTVShowDetails(WEDNESDAY_ID),
          getTrending('all', 'week'),
        ]);

        if (cancelled) return;

        setWednesdayData(wednesdayResponse);

        const results = trendingResponse.results ?? [];
        const randomIndex = Math.floor(
          Math.random() * Math.min(results.length, 10)
        );

        setFeaturedContent(results[randomIndex] ?? wednesdayResponse);
      } catch (error) {
        console.error('Error fetching featured content:', error);

        try {
          const fallback = await getTVShowDetails(WEDNESDAY_ID);

          if (cancelled) return;

          setFeaturedContent(fallback);
          setWednesdayData(fallback);
        } catch (fallbackError) {
          console.error('Failed to fetch Wednesday fallback:', fallbackError);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchFeaturedContent();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ───────────────── MOBILE SWITCH ───────────────── */
  useEffect(() => {
    if (
      isMobile &&
      wednesdayData &&
      featuredContent?.id !== WEDNESDAY_ID
    ) {
      setFeaturedContent(wednesdayData);
    }
  }, [isMobile, wednesdayData, featuredContent?.id]);

  /* ───────────────── HANDLERS ───────────────── */
  const handlePlayClick = useCallback(() => {
    if (!featuredContent) return;

    onInfoClick(
      featuredContent,
      'title' in featuredContent ? 'movie' : 'tv'
    );
  }, [featuredContent, onInfoClick]);

  const handleMyList = useCallback(() => {
    if (!featuredContent) return;

    toggleMyList(
      featuredContent,
      'title' in featuredContent ? 'movie' : 'tv'
    );
  }, [featuredContent, toggleMyList]);

  /* ───────────────── LOADING ───────────────── */
  if (isLoading || !featuredContent) {
    return (
      <div className="relative h-screen flex items-center justify-center bg-muted animate-pulse">
        <div className="text-center">
          <div className="w-64 h-8 bg-muted-foreground/20 rounded mb-4" />
          <div className="w-96 h-4 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    );
  }

  /* ───────────────── DERIVED ───────────────── */
  const title =
    'title' in featuredContent
      ? featuredContent.title
      : featuredContent.name;

  const mediaType =
    'title' in featuredContent ? 'movie' : 'tv';

  const releaseDate =
    'release_date' in featuredContent
      ? featuredContent.release_date
      : featuredContent.first_air_date;

  const releaseYear = releaseDate
    ? new Date(releaseDate).getFullYear()
    : null;

  const matchPct = Math.min(
    99,
    Math.round((featuredContent.vote_average / 10) * 100)
  );

  const rating = mediaType === 'tv' ? 'TV-14' : 'PG-13';

  const backdropUrl = isMobile
    ? WEDNESDAY_BANNER
    : featuredContent.backdrop_path
      ? `${TMDB_IMAGE_URL.original}${featuredContent.backdrop_path}`
      : WEDNESDAY_BANNER;

  const inList = isInMyList(featuredContent.id);

  /* ───────────────── RENDER ───────────────── */
  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background */}
      {backdropUrl && (
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            filter: isMobile
              ? 'none'
              : 'brightness(0.85) contrast(1.1) saturate(1.2)',
            height: '100vh',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />
      )}

      {/* ───────────────── DESKTOP OVERLAYS ───────────────── */}

      {/* Desktop left vignette */}
      <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/85 via-black/25 to-transparent" />

      {/* Bottom page blend */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Top navbar fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />

      {/* ───────────────── MOBILE VIGNETTE ───────────────── */}

      {/* Soft cinematic vignette only */}
      <div
        className="absolute inset-0 sm:hidden pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, transparent 48%, rgba(0,0,0,0.28) 100%)',
        }}
      />

      {/* Bottom readability fade */}
      <div className="absolute inset-0 sm:hidden bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-netflix-red/10 rounded-full blur-3xl pointer-events-none sm:hidden" />

      <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none sm:hidden" />

      {/* ───────────────── CONTENT ───────────────── */}
      <div className="relative z-10 flex flex-col h-full">

        {/* ═════════ DESKTOP ═════════ */}
        <div className="hidden sm:flex flex-col justify-end h-full px-10 lg:px-20 pb-[7vh] lg:pb-[10vh]">

          {/* Type */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#E50914] font-black text-xl tracking-tight italic select-none">
              N
            </span>

            <span className="text-white/80 text-[11px] font-bold tracking-[0.28em] uppercase">
              {mediaType === 'tv' ? 'Series' : 'Film'}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-black text-white leading-[0.90] tracking-tight drop-shadow-[0_4px_28px_rgba(0,0,0,0.8)] max-w-[13ch] mb-5 text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[6.5rem]">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-[#46d369] font-bold text-sm">
              {matchPct}% Match
            </span>

            {releaseYear && (
              <span className="text-white/65 text-sm">
                {releaseYear}
              </span>
            )}

            <span className="border border-white/45 text-white/65 text-[10px] px-1.5 py-0.5 leading-none rounded-sm tracking-wide">
              {rating}
            </span>

            <span className="text-white/65 text-sm">
              {mediaType === 'tv' ? 'Series' : 'Movie'}
            </span>

            <span className="border border-white/45 text-white/65 text-[10px] px-1.5 py-0.5 leading-none rounded-sm tracking-wide">
              HD
            </span>
          </div>

          {/* Overview */}
          <p className="text-white/90 leading-relaxed font-light max-w-sm md:max-w-md lg:max-w-xl line-clamp-3 lg:line-clamp-4 mb-7 drop-shadow text-sm md:text-base lg:text-[1.05rem]">
            {featuredContent.overview}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayClick}
              className="flex items-center gap-2.5 px-8 lg:px-10 py-2.5 lg:py-3 bg-white text-black font-bold rounded-[4px] hover:bg-white/85 active:scale-95 transition-all duration-150 shadow-lg text-sm lg:text-[1rem]"
            >
              <Play className="h-5 w-5 lg:h-[22px] lg:w-[22px] fill-black flex-shrink-0" />
              Play
            </button>

            <button
              onClick={() => onInfoClick(featuredContent, mediaType)}
              className="flex items-center gap-2.5 px-8 lg:px-10 py-2.5 lg:py-3 bg-[rgba(109,109,110,0.7)] text-white font-bold rounded-[4px] hover:bg-[rgba(109,109,110,0.5)] active:scale-95 transition-all duration-150 backdrop-blur-sm text-sm lg:text-[1rem]"
            >
              <Info className="h-5 w-5 lg:h-[22px] lg:w-[22px] flex-shrink-0" />
              More Info
            </button>
          </div>

          {/* Right controls */}
          <div className="absolute right-10 lg:right-20 bottom-[7vh] lg:bottom-[10vh] flex items-center gap-3">
            <button
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="w-9 h-9 rounded-full border-2 border-white/55 bg-black/40 text-white flex items-center justify-center hover:border-white hover:bg-black/60 transition-all duration-150"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <div className="border-l-2 border-white/55 pl-3 pr-5 py-1.5 bg-black/35 text-white/90 text-[11px] font-semibold tracking-widest uppercase">
              {rating}
            </div>
          </div>
        </div>

        {/* ═════════ MOBILE ═════════ */}
        <div className="sm:hidden flex flex-col h-full">
          <div className="flex-1" />

          <div className="px-4 pb-8 pt-4 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-netflix-red text-xl font-black tracking-tight">
                N
              </div>

              <span className="text-white/90 font-medium text-xs tracking-widest uppercase">
                SERIES
              </span>
            </div>

            <h1 className="text-3xl font-black text-white drop-shadow-2xl leading-tight tracking-tight">
              {isMobile && wednesdayData
                ? wednesdayData.name
                : title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-white/80 text-sm">
                {mediaType === 'movie' ? 'Comedy' : 'Sci-Fi'}
              </span>

              <span className="text-white/60 text-sm">•</span>

              <span className="text-white/80 text-sm">
                Action & Adventure
              </span>

              <span className="text-white/60 text-sm">•</span>

              <span className="text-white/80 text-sm">
                {mediaType === 'movie'
                  ? 'Spy Movies'
                  : 'Based on Comics'}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handlePlayClick}
                className="flex-1 flex items-center justify-center gap-2 text-lg px-6 py-4 rounded-md bg-white text-black font-semibold"
              >
                <Play className="h-5 w-5 fill-current" />
                Play
              </Button>

              <Button
                onClick={handleMyList}
                className="flex-1 flex items-center justify-center gap-2 text-lg px-6 py-4 rounded-md bg-gray-600/80 backdrop-blur-sm text-white font-semibold"
              >
                <Plus
                  className={`h-5 w-5 ${
                    inList ? 'rotate-45' : ''
                  } transition-transform duration-300`}
                />

                My List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom page blend */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
};
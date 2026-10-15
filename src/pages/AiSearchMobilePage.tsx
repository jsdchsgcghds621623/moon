import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, RefreshCw, Search, Sparkles, Sparkles as WrappedIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaModalLazy as MediaModal } from '@/components/MediaModalLazy';
import { useNavbarSearchRegistry } from '@/context/NavbarSearchContext';
import { getMovieDetails, getTVShowDetails, getRandomItems, getImageUrl, Movie, TVShow } from '@/lib/tmdb';

const AI_RECOMMENDED_BASE_URL = 'https://meticulous-analysis-production-2ee6.up.railway.app';
const BRAND_ICON_URL = 'https://moonflix.website/lovable-uploads/Moonflix.png';

const SEARCH_RECOMMENDATIONS = [
  'best space adventure movies',
  'best horror movies at night',
  'recommend me a series',
  'recommend me a movie',
  'movies with crazy plot twists',
  'series to binge this weekend',
  'feel good movies',
  'dark psychological thrillers',
  'movies like Inception',
  'best anime to start',
];

type AiSearchItem = {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster?: string;
  year?: string;
  description?: string;
  tmdbId?: number;
};

const fetchAiSearch = async (query: string) => {
  const [movieResponse, seriesResponse] = await Promise.all([
    fetch(`${AI_RECOMMENDED_BASE_URL}/movies/search?q=${encodeURIComponent(query)}`),
    fetch(`${AI_RECOMMENDED_BASE_URL}/series/search?q=${encodeURIComponent(query)}`),
  ]);

  if (!movieResponse.ok || !seriesResponse.ok) {
    throw new Error('Unable to fetch AI search results');
  }

  const [movieData, seriesData] = await Promise.all([movieResponse.json(), seriesResponse.json()]);

  const movies = (movieData.metas ?? []).slice(0, 6).map((item: any) => ({
    id: item.id ?? `${item.name}-${Math.random()}`,
    title: item.name ?? item.title ?? 'Untitled movie',
    type: 'movie' as const,
    poster: item.poster,
    year: item.year ?? item.releaseInfo,
    description: item.description ?? '',
    tmdbId: item.tmdbId ? Number(item.tmdbId) : undefined,
  }));

  const series = (seriesData.metas ?? []).slice(0, 6).map((item: any) => ({
    id: item.id ?? `${item.name}-${Math.random()}`,
    title: item.name ?? item.title ?? 'Untitled series',
    type: 'series' as const,
    poster: item.poster,
    year: item.year ?? item.releaseInfo,
    description: item.description ?? '',
    tmdbId: item.tmdbId ? Number(item.tmdbId) : undefined,
  }));

  return [...movies, ...series].slice(0, 12);
};

const AiSearchMobilePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AiSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [spinLoading, setSpinLoading] = useState(false);
  const [spinResults, setSpinResults] = useState<any[]>([]);
  const [showSpinResults, setShowSpinResults] = useState(false);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { onMoreInfo } = useNavbarSearchRegistry();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRotationIndex((current) => (current + 1) % SEARCH_RECOMMENDATIONS.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const activeSuggestion = SEARCH_RECOMMENDATIONS[rotationIndex] ?? SEARCH_RECOMMENDATIONS[0];

  const suggestionChips = useMemo(() => {
    const seen = new Set<string>();
    const chips: string[] = [];

    for (const suggestion of SEARCH_RECOMMENDATIONS) {
      if (seen.has(suggestion.toLowerCase())) continue;
      seen.add(suggestion.toLowerCase());
      chips.push(suggestion);
      if (chips.length === 6) break;
    }

    return chips;
  }, []);

  const handleOpenMediaItem = (item: any, mediaType: 'movie' | 'tv') => {
    if (onMoreInfo) {
      onMoreInfo(item as Movie | TVShow, mediaType);
      return;
    }

    setSelectedItem(item as Movie | TVShow);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const enrichMediaItem = async (item: any, mediaType: 'movie' | 'tv') => {
    const id = item?.tmdb_id ?? item?.tmdbId ?? item?.id;

    if (!id) {
      return {
        ...item,
        id: Number(item?.id) || 0,
        title: item?.title ?? item?.name ?? 'Untitled',
        name: item?.name ?? item?.title ?? 'Untitled',
        overview: item?.overview ?? item?.description ?? '',
        poster_path: item?.poster_path || item?.poster || '',
        backdrop_path: item?.backdrop_path || item?.poster || '',
        release_date: item?.release_date ?? item?.first_air_date ?? item?.year ?? '',
        first_air_date: item?.first_air_date ?? item?.release_date ?? item?.year ?? '',
        vote_average: item?.vote_average ?? 0,
        genre_ids: item?.genre_ids ?? [],
        adult: item?.adult ?? false,
        original_language: item?.original_language ?? 'en',
        original_title: item?.original_title ?? item?.title ?? item?.name ?? 'Untitled',
        popularity: item?.popularity ?? 0,
        video: item?.video ?? false,
        vote_count: item?.vote_count ?? 0,
        origin_country: item?.origin_country ?? ['US'],
        original_name: item?.original_name ?? item?.name ?? item?.title ?? 'Untitled',
      } as Movie | TVShow;
    }

    try {
      const details = mediaType === 'movie'
        ? await getMovieDetails(Number(id))
        : await getTVShowDetails(Number(id));

      return {
        ...details,
        id: details.id,
        title: 'title' in details ? details.title : details.name,
        name: 'name' in details ? details.name : undefined,
        overview: details.overview ?? item?.overview ?? item?.description ?? '',
        poster_path: details.poster_path || item?.poster_path || item?.poster || '',
        backdrop_path: details.backdrop_path || item?.poster_path || item?.poster || '',
        release_date: 'release_date' in details ? details.release_date : details.first_air_date,
        first_air_date: 'first_air_date' in details ? details.first_air_date : undefined,
        vote_average: details.vote_average ?? item?.vote_average ?? 0,
        genre_ids: details.genres?.map((genre) => genre.id) ?? item?.genre_ids ?? [],
      } as Movie | TVShow;
    } catch {
      return {
        ...item,
        id: Number(item?.id) || 0,
        title: item?.title ?? item?.name ?? 'Untitled',
        name: item?.name ?? item?.title ?? 'Untitled',
        overview: item?.overview ?? item?.description ?? '',
        poster_path: item?.poster_path || item?.poster || '',
        backdrop_path: item?.backdrop_path || item?.poster || '',
        release_date: item?.release_date ?? item?.first_air_date ?? item?.year ?? '',
        first_air_date: item?.first_air_date ?? item?.release_date ?? item?.year ?? '',
        vote_average: item?.vote_average ?? 0,
        genre_ids: item?.genre_ids ?? [],
        adult: item?.adult ?? false,
        original_language: item?.original_language ?? 'en',
        original_title: item?.original_title ?? item?.title ?? item?.name ?? 'Untitled',
        popularity: item?.popularity ?? 0,
        video: item?.video ?? false,
        vote_count: item?.vote_count ?? 0,
        origin_country: item?.origin_country ?? ['US'],
        original_name: item?.original_name ?? item?.name ?? item?.title ?? 'Untitled',
      } as Movie | TVShow;
    }
  };

  const handleSearch = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      setShowSpinResults(false);
      return;
    }

    setShowSpinResults(false);
    setResults([]);
    setIsLoading(true);
    try {
      const items = await fetchAiSearch(trimmed);
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpinNow = async () => {
    setShowSpinResults(true);
    setSpinResults([]);
    setSpinLoading(true);
    try {
      const items = await getRandomItems(6);
      setSpinResults(items);
    } catch {
      setSpinResults([]);
    } finally {
      setSpinLoading(false);
    }
  };

  const handleOpenResult = async (item: AiSearchItem) => {
    const mediaType = item.type === 'series' ? 'tv' : 'movie';
    const enrichedItem = await enrichMediaItem({
      ...item,
      tmdbId: item.tmdbId,
      poster: item.poster,
      title: item.title,
      name: item.title,
      description: item.description,
      year: item.year,
    }, mediaType);

    handleOpenMediaItem(enrichedItem, mediaType);
  };

  return (
    <>
    <div className="min-h-screen bg-[#0b0b0b] text-white pt-safe pb-safe">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0b0b]/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80"
            aria-label="Back to search"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#54b9c5]">Moonflix AI</p>
            <p className="text-sm font-semibold text-white">AI Search</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#54b9c5]/30 bg-[#54b9c5]/10">
              <img src={BRAND_ICON_URL} alt="Moonflix" className="h-6 w-6 rounded-sm object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Discover your next favorite</p>
              <p className="text-xs text-white/60">Search by mood, genre, or vibe.</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
            <Search className="h-4 w-4 text-white/50" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearch(query);
                }
              }}
              placeholder="Try a movie or series prompt"
              className="h-8 border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/40 focus-visible:ring-0"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-[#54b9c5] to-[#3b9ba7] text-black"
              onClick={() => handleSearch(query)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full justify-center border-white/10 bg-white/5 text-sm text-white/90"
              onClick={handleSpinNow}
            >
              {spinLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {spinLoading ? 'Spinning...' : 'Not know what to watch? Spin now'}
            </Button>

            <Button
              type="button"
              size="sm"
              className="h-9 w-full justify-center border border-[#54b9c5]/25 bg-gradient-to-r from-[#54b9c5]/15 to-[#3b9ba7]/15 text-sm text-[#54b9c5]"
              onClick={() => navigate('/wrapped')}
            >
              <WrappedIcon className="mr-2 h-4 w-4" />
              Wrapped
            </Button>
          </div>
        </div>

        {!query && !isLoading && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#54b9c5]" />
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Try this prompt</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{activeSuggestion}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                  className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#54b9c5]" />
              <span>Finding matches...</span>
            </div>
          </div>
        ) : null}

        {!isLoading && query && results.length === 0 && !showSpinResults ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
            No AI matches yet for “{query}”. Try a broader prompt.
          </div>
        ) : null}

        {!isLoading && showSpinResults ? (
          <div className="space-y-2">
            {spinLoading ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70">
                Finding something great for you...
              </div>
            ) : spinResults.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                No spin picks available right now.
              </div>
            ) : (
              spinResults.map((item) => (
                <button
                  key={`${item.media_type ?? 'media'}-${item.id}`}
                  type="button"
                  onClick={async () => {
                    const mediaType = item.media_type === 'movie' ? 'movie' : 'tv';
                    const enrichedItem = await enrichMediaItem(item, mediaType);
                    handleOpenMediaItem(enrichedItem, mediaType);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2 text-left"
                >
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10">
                    {item.poster_path || item.poster ? (
                      <img
                        src={item.poster_path ? `${getImageUrl('w185')}${item.poster_path}` : item.poster}
                        alt={item.title || item.name || 'Media poster'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-white/50">
                        {item.media_type === 'movie' ? 'Movie' : 'Series'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.title || item.name}</p>
                    <p className="mt-0.5 text-xs text-white/50">
                      {item.media_type === 'movie' ? 'Movie' : 'Series'}
                      {item.release_date ? ` • ${item.release_date.slice(0, 4)}` : ''}
                    </p>
                    {(item.overview || item.description) ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/55">
                        {item.overview || item.description}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </button>
              ))
            )}
          </div>
        ) : null}

        {!isLoading && !showSpinResults && results.length > 0 ? (
          <div className="space-y-2">
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenResult(item)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2 text-left"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-white/50">
                      {item.type}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {item.type === 'series' ? 'Series' : 'Movie'}
                    {item.year ? ` • ${item.year}` : ''}
                  </p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/55">{item.description}</p>
                  ) : null}
                </div>
                <ChevronRight className="h-4 w-4 text-white/40" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
    <MediaModal
      isOpen={isModalOpen && selectedItem !== null}
      onClose={closeModal}
      item={selectedItem}
      mediaType={selectedMediaType}
      onPlay={handleOpenMediaItem}
      onMoreInfo={handleOpenMediaItem}
    />
    </>
  );
};

export default AiSearchMobilePage;

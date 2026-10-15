import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Search, Sparkles, Sparkles as WrappedIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavbarSearchRegistry } from '@/context/NavbarSearchContext';
import { getMovieDetails, getTVShowDetails, getRandomItems, getImageUrl, Movie, TVShow } from '@/lib/tmdb';

const AI_RECOMMENDED_BASE_URL = 'https://meticulous-analysis-production-2ee6.up.railway.app';

export const SEARCH_RECOMMENDATIONS = [
  'best space adventure movies',
  'Shows Like Stranger Things',
  'movie with great ending',
  'high school zombie series',
  'recommend me a series',
  'recommend me a movie',
  'movies with crazy plot twists',
  'series to binge this weekend',
  'best space adventure movies',
  'romantic series with happy ending',
  'dark psychological thrillers',
  'best detective series',
  'shows like Stranger Things',
  'movies like Inception',
  'movies like John Wick',
  'movies like Harry Potter',
  'movies like The Dark Knight',
  'best survival movies',
  'apocalypse movies',
  'virus outbreak movies',
  'alien invasion movies',
  'haunted house movies',
  'best horror movies at night',
  'scary movies based on true stories',
  'feel good movies',
  'comfort movies',
  'family movies everyone will enjoy',
  'best action movies',
  'action movies with no boring scenes',
  'best revenge movies',
  'revenge thriller series',
  'crime shows based on true events',
  'best prison escape movies',
  'bank robbery movies',
  'spy movies',
  'assassin movies',
  'best heist movies',
  'movies with amazing visuals',
  'movies with beautiful cinematography',
  'underrated movies',
  'hidden gems',
  'masterpiece movies',
  'must watch before you die',
  'IMDb top rated movies',
  'Oscar winning movies',
  'best movies of all time',
  'latest trending movies',
  'latest trending series',
  'what should i watch',
  'recommend me a movie',
  'recommend me a series',
  'something exciting to watch',
  'something different',
  'i want a good movie',
  'i need a binge worthy series',
  'movies with unexpected ending',
  'mind bending movies',
  'time travel movies',
  'parallel universe movies',
  'multiverse movies',
  'best fantasy series',
  'magic school movies',
  'dragon movies',
  'vampire romance',
  'werewolf movies',
  'best anime to start',
  'anime like Attack on Titan',
  'anime like Death Note',
  'best romance anime',
  'best comedy series',
  'laugh out loud movies',
  'movies that keep you hooked',
  'series with no fillers',
  'fast paced thrillers',
  'edge of your seat movies',
  'movies with great ending',
  'series with satisfying ending',
  'best courtroom dramas',
  'medical drama series',
  'best police shows',
  'best mystery movies',
  'serial killer thrillers',
  'best korean dramas',
  'best japanese movies',
  'best british crime series',
  'movies based on real life',
  'true story movies',
  'movies everyone should watch',
  'best movies for date night',
  'movies to watch with friends',
  'movies to watch with family',
  'late night horror movies',
  'best christmas movies',
  'summer vacation movies',
  'road trip movies',
  'treasure hunt movies',
  'pirate adventure movies',
  'space movies with amazing visuals',
  'best sci fi series',
  'best netflix style shows',
  'movies that deserve more attention',
  '10 out of 10 movies',
  'movies that never get boring',
  'best binge watch shows',
  'shows everyone is talking about',
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

export const AiSearchPanel = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const brandIconSrc = 'https://moonflix.website/lovable-uploads/Moonflix.png';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AiSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [spinLoading, setSpinLoading] = useState(false);
  const [spinResults, setSpinResults] = useState<any[]>([]);
  const [showSpinResults, setShowSpinResults] = useState(false);
  const [rotationIndex, setRotationIndex] = useState(0);
  const { onMoreInfo } = useNavbarSearchRegistry();
  const [isOpening, setIsOpening] = useState(false);

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

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setIsOpening(true);
      window.requestAnimationFrame(() => setIsOpening(false));
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

  const handleOpenMediaItem = (item: any, mediaType: 'movie' | 'tv') => {
    if (!onMoreInfo) return;

    onMoreInfo(item as Movie | TVShow, mediaType);
    setOpen(false);
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

  const handleOpenResult = async (item: AiSearchItem) => {
    if (!onMoreInfo) return;

    const mediaType = item.type === 'series' ? 'tv' : 'movie';
    const enrichedItem = await enrichMediaItem(
      {
        ...item,
        tmdbId: item.tmdbId,
        poster: item.poster,
        title: item.title,
        name: item.title,
        description: item.description,
        year: item.year,
      },
      mediaType,
    );

    handleOpenMediaItem(enrichedItem, mediaType);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex h-9 sm:h-10 px-3 text-xs sm:text-sm font-medium border-white/10 bg-gradient-to-r from-[#0f0f0f] via-[#151515] to-[#0b0b0b] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#54b9c5]/50 hover:shadow-[0_0_20px_rgba(84,185,197,0.16)]"
        >
          <img src={brandIconSrc} alt="Moonflix" className="mr-2 h-4 w-4 rounded-sm object-contain" />
          AI Search
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(94vw,500px)] p-0 border border-white/10 bg-[#0b0b0b]/95 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
      >
        <motion.div
          initial={false}
          animate={{ opacity: isOpening ? 0.96 : 1, y: isOpening ? 0 : 0 }}
          transition={{ duration: 0.16 }}
          className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(84,185,197,0.16),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4"
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-70" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#54b9c5]/30 bg-[#54b9c5]/10 shadow-[0_0_20px_rgba(84,185,197,0.16)]">
                  <img src={brandIconSrc} alt="Moonflix" className="h-5 w-5 rounded-sm object-contain" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.35em] text-[#54b9c5]">Moonflix AI</div>
                  <div className="text-sm font-semibold text-white">Discover your next binge</div>
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70">
                Live picks
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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
                placeholder="Search for a movie or series"
                className="h-8 border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/40 focus-visible:ring-0"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-[#54b9c5] to-[#3b9ba7] text-black shadow-[0_0_20px_rgba(84,185,197,0.18)] transition-all duration-300 hover:brightness-110"
                onClick={() => handleSearch(query)}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 flex-1 px-3 text-xs font-medium border-white/10 bg-white/5 text-white/90 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#54b9c5]/50 hover:bg-[#54b9c5]/10 hover:shadow-[0_0_18px_rgba(84,185,197,0.12)]"
                onClick={handleSpinNow}
              >
                {spinLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {spinLoading ? 'Spinning...' : 'Not know what to watch ? Spin now'}
              </Button>

              <Button
                type="button"
                size="sm"
                className="h-9 px-3 text-xs font-medium border border-[#54b9c5]/25 bg-gradient-to-r from-[#54b9c5]/15 to-[#3b9ba7]/15 text-[#54b9c5] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#54b9c5]/50 hover:bg-[#54b9c5]/20"
                onClick={() => {
                  setOpen(false);
                  navigate('/wrapped');
                }}
              >
                <WrappedIcon className="mr-2 h-4 w-4" />
                Wrapped
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="max-h-[75vh] overflow-y-auto p-4">
          {!query && !isLoading && (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/12 to-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#54b9c5]" />
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Rotating prompt</p>
                </div>
                <p className="mt-1 text-sm font-medium text-white">{activeSuggestion}</p>
              </motion.div>
              <div className="flex flex-wrap gap-2">
                {suggestionChips.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54b9c5] hover:bg-[#54b9c5]/10 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 text-sm text-white/70"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#54b9c5]" />
                <span>Finding matches...</span>
              </div>
            </motion.div>
          )}

          {!isLoading && query && results.length === 0 && !showSpinResults && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/12 to-white/5 p-4 text-center text-sm text-white/70"
            >
              No AI matches yet for “{query}”. Try a broader prompt.
            </motion.div>
          )}

          {!isLoading && showSpinResults && (
            <div className="space-y-3">
              {spinLoading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
                  Finding something great for you...
                </div>
              ) : spinResults.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  No spin picks available right now.
                </div>
              ) : (
                <div className="grid gap-2">
                  {spinResults.map((item) => (
                    <button
                      key={`${item.media_type ?? 'media'}-${item.id}`}
                      type="button"
                      onClick={async () => {
                        const mediaType = item.media_type === 'movie' ? 'movie' : 'tv';
                        const enrichedItem = await enrichMediaItem(item, mediaType);
                        handleOpenMediaItem(enrichedItem, mediaType);
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54b9c5]/60 hover:bg-[#54b9c5]/10 hover:shadow-[0_0_16px_rgba(84,185,197,0.12)]"
                    >
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-white/10">
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && !showSpinResults && results.length > 0 && (
            <div className="grid gap-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenResult(item)}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#54b9c5]/60 hover:bg-[#54b9c5]/10 hover:shadow-[0_0_20px_rgba(84,185,197,0.12)]"
                >
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-white/10">
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
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

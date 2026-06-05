import React, { useEffect, useState, useCallback, useRef } from 'react';
// import { useContinueWatching } from '@/hooks/useContinueWatching';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDevice } from '@/context/DeviceContext';
import { useToast } from '@/hooks/use-toast';
import {
  SKYFLIXER_VIDEOHOSTING_API,
  fetchSkyflixerVideohosting,
  extractServersFromVideohostingResponse,
  type SkyflixerServers,
} from '@/lib/skyflixerHosting';

/** Player env-only credentials / endpoints (set in `.env` with `VITE_` prefix). */
const TMDB_API_KEY = (import.meta.env.VITE_TMDB_API_KEY ?? '').trim();
const YANDEX_METRICA_ID = Number(import.meta.env.VITE_YANDEX_METRIKA_ID || 0);
const CONTENT_REQUEST_API_URL = (import.meta.env.VITE_CONTENT_REQUEST_API_URL ?? '').trim();
const LOCAL_STREAM_API_URL = (import.meta.env.VITE_LOCAL_STREAM_API_URL ?? '').trim().replace(/\/+$/, '');
const LOCAL_STREAM_DECRYPT_API_KEY = (import.meta.env.VITE_LOCAL_STREAM_DECRYPT_API_KEY ?? '').trim();

interface PlayerProps {
  title: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  onClose?: () => void;
}

type BestStream = {
  url: string;
  source: string;
};

type LocalStreamResponse = {
  streams?: Record<string, { token?: string; name?: string }>;
};

type LocalProviderKey = (typeof LOCAL_PROVIDER_PRIORITY)[number];

const VIDSRC_EMBED_MOVIE = 'https://vidsrc-embed.ru/embed/movie';
const VIDSRC_EMBED_TV = 'https://vidsrc-embed.ru/embed/tv';
const PEACHIFY_EMBED_MOVIE = 'https://peachify.top/embed/movie';
const PEACHIFY_EMBED_TV = 'https://peachify.top/embed/tv';

/** Player 5 — vidsrc-embed.ru (TMDB). */
const buildVidsrcEmbedUrl = (
  tmdbId: number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): string => {
  if (type === 'movie') {
    return `${VIDSRC_EMBED_MOVIE}?tmdb=${tmdbId}&autoplay=1`;
  }
  const s = season ?? 1;
  const e = episode ?? 1;
  return `${VIDSRC_EMBED_TV}?tmdb=${tmdbId}&season=${s}&episode=${e}&autoplay=1`;
};

/** Player 3 — peachify.top (TMDB). */
const buildPeachifyEmbedUrl = (
  tmdbId: number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): string => {
  if (type === 'movie') {
    return `${PEACHIFY_EMBED_MOVIE}/${tmdbId}`;
  }
  const s = season ?? 1;
  const e = episode ?? 1;
  return `${PEACHIFY_EMBED_TV}/${tmdbId}/${s}/${e}`;
};

const fetchWithRetry = async (url: string, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

/** Player 1: only Skyflixer primary CDNs. vidsrc/videasy from the API are ignored — use Player 2 for those. */
const getBestStream = (servers: SkyflixerServers | undefined | null): BestStream | null => {
  if (!servers) return null;

  const priority = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'] as const;

  for (const key of priority) {
    const server = servers[key];
    if (server?.available && server.embedUrl) {
      return {
        url: server.embedUrl,
        source: key,
      };
    }
  }

  return null;
};

const LOCAL_PROVIDER_PRIORITY = ['strmp2', 'upnshr', 'rpmshre'] as const;
const LOCAL_PROVIDER_LABELS: Record<(typeof LOCAL_PROVIDER_PRIORITY)[number], string> = {
  strmp2: 'Fast',
  upnshr: '4k',
  rpmshre: 'Super',
};

const fetchImdbIdFromTmdb = async (movieTmdbId: number): Promise<string> => {
  if (!TMDB_API_KEY) {
    throw new Error('VITE_TMDB_API_KEY is not set');
  }
  const endpoint = `https://api.themoviedb.org/3/movie/${movieTmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
  const data = await fetchWithRetry(endpoint);
  if (!data?.imdb_id) {
    throw new Error('Unable to resolve IMDB ID from TMDB');
  }
  return data.imdb_id as string;
};

const decryptLocalToken = async (token: string): Promise<string> => {
  if (!LOCAL_STREAM_API_URL) {
    throw new Error('VITE_LOCAL_STREAM_API_URL is not set');
  }
  if (!LOCAL_STREAM_DECRYPT_API_KEY) {
    throw new Error('VITE_LOCAL_STREAM_DECRYPT_API_KEY is not set');
  }
  const response = await fetch(`${LOCAL_STREAM_API_URL}/decrypt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      apiKey: LOCAL_STREAM_DECRYPT_API_KEY,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data?.url) {
    throw new Error(data?.error || 'Failed to decrypt stream token');
  }

  return data.url as string;
};

export const Player: React.FC<PlayerProps> = ({
  title,
  tmdbId,
  type,
  season,
  episode,
  onClose,
}) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [localApiStreams, setLocalApiStreams] = useState<Partial<Record<LocalProviderKey, string>>>({});
  const [activeLocalProvider, setActiveLocalProvider] = useState<LocalProviderKey | null>(null);
  const [contentYear, setContentYear] = useState<number>(new Date().getFullYear());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [activePlayer, setActivePlayer] = useState<
    'moonflix' | 'videasy' | 'vsEmbed' | 'peachify' | 'localApi'
  >('localApi');
  /** True after local API (Player 1 / sub-streams) attempt finishes for this playback. */
  const [localApiLoadDone, setLocalApiLoadDone] = useState(false);
  /** True after Skyflixer (Player 2) fetch attempt finishes for this playback. */
  const [skyflixerReady, setSkyflixerReady] = useState(false);
  const [contentDuration, setContentDuration] = useState<number>(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'success' | 'already_requested'>('none');
  const [releaseStatus, setReleaseStatus] = useState<'checking' | 'released' | 'not_released'>('checking');

  const watchStartTimeRef = useRef<number>(0);
  /** Prevents duplicate `/tv/{id}` or `/movie/{id}` fetches if this effect re-runs with the same playback. */
  const tmdbSaveKeyRef = useRef<string | null>(null);
  const isMobile = useIsMobile();
  const { isTV } = useDevice();
  const { toast } = useToast();
  // const { addToContinueWatching, updateProgress } = useContinueWatching();

  const handlePlayerClose = useCallback(() => {
    if (onClose) {
      const finalWatchTime = (Date.now() - watchStartTimeRef.current) / (1000 * 60);
      const finalProgress = Math.min((finalWatchTime / contentDuration) * 100, 100);
      // if (finalProgress > 5) {
      //   updateProgress(tmdbId, type, finalProgress, episode, season);
      // }
      onClose();
    }
  }, [onClose, contentDuration, tmdbId, type, episode, season]);

  useEffect(() => {
    let isMounted = true;

    const checkReleaseDate = async () => {
      try {
        if (!TMDB_API_KEY) {
          console.error('VITE_TMDB_API_KEY is not set');
          if (isMounted) setReleaseStatus('released');
          return;
        }

        const endpoint =
          type === 'movie'
            ? `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
            : `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}/episode/${episode}?api_key=${TMDB_API_KEY}`;

        const data = await fetchWithRetry(endpoint);

        if (!isMounted) return;

        setContentDuration(data.runtime || (type === 'tv' ? 45 : 120));
        const releaseDateStr = data.release_date || data.air_date;
        if (releaseDateStr) {
          const parsedYear = new Date(releaseDateStr).getFullYear();
          if (!Number.isNaN(parsedYear) && parsedYear > 1900) {
            setContentYear(parsedYear);
          }
        }

        if (releaseDateStr) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const releaseDate = new Date(releaseDateStr);

          if (releaseDate > today) {
            const formattedDate = releaseDate.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            setError(
              `This ${type === 'movie' ? 'movie' : 'episode'} is not yet released. It will be available on ${formattedDate}.`
            );
            setReleaseStatus('not_released');
          } else {
            setReleaseStatus('released');
          }
        } else {
          setReleaseStatus('released');
        }
      } catch (err) {
        console.error('Error fetching content info:', err);
        if (isMounted) setReleaseStatus('released');
      }
    };

    if (tmdbId) checkReleaseDate();

    return () => {
      isMounted = false;
    };
  }, [tmdbId, type, season, episode]);

  useEffect(() => {
    if (releaseStatus !== 'released') {
      if (releaseStatus === 'not_released') setLoading(false);
      return;
    }

    let isMounted = true;
    setSkyflixerReady(false);
    setVideoId(null);

    const loadStream = async () => {
      try {
        if (!SKYFLIXER_VIDEOHOSTING_API) {
          throw new Error('VITE_SKYFLIXER_VIDEOHOSTING_API is not set');
        }
        const data = await fetchSkyflixerVideohosting({
          title,
          year: contentYear || new Date().getFullYear(),
          tmdbId,
          mediaType: type === 'tv' ? 'tv' : 'movie',
          ...(type === 'tv' ? { season, episode } : {}),
        });
        const servers = extractServersFromVideohostingResponse(data);
        const best = getBestStream(servers);

        if (best) {
          setVideoId(best.url);
        } else {
          setVideoId(null);
        }
      } catch (err) {
        console.error('Smart player error:', err);
        setVideoId(null);
      } finally {
        if (isMounted) setSkyflixerReady(true);
      }
    };

    loadStream();

    return () => {
      isMounted = false;
    };
  }, [releaseStatus, title, contentYear, type, tmdbId, season, episode]);

  useEffect(() => {
    if (releaseStatus !== 'released') return;

    let isMounted = true;
    setLocalApiLoadDone(false);
    setLocalApiStreams({});
    setActiveLocalProvider(null);

    const loadLocalApiPlayer = async () => {
      try {
        if (!LOCAL_STREAM_API_URL || !LOCAL_STREAM_DECRYPT_API_KEY) {
          if (isMounted) {
            setLocalApiStreams({});
            setActiveLocalProvider(null);
          }
          return;
        }

        if (type === 'movie' && !TMDB_API_KEY) {
          console.error('VITE_TMDB_API_KEY is required for movie playback on Player 1');
          if (isMounted) {
            setLocalApiStreams({});
            setActiveLocalProvider(null);
          }
          return;
        }

        let endpoint = '';

        if (type === 'movie') {
          const imdbId = await fetchImdbIdFromTmdb(tmdbId);
          endpoint = `${LOCAL_STREAM_API_URL}/movie?imdb=${encodeURIComponent(imdbId)}`;
        } else {
          const s = season ?? 1;
          const e = episode ?? 1;
          endpoint = `${LOCAL_STREAM_API_URL}/series?tmdb=${tmdbId}&season=${s}&episode=${e}`;
        }

        const response = await fetch(endpoint);
        const data: LocalStreamResponse = await response.json();

        if (!response.ok) {
          throw new Error((data as { error?: string })?.error || 'Failed to fetch local stream');
        }

        const resolved: Partial<Record<LocalProviderKey, string>> = {};
        for (const provider of LOCAL_PROVIDER_PRIORITY) {
          const token = data.streams?.[provider]?.token;
          if (!token) continue;
          try {
            resolved[provider] = await decryptLocalToken(token);
          } catch (decryptErr) {
            console.error(`Local API decrypt error (${provider}):`, decryptErr);
          }
        }

        if (!Object.keys(resolved).length) {
          throw new Error('No decryptable local stream found');
        }

        if (isMounted) {
          setLocalApiStreams(resolved);
          const initialProvider = LOCAL_PROVIDER_PRIORITY.find((provider) => resolved[provider]);
          setActiveLocalProvider(initialProvider ?? null);
        }
      } catch (err) {
        console.error('Local API player error:', err);
        if (isMounted) {
          setLocalApiStreams({});
          setActiveLocalProvider(null);
        }
      } finally {
        if (isMounted) setLocalApiLoadDone(true);
      }
    };

    loadLocalApiPlayer();

    return () => {
      isMounted = false;
    };
  }, [releaseStatus, type, tmdbId, season, episode]);

  /** When playback changes, start from Player 1 again; cascade will move down if needed. */
  useEffect(() => {
    setActivePlayer('localApi');
    setFallbackMessage('');
  }, [tmdbId, type, season, episode]);

  /** After Player 1 (all sub-streams) and Player 2 loads settle: pick first available 1 → 2 → 3 (then user can open 4–5). */
  useEffect(() => {
    if (releaseStatus !== 'released') return;
    if (!localApiLoadDone || !skyflixerReady) return;

    const hasP1 = Object.keys(localApiStreams).length > 0;
    const hasP2 = !!videoId;

    let next: 'localApi' | 'moonflix' | 'videasy' | 'vsEmbed' | 'peachify';
    let msg = '';

    if (hasP1) {
      next = 'localApi';
    } else if (hasP2) {
      next = 'moonflix';
      msg = 'Player 1 unavailable. Using Player 2.';
    } else {
      next = 'peachify';
      msg = 'Players 1–2 unavailable. Using Player 3.';
    }

    setActivePlayer((prev) => {
      // Keep Players 3–5 if the user already chose an embed backup.
      if (prev === 'peachify' || prev === 'videasy' || prev === 'vsEmbed') return prev;
      return next;
    });

    if (msg) {
      setFallbackMessage(msg);
      const t = window.setTimeout(() => setFallbackMessage(''), 4000);
      return () => window.clearTimeout(t);
    }
  }, [
    releaseStatus,
    localApiLoadDone,
    skyflixerReady,
    localApiStreams,
    videoId,
  ]);

  /** Hide loading overlay only after both Player 1 and Player 2 attempts have finished. */
  useEffect(() => {
    if (releaseStatus !== 'released') return;
    if (localApiLoadDone && skyflixerReady) {
      setLoading(false);
    }
  }, [releaseStatus, localApiLoadDone, skyflixerReady]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      handlePlayerClose();
    };

    window.history.pushState({ playerOpen: true }, '', window.location.href);

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePlayerClose]);

  useEffect(() => {
    watchStartTimeRef.current = Date.now();
  }, []);

  // Continue watching progress save disabled
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (watchStartTimeRef.current && contentDuration > 0) {
  //       const currentTime = Date.now();
  //       const watchedMinutes = (currentTime - watchStartTimeRef.current) / (1000 * 60);
  //       const progressPercentage = Math.min((watchedMinutes / contentDuration) * 100, 100);
  //       if (progressPercentage > 1) {
  //         updateProgress(tmdbId, type, progressPercentage, episode, season);
  //       }
  //     }
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, [tmdbId, type, episode, season, contentDuration, updateProgress]);

  useEffect(() => {
    let isMounted = true;
    const playbackKey = `${tmdbId}|${type}|${season ?? ''}|${episode ?? ''}`;
    if (tmdbSaveKeyRef.current === playbackKey) return;
    tmdbSaveKeyRef.current = playbackKey;

    const saveContent = async () => {
      try {
        if (!TMDB_API_KEY) return;

        const endpoint =
          type === 'movie'
            ? `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
            : `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}`;

        const data = await fetchWithRetry(endpoint);

        if (!isMounted) return;

        const name = data.title || data.name;
        const poster = data.backdrop_path || data.poster_path;
        const imageUrl = poster ? `https://image.tmdb.org/t/p/w500${poster}` : '/fallback.jpg';

        const existing = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
        const newItem = {
          title: name,
          tmdbId,
          type,
          season: season || null,
          episode: episode || null,
          image: imageUrl,
          watchedAt: Date.now(),
        };

        const updated = [
          newItem,
          ...existing.filter(
            (i: { tmdbId: number; season: number | null; episode: number | null }) =>
              i.tmdbId !== tmdbId ||
              i.season !== newItem.season ||
              i.episode !== newItem.episode
          ),
        ].slice(0, 30);

        localStorage.setItem('recentlyWatched', JSON.stringify(updated));
        // addToContinueWatching(data, type, 1, episode, season);

        if (YANDEX_METRICA_ID && window.ym) {
          window.ym(YANDEX_METRICA_ID, 'reachGoal', 'Views', { title: name });
        }
      } catch (err) {
        console.error('Content save error:', err);
      }
    };

    saveContent();

    return () => {
      isMounted = false;
    };
  }, [tmdbId, type, season, episode]);

  const handleRequestContent = async () => {
    if (!CONTENT_REQUEST_API_URL) {
      toast({
        title: 'Request unavailable',
        description: 'Set VITE_CONTENT_REQUEST_API_URL in your environment.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }
    setIsRequesting(true);
    try {
      const response = await fetch(CONTENT_REQUEST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          tmdbId,
          type: type === 'tv' ? 'series' : 'movie',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRequestStatus('success');
      } else if (response.status === 429) {
        setRequestStatus('already_requested');
      } else {
        toast({
          title: 'Request Failed',
          description: data.message || 'Failed to submit request. Please try again.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (requestErr) {
      console.error('Request error:', requestErr);
      toast({
        title: 'Network Error',
        description: 'Unable to submit request. Please check your connection.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const CloseButton = () => (
    <button
      onClick={handlePlayerClose}
      className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-all duration-300 ease-in-out hover:bg-black/80 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      aria-label="Close player"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[999999] flex items-center justify-center">
        {onClose && <CloseButton />}
        <div className="text-white text-xl">Loading player...</div>
      </div>
    );
  }

  if (error && releaseStatus === 'not_released') {
    return (
      <div className="fixed inset-0 bg-black z-[999999] flex items-center justify-center p-4">
        {onClose && <CloseButton />}
        <div className="text-center p-8 max-w-lg bg-gray-900/70 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-2">Coming Soon!</h2>
          <p className="text-gray-300 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (error?.includes('No matching stream found') && activePlayer === 'vsEmbed') {
    return (
      <div className="fixed inset-0 bg-black z-[999999] flex flex-col">
        <iframe
          src={buildVidsrcEmbedUrl(tmdbId, type, season, episode)}
          title="Player 5"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
          scrolling="no"
          className="w-full h-full border-none absolute inset-0 z-10"
        />

        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/50">
          <div className="text-center p-8 max-w-lg bg-gray-900/70 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-2">Content Not Found</h2>
            {requestStatus === 'none' && (
              <>
                <p className="text-white text-base">
                  You can request this content. We&apos;ll add it within 1 hour.
                </p>
                <button
                  onClick={handleRequestContent}
                  disabled={isRequesting}
                  className="mt-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  {isRequesting ? 'Submitting...' : 'Request Now'}
                </button>
              </>
            )}
            {requestStatus === 'success' && (
              <div className="text-center">
                <div className="text-green-400 text-lg font-semibold mb-2">Request Successful</div>
                <p className="text-white text-base">
                  Your request has been submitted successfully. Content will be added within 1 hour.
                </p>
              </div>
            )}

            {requestStatus === 'already_requested' && (
              <div className="text-center">
                <div className="text-yellow-400 text-lg font-semibold mb-2">Already Requested</div>
                <p className="text-white text-base">
                  Already requested please wait for 1 hour. It will be added in 1 hour.
                </p>
              </div>
            )}
          </div>
        </div>
        {onClose && <CloseButton />}
      </div>
    );
  }

  const vidsrcEmbedUrl = buildVidsrcEmbedUrl(tmdbId, type, season, episode);
  const peachifyEmbedUrl = buildPeachifyEmbedUrl(tmdbId, type, season, episode);
  const videasyUrl =
    type === 'movie'
      ? `https://player.videasy.net/movie/${tmdbId}`
      : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`;
  const player1Url = activeLocalProvider ? localApiStreams[activeLocalProvider] ?? null : null;
  const player2Url = videoId;
  const localProviderButtons = LOCAL_PROVIDER_PRIORITY.filter((provider) => localApiStreams[provider]);
  const mobileIframeProps = isMobile
    ? { referrerPolicy: 'no-referrer' as const, loading: 'eager' as const }
    : {};

  return (
    <div className="fixed inset-0 bg-black z-[999999] flex flex-col">
      {onClose && <CloseButton />}

      <div className="absolute right-4 md:right-6 z-50 flex gap-2 md:gap-3 items-center pb-safe" style={{ bottom: 'max(3.5rem, calc(3.5rem + env(safe-area-inset-bottom)))' }}>
        {fallbackMessage && (
          <span className="text-white text-xs md:text-sm animate-pulse mr-1 hidden sm:block bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {fallbackMessage}
          </span>
        )}

        <button
          type="button"
          className={`
            flex items-center justify-center
            ${isTV ? 'min-h-11 min-w-11' : 'w-10 h-10'} md:w-auto md:h-auto md:px-4 md:py-2
            rounded-full font-semibold border-2 tv-focus-ring
            transition-all duration-300 ease-in-out text-xs md:text-sm
            ${
              activePlayer === 'localApi'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/75 scale-105'
                : 'bg-black/50 text-gray-300 backdrop-blur-sm border-transparent hover:bg-black/70 hover:border-gray-500'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none disabled:hover:border-transparent`}
          onClick={() => setActivePlayer('localApi')}
          disabled={!player1Url}
        >
          <span className="hidden md:inline">Player&nbsp;</span>1
        </button>
        <button
          type="button"
          className={`
            flex items-center justify-center
            ${isTV ? 'min-h-11 min-w-11' : 'w-10 h-10'} md:w-auto md:h-auto md:px-4 md:py-2
            rounded-full font-semibold border-2 tv-focus-ring
            transition-all duration-300 ease-in-out text-xs md:text-sm
            ${
              activePlayer === 'moonflix'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/75 scale-105'
                : 'bg-black/50 text-gray-300 backdrop-blur-sm border-transparent hover:bg-black/70 hover:border-gray-500'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none disabled:hover:border-transparent`}
          onClick={() => setActivePlayer('moonflix')}
          disabled={!player2Url}
        >
          <span className="hidden md:inline">Player&nbsp;</span>2
        </button>
        <button
          type="button"
          className={`
            flex items-center justify-center
            ${isTV ? 'min-h-11 min-w-11' : 'w-10 h-10'} md:w-auto md:h-auto md:px-4 md:py-2
            rounded-full font-semibold border-2 tv-focus-ring
            transition-all duration-300 ease-in-out text-xs md:text-sm
            ${
              activePlayer === 'peachify'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/75 scale-105'
                : 'bg-black/50 text-gray-300 backdrop-blur-sm border-transparent hover:bg-black/70 hover:border-gray-500'
            }
          `}
          onClick={() => setActivePlayer('peachify')}
        >
          <span className="hidden md:inline">Player&nbsp;</span>3
        </button>
        <button
          type="button"
          className={`
            flex items-center justify-center
            ${isTV ? 'min-h-11 min-w-11' : 'w-10 h-10'} md:w-auto md:h-auto md:px-4 md:py-2
            rounded-full font-semibold border-2 tv-focus-ring
            transition-all duration-300 ease-in-out text-xs md:text-sm
            ${
              activePlayer === 'videasy'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/75 scale-105'
                : 'bg-black/50 text-gray-300 backdrop-blur-sm border-transparent hover:bg-black/70 hover:border-gray-500'
            }`}
          onClick={() => setActivePlayer('videasy')}
        >
          <span className="hidden md:inline">Player&nbsp;</span>4
        </button>
        <button
          type="button"
          className={`
            flex items-center justify-center
            ${isTV ? 'min-h-11 min-w-11' : 'w-10 h-10'} md:w-auto md:h-auto md:px-4 md:py-2
            rounded-full font-semibold border-2 tv-focus-ring
            transition-all duration-300 ease-in-out text-xs md:text-sm
            ${
              activePlayer === 'vsEmbed'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/75 scale-105'
                : 'bg-black/50 text-gray-300 backdrop-blur-sm border-transparent hover:bg-black/70 hover:border-gray-500'
            }
          `}
          onClick={() => setActivePlayer('vsEmbed')}
        >
          <span className="hidden md:inline">Player&nbsp;</span>5
        </button>
      </div>
      {activePlayer === 'localApi' && localProviderButtons.length > 1 && (
        <div
          className="absolute right-4 md:right-6 z-50 flex gap-2 items-center pb-safe"
          style={{ bottom: 'max(7rem, calc(7rem + env(safe-area-inset-bottom)))' }}
        >
          {localProviderButtons.map((provider) => (
            <button
              key={provider}
              type="button"
              className={`
                px-3 py-1.5 rounded-full text-xs border transition-all duration-200
                ${
                  activeLocalProvider === provider
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-black/50 text-gray-300 border-gray-600 hover:bg-black/70'
                }`}
              onClick={() => setActiveLocalProvider(provider)}
            >
              {LOCAL_PROVIDER_LABELS[provider]}
            </button>
          ))}
        </div>
      )}

      <div className="w-full h-full">
        {activePlayer === 'localApi' && (
          <iframe
            key="player-1"
            src={player1Url || 'about:blank'}
            title="Player 1"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            scrolling="no"
            className="w-full h-full border-none block"
            {...mobileIframeProps}
          />
        )}
        {activePlayer === 'moonflix' && (
          <iframe
            key="player-2"
            src={player2Url || 'about:blank'}
            title="Player 2"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            scrolling="no"
            className="w-full h-full border-none block"
            {...mobileIframeProps}
          />
        )}
        {activePlayer === 'peachify' && (
          <iframe
            key="player-3"
            src={peachifyEmbedUrl}
            title="Player 3"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            scrolling="no"
            className="w-full h-full border-none block"
            {...mobileIframeProps}
          />
        )}
        {activePlayer === 'videasy' && (
          <iframe
            key="player-4"
            src={videasyUrl}
            title="Player 4"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            scrolling="no"
            className="w-full h-full border-none block"
            {...mobileIframeProps}
          />
        )}
        {activePlayer === 'vsEmbed' && (
          <iframe
            key="player-5"
            src={vidsrcEmbedUrl}
            title="Player 5"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            scrolling="no"
            className="w-full h-full border-none block"
            {...mobileIframeProps}
          />
        )}
      </div>
    </div>
  );
};

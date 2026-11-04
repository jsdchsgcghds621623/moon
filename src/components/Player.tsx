import React, { useEffect, useState, useCallback, useRef } from 'react';
// import { useContinueWatching } from '@/hooks/useContinueWatching';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

/** Player env-only credentials / endpoints (set in `.env` with `VITE_` prefix). */
const TMDB_API_KEY = (import.meta.env.VITE_TMDB_API_KEY ?? '').trim();
const YANDEX_METRICA_ID = Number(import.meta.env.VITE_YANDEX_METRIKA_ID || 0);
const CONTENT_REQUEST_API_URL = (import.meta.env.VITE_CONTENT_REQUEST_API_URL ?? '').trim();

interface PlayerProps {
  title: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  onClose?: () => void;
}

const MOONFLIX_EMBED_BASE = 'https://player.moonflix.website';

/** Build embed URL for the Moonflix player */
const buildMoonflixEmbedUrl = (
  tmdbId: number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): string => {
  if (type === 'movie') {
    return `${MOONFLIX_EMBED_BASE}/movie/${tmdbId}`;
  }
  const s = season ?? 1;
  const e = episode ?? 1;
  return `${MOONFLIX_EMBED_BASE}/tv/${tmdbId}/${s}/${e}`;
};

/** Simple fetch with retry – kept for release‑date and content‑info calls */
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

export const Player: React.FC<PlayerProps> = ({
  title,
  tmdbId,
  type,
  season,
  episode,
  onClose,
}) => {
  const [contentYear, setContentYear] = useState<number>(new Date().getFullYear());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [contentDuration, setContentDuration] = useState<number>(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'success' | 'already_requested'>('none');
  const [releaseStatus, setReleaseStatus] = useState<'checking' | 'released' | 'not_released'>('checking');

  const watchStartTimeRef = useRef<number>(0);
  const tmdbSaveKeyRef = useRef<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handlePlayerClose = useCallback(() => {
    if (onClose) {
      const finalWatchTime = (Date.now() - watchStartTimeRef.current) / (1000 * 60);
      const finalProgress = Math.min((finalWatchTime / contentDuration) * 100, 100);
      onClose();
    }
  }, [onClose, contentDuration, tmdbId, type, episode, season]);

  // --- Release date & content info ---
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
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (tmdbId) checkReleaseDate();

    return () => {
      isMounted = false;
    };
  }, [tmdbId, type, season, episode]);

  // --- Popstate handling for back button ---
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

  // --- Watch start time ---
  useEffect(() => {
    watchStartTimeRef.current = Date.now();
  }, []);

  // --- Save to recently watched (and Yandex Metrica) ---
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

  // --- Request content (kept for the "not found" overlay) ---
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
        headers: { 'Content-Type': 'application/json' },
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

  // --- Reusable Close Button ---
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

  // --- Loading screen ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[999999] flex items-center justify-center">
        {onClose && <CloseButton />}
        <div className="text-white text-xl">Loading player...</div>
      </div>
    );
  }

  // --- Not yet released ---
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

  // --- Build embed URLs ---
  const moonflixEmbedUrl = buildMoonflixEmbedUrl(tmdbId, type, season, episode);

  // --- Mobile iframe props (only for mobile) ---
  const mobileIframeProps = isMobile
    ? { referrerPolicy: 'no-referrer' as const, loading: 'eager' as const }
    : {};

  return (
    <div className="fixed inset-0 bg-black z-[999999] flex flex-col">
      {onClose && <CloseButton />}

      <div className="w-full h-full">
        <iframe
          src={moonflixEmbedUrl}
          title="Moonflix player"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
          scrolling="no"
          className="w-full h-full border-none block"
          {...mobileIframeProps}
        />
      </div>
    </div>
  );
};
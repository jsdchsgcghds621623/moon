import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Clock3, Film, Tv, Compass, MoonStar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type WrappedEntry = {
  title?: string;
  tmdbId?: number;
  type?: string;
  image?: string;
  watchedAt?: number;
};

const STORAGE_KEY = 'recentlyWatched';

const genreMap: Array<{ name: string; keywords: string[] }> = [
  { name: 'Psychological Thriller', keywords: ['psychological', 'twist', 'memento', 'split', 'gone', 'silence', 'shutter', 'night', 'mind', 'suspense', 'black mirror', 'se7en', 'noir'] },
  { name: 'Sci-Fi Adventure', keywords: ['space', 'alien', 'future', 'galaxy', 'matrix', 'interstellar', 'star', 'sci', 'dune', 'robot', 'time', 'multiverse'] },
  { name: 'Crime Drama', keywords: ['crime', 'detective', 'murder', 'heist', 'cop', 'police', 'gangster', 'mafia', 'lawyer', 'trial'] },
  { name: 'Romantic Drama', keywords: ['romantic', 'love', 'heart', 'wedding', 'relationship', 'kiss', 'dating', 'sweet'] },
  { name: 'Anime', keywords: ['anime', 'naruto', 'one piece', 'attack on titan', 'death note', 'spirited away', 'demon', 'dragon', 'hero'] },
  { name: 'Action Thriller', keywords: ['action', 'war', 'revenge', 'mission', 'spy', 'assassin', 'fight', 'kick', 'hunter', 'jason', 'john wick'] },
  { name: 'Fantasy Epic', keywords: ['fantasy', 'magic', 'wizard', 'kingdom', 'dragon', 'lord', 'vampire', 'werewolf', 'epic'] },
  { name: 'Horror', keywords: ['horror', 'haunted', 'ghost', 'monster', 'nightmare', 'dead', 'evil', 'zombie', 'cursed'] },
];

const getGenreFromTitle = (title: string) => {
  const normalized = title.toLowerCase();
  for (const entry of genreMap) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.name;
    }
  }
  return 'Cinematic Drama';
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const MoonflixWrapped = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WrappedEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WrappedEntry[];
        setEntries(parsed);
      }
    } catch (error) {
      console.error('Unable to read wrapped history', error);
    } finally {
      setReady(true);
    }
  }, []);

  const stats = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0));
    const movies = sorted.filter((item) => item.type === 'movie');
    const series = sorted.filter((item) => item.type === 'tv');
    const totalCount = sorted.length;
    const movieMinutes = movies.length * 115;
    const seriesMinutes = series.length * 45;
    const estimatedMinutes = movieMinutes + seriesMinutes;
    const estimatedHours = Math.round(estimatedMinutes / 60);

    const genreCounts = sorted.reduce<Record<string, number>>((acc, item) => {
      const genre = getGenreFromTitle(item.title || '');
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cinematic Drama';

    const dayCounts = sorted.reduce<Record<string, number>>((acc, item) => {
      const day = item.watchedAt ? new Date(item.watchedAt).toLocaleDateString('en', { weekday: 'long' }) : 'Unknown';
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Your calendar';

    const lateNightCount = sorted.filter((item) => {
      if (!item.watchedAt) return false;
      const hours = new Date(item.watchedAt).getHours();
      return hours >= 22 || hours <= 2;
    }).length;

    const lateNightRatio = totalCount > 0 ? Math.round((lateNightCount / totalCount) * 100) : 0;

    const longestBingeMinutes = Math.max(180, Math.round(series.length * 38 + movies.length * 10));

    const topTitle = sorted[0]?.title || 'Your first pick';

    return {
      totalCount,
      movies: movies.length,
      series: series.length,
      estimatedHours,
      topGenre,
      mostActiveDay,
      lateNightRatio,
      longestBingeMinutes,
      topTitle,
    };
  }, [entries]);

  const storySteps = [
    { label: 'You explored', value: `${stats.totalCount} picks` },
    { label: 'Watched', value: `${stats.movies} movies` },
    { label: 'Finished', value: `${stats.series} TV sessions` },
    { label: 'Streamed', value: `${stats.estimatedHours} hours` },
    { label: 'Signature vibe', value: stats.topGenre },
  ];

  return (
    <div className="min-h-screen bg-[#040404] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(84,185,197,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(229,9,20,0.18),_transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,rgba(255,255,255,0.02))]" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 pt-6 sm:px-6 lg:px-8 lg:py-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#54b9c5]" />
              Moonflix Wrapped 2026
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Back
              </button>
              <Link to="/browse" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10">
                Browse
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[32px] border border-white/10 bg-black/60 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8 lg:p-10"
          >
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54b9c5]/20 bg-[#54b9c5]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.35em] text-[#54b9c5]">
                  <MoonStar className="h-3.5 w-3.5" />
                  Your cinematic year
                </p>
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Welcome to your Moonflix Wrapped.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                  A premium look at the stories you chose, the nights you lingered, and the moods that kept you watching.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Story summary</p>
                <div className="mt-4 space-y-3">
                  {storySteps.map((step, index) => (
                    <div key={step.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                      <span className="text-sm text-white/60">{step.label}</span>
                      <span className="text-sm font-semibold text-white">{step.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Movies watched', value: stats.movies, icon: Film },
              { label: 'TV sessions', value: stats.series, icon: Tv },
              { label: 'Streamed', value: `${stats.estimatedHours}h`, icon: Clock3 },
              { label: 'Signature vibe', value: stats.topGenre, icon: Compass },
            ].map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 * index }}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60">{card.label}</p>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-2">
                      <Icon className="h-4 w-4 text-[#54b9c5]" />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-white">{card.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
              className="rounded-[28px] border border-white/10 bg-[#0b0b0b]/90 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Your profile</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">What your watch history says about you</h2>
                </div>
                <div className="rounded-full border border-[#54b9c5]/20 bg-[#54b9c5]/10 px-3 py-1 text-sm text-[#54b9c5]">
                  {stats.topGenre}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/55">Most active day</p>
                  <p className="mt-2 text-xl font-semibold text-white">{stats.mostActiveDay}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/55">Late-night viewer</p>
                  <p className="mt-2 text-xl font-semibold text-white">{stats.lateNightRatio}% after 10 PM</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/55">Longest binge</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatDuration(stats.longestBingeMinutes)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/55">Latest obsession</p>
                  <p className="mt-2 text-xl font-semibold text-white">{stats.topTitle}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.16 }}
              className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0e0e0e] to-[#080808] p-6"
            >
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Your story</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">From midnight picks to full-night marathons</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/55">The mood you keep returning to</p>
                  <p className="mt-2 text-lg font-semibold text-white">{stats.topGenre}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/55">Your watch pattern</p>
                  <p className="mt-2 text-lg font-semibold text-white">Balanced between cinematic movies and binge-ready series.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/55">The energy of your year</p>
                  <p className="mt-2 text-lg font-semibold text-white">Thoughtful, immersive, and hard to stop once it starts.</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mt-8 rounded-[28px] border border-white/10 bg-black/50 p-6 text-center"
          >
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Thanks for exploring cinema with Moonflix</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Your next obsession is waiting.</h3>
            <Link to="/browse" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#54b9c5] to-[#3b9ba7] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110">
              Continue watching <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MoonflixWrapped;

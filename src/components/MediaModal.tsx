import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Play, Plus, ThumbsUp, Volume2, VolumeX, Info, Star, Calendar, Globe, Users, Clock, Award, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { 
  Movie, 
  TVShow, 
  Episode,
  MovieDetails,
  TVShowDetails,
  TMDB_IMAGE_URL 
} from '@/lib/tmdb';
import { useMyList } from '@/hooks/useMyList';
// import { useContinueWatching } from '@/hooks/useContinueWatching';
import { useLikes } from '@/hooks/useLikes';
import { useMovieDetails, useTVShowDetails, useTVShowSeasonDetails } from '@/hooks/useTMDBQuery';
import { useSimilarContent } from '@/hooks/useSimilarContent';
import { useIsMobile } from '@/hooks/use-mobile';

// Import components directly for faster loading
import { EpisodeList } from './EpisodeList';
import { SeasonSelector } from './SeasonSelector';
import { MediaCard } from './MediaCard';
import { Player } from './Player';
import { TrailerModal } from './TrailerModal';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Movie | TVShow | null;
  mediaType: 'movie' | 'tv';
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onPlayInitiated?: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo?: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  source?: 'continue-watching' | 'default';
}

const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'hi': 'Hindi',
  'ar': 'Arabic'
};

// ── Desktop-only helpers ──────────────────────────────────────────────────────

// Netflix-style top-10 badge (desktop only)
const Top10Badge = ({ rank }: { rank?: number }) => {
  if (!rank) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="bg-[#E50914] text-white text-[9px] font-black leading-none px-1.5 py-1 rounded-sm flex flex-col items-center">
        <span>TOP</span>
        <span>10</span>
      </div>
      <span className="text-white text-sm font-semibold">#{rank} in Shows Today</span>
    </div>
  );
};

// Netflix episode row (desktop only)
const NetflixEpisodeRow = ({ episode, index, onPlay }: {
  episode: Episode;
  index: number;
  onPlay: (ep: Episode) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="group flex gap-4 p-4 rounded hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
      {/* Episode number */}
      <div className="flex items-center justify-center w-8 shrink-0">
        <span className="text-[#808080] text-2xl font-light">{episode.episode_number ?? index + 1}</span>
      </div>

      {/* Thumbnail */}
      <div
        className="relative w-[120px] h-[68px] shrink-0 rounded overflow-hidden bg-[#333] cursor-pointer"
        onClick={() => onPlay(episode)}
      >
        {episode.still_path ? (
          <img
            src={`${TMDB_IMAGE_URL.w500}${episode.still_path}`}
            alt={episode.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
            <Play className="h-6 w-6 text-white/40" />
          </div>
        )}
        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-5 w-5 text-black fill-black ml-0.5" />
          </div>
        </div>
        {/* Runtime badge */}
        {episode.runtime && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
            {episode.runtime}m
          </div>
        )}
      </div>

      {/* Episode info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-white font-medium text-sm leading-tight line-clamp-1">
            {episode.name}
          </h4>
          {episode.runtime && (
            <span className="text-[#808080] text-sm shrink-0">{episode.runtime}m</span>
          )}
        </div>
        <p className={`text-[#808080] text-xs leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {episode.overview || 'No description available.'}
        </p>
        {episode.overview && episode.overview.length > 120 && (
          <button
            className="text-white/60 text-xs mt-1 hover:text-white transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Less' : 'More'}
          </button>
        )}
      </div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const MediaModal = ({ isOpen, onClose, item, mediaType, onPlay, onPlayInitiated, onMoreInfo, source = 'default' }: MediaModalProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [hasUserSelectedSeason, setHasUserSelectedSeason] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playbackInfo, setPlaybackInfo] = useState<any>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  // Desktop tab state (Netflix-style)
  const [activeTab, setActiveTab] = useState<'episodes' | 'more-like-this' | 'details'>('episodes');
  const modalRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useIsMobile();
  const { isInMyList, toggleMyList } = useMyList();
  // const { getResumeData } = useContinueWatching();
  const { likes, isLiked, toggleLike } = useLikes(item?.id || 0);
  
  // Use React Query hooks for data fetching with optimized stale time
  const { data: movieDetails, isLoading: isMovieLoading } = useMovieDetails(
    item?.id || 0, 
    isOpen && mediaType === 'movie' && !!item
  );
  
  const { data: tvDetails, isLoading: isTVLoading } = useTVShowDetails(
    item?.id || 0, 
    isOpen && mediaType === 'tv' && !!item
  );
  
  const { data: seasonDetails, isLoading: isSeasonLoading } = useTVShowSeasonDetails(
    item?.id || 0,
    selectedSeason,
    isOpen && mediaType === 'tv' && !!item
  );
  
  const details = mediaType === 'movie' ? movieDetails : tvDetails;
  
  // Type guard for better type safety
  const isMovieDetails = (details: any): details is MovieDetails => {
    return details && 'runtime' in details;
  };
  
  const isTVDetails = (details: any): details is TVShowDetails => {
    return details && 'number_of_seasons' in details;
  };

  // Don't render anything if no item - this prevents hook issues
  if (!item) {
    return null;
  }

  // Continue watching disabled — no resume/progress in browse modal
  const resumeData = {
    progress: 0,
    seasonNumber: 1,
    episodeNumber: 1,
    hasWatchHistory: false,
  };

  // Reset state when modal opens with new content, but only if user hasn't manually selected a season
  useEffect(() => {
    if (isOpen && item && !hasUserSelectedSeason) {
      if (mediaType === 'tv' && isTVDetails(details) && details.seasons) {
        const targetSeason = resumeData.hasWatchHistory ? resumeData.seasonNumber : (details.seasons.find(s => s.season_number > 0)?.season_number || 1);
        setSelectedSeason(targetSeason);
      }
    }
  }, [isOpen, item, mediaType, details, resumeData, hasUserSelectedSeason, isTVDetails]);

  // Reset selected season, user selection flag, and desktop tab when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSeason(1);
      setHasUserSelectedSeason(false);
      setActiveTab(mediaType === 'tv' ? 'episodes' : 'more-like-this');
    }
  }, [isOpen, mediaType]);

  // Sync desktop default tab when mediaType changes
  useEffect(() => {
    setActiveTab(mediaType === 'tv' ? 'episodes' : 'more-like-this');
  }, [mediaType]);

  // Calculate if content is older than 31 days
  const isOlderThan31Days = useMemo(() => {
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const now = new Date();
    return differenceInDays(now, release) > 31;
  }, [item]);

  // Calculate if content is recently added
  const isRecentlyAdded = useMemo(() => {
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - release.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }, [item]);

  // Calculate match percentage for similar content
  const calculateMatchPercentage = useCallback((similarItem: Movie | TVShow) => {
    const currentGenres = details && 'genres' in details && details.genres ? details.genres.map(g => g.id) : item.genre_ids || [];
    const itemGenres = similarItem.genre_ids || [];
    const currentYear = new Date('release_date' in item ? item.release_date || '' : item.first_air_date || '').getFullYear();
    const itemYear = new Date('release_date' in similarItem ? similarItem.release_date || '' : similarItem.first_air_date || '').getFullYear();
    const currentRating = item.vote_average || 0;
    const itemRating = similarItem.vote_average || 0;

    const sharedGenres = itemGenres.filter(id => currentGenres.includes(id)).length;
    const genreMatch = Math.min(sharedGenres / Math.max(currentGenres.length, 1), 1) * 50;
    const ratingDiff = Math.abs(currentRating - itemRating);
    const ratingMatch = Math.max(0, (10 - ratingDiff) / 10) * 30;
    const yearDiff = Math.abs(currentYear - itemYear);
    const yearMatch = Math.max(0, (8 - yearDiff) / 8) * 20;

    return Math.round(genreMatch + ratingMatch + yearMatch);
  }, [item, details]);

  const handlePlayMovie = useCallback(() => {
    onPlayInitiated?.(item, 'movie');
    setPlaybackInfo({
      type: 'movie',
      id: item.id,
      title: 'title' in item ? item.title : item.name
    });
    setShowPlayer(true);
  }, [item]);

  const handlePlayTVSeries = useCallback(() => {
    onPlayInitiated?.(item, 'tv');
    const seriesTitle = 'title' in item ? item.title : item.name;
    const season = selectedSeason;
    const episode = resumeData.hasWatchHistory && resumeData.seasonNumber === selectedSeason ? resumeData.episodeNumber : 1;
    const seasonNum = season.toString().padStart(2, '0');
    const episodeNum = episode.toString().padStart(2, '0');
    
    setPlaybackInfo({
      type: 'tv',
      id: item.id,
      season: season,
      episode: episode,
      title: `${seriesTitle} S${seasonNum}E${episodeNum}`
    });
    setShowPlayer(true);
  }, [item, resumeData, selectedSeason]);

  const handleSeasonChange = useCallback((seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    setHasUserSelectedSeason(true);
  }, []);

  const handlePlayEpisode = useCallback((episode: Episode) => {
    onPlayInitiated?.(item, 'tv');
    const seriesTitle = 'title' in item ? item.title : item.name;
    const seasonNum = selectedSeason.toString().padStart(2, '0');
    const episodeNum = episode.episode_number.toString().padStart(2, '0');
    setPlaybackInfo({
      type: 'tv',
      id: item.id,
      season: selectedSeason,
      episode: episode.episode_number,
      title: `${seriesTitle} S${seasonNum}E${episodeNum}`
    });
    setShowPlayer(true);
  }, [item, selectedSeason]);

  const handleDirectPlay = useCallback(() => {
    if (mediaType === 'movie') {
      handlePlayMovie();
    } else {
      handlePlayTVSeries();
    }
  }, [mediaType, handlePlayMovie, handlePlayTVSeries]);

  const getContentYear = useCallback(() => {
    const raw = 'release_date' in item ? item.release_date : item.first_air_date;
    const y = raw ? new Date(raw).getFullYear() : NaN;
    return Number.isFinite(y) && y > 1900 ? y : new Date().getFullYear();
  }, [item]);

  const handleEpisodeInfo = (episode: Episode) => {
    console.log('Episode info:', episode);
  };

  const handleSimilarItemMoreInfo = (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    if (window.innerWidth < 768) {
      onClose();
      setTimeout(() => {
        if (onMoreInfo) {
          onMoreInfo(item, mediaType);
        }
      }, 300);
    } else {
      if (onMoreInfo) {
        onMoreInfo(item, mediaType);
      }
    }
  };

  const handleLikeClick = async () => {
    await toggleLike();
  };

  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  const backdropUrl = (() => {
    if (item.backdrop_path && item.backdrop_path.startsWith('http')) {
      return item.backdrop_path;
    }
    return item.backdrop_path 
      ? `${TMDB_IMAGE_URL.w1280}${item.backdrop_path}`
      : '';
  })();

  const trailer = details && 'videos' in details && details.videos?.results.find(
    video => video.type === 'Trailer' && video.site === 'YouTube'
  );

  // Get similar content with enhanced data
  const { data: similarContent = [], isLoading: isSimilarLoading } = useSimilarContent(item, mediaType);
  const enhancedSimilarContent = useMemo(() => 
    similarContent.map(similarItem => ({
      ...similarItem,
      matchPercentage: calculateMatchPercentage(similarItem)
    })).sort((a, b) => b.matchPercentage - a.matchPercentage),
    [similarContent, calculateMatchPercentage]
  );

  const formatLanguage = (langCode: string) => {
    return LANGUAGE_MAP[langCode] || langCode.toUpperCase();
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // ── Desktop-only derived values (from file 2) ─────────────────────────────
  const maturityRating = (mediaType === 'movie' && (item as Movie).adult) ? '18+' : 'A';
  const contentWarnings = 'sex, language, nudity, tobacco use';

  const genresText = details && 'genres' in details && details.genres
    ? details.genres.map(g => g.name).join(', ')
    : '';

  const descriptorMap: Record<string, string> = {
    'Drama': 'Emotional', 'Action': 'Exciting', 'Comedy': 'Funny', 'Thriller': 'Suspenseful',
    'Horror': 'Scary', 'Romance': 'Romantic', 'Adventure': 'Thrilling', 'Crime': 'Gritty',
    'Family': 'Heartwarming', 'Animation': 'Entertaining', 'Documentary': 'Informative',
    'Fantasy': 'Magical', 'Mystery': 'Mysterious', 'War': 'Intense', 'Western': 'Classic'
  };
  const thisShowIs = details && 'genres' in details && details.genres
    ? details.genres.slice(0, 2).map(g => descriptorMap[g.name] || g.name).join(', ')
    : '';

  const castList = (details as any)?.credits?.cast?.slice(0, 6).map((a: any) => a.name).join(', ') || '';
  const creatorsText = (details as any)?.created_by?.map((c: any) => c.name).join(', ') || '';
  // ─────────────────────────────────────────────────────────────────────────

  // Show Player if requested
  if (showPlayer && item) {
    return (
      <Player
        title={'title' in item ? item.title : item.name}
        tmdbId={item.id}
        type={mediaType}
        season={playbackInfo?.season}
        episode={playbackInfo?.episode}
        onClose={() => {
          setShowPlayer(false);
          setPlaybackInfo(null);
        }}
      />
    );
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/*
        ── Dialog sizing:
           Mobile  → full screen (same as before)
           Desktop → Netflix-style max-w-[900px], bg-[#141414], rounded-md
      */}
      <DialogContent
        className="w-[min(100vw-1rem,920px)] max-w-[920px] h-[100dvh] sm:h-[min(90dvh,920px)] max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden p-0 bg-[#141414] border-none [&>button]:hidden backdrop-blur-none rounded-none sm:rounded-xl shadow-2xl"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[role="menu"]') || target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[role="menu"]') || target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mediaType === 'movie' ? 'Movie' : 'TV Show'} details and streaming options
          </DialogDescription>
        </DialogHeader>
        <motion.div 
          className="relative h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y scroll-container font-netflix"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          ref={modalRef}
        >
          {/* ════════════════════════════════════════════════════════════════
              HERO SECTION
              Mobile  → original layered gradient design (50vh tall)
              Desktop → Netflix-style 16/9 aspect ratio, max 50vh
          ════════════════════════════════════════════════════════════════ */}

          {/* ── MOBILE HERO (hidden on sm+) ── */}
          <div className="relative h-[56dvh] min-h-[320px] overflow-hidden mt-0 sm:hidden">
            {backdropUrl ? (
              <motion.div className="relative w-full h-full">
                <motion.img
                  src={backdropUrl}
                  alt={title}
                  className="w-full h-full object-cover scale-105"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                
                {/* Netflix Logo Overlay for mobile content older than 31 days */}
                {isMobile && isOlderThan31Days && (
                  <motion.div 
                    className="absolute top-4 left-4 z-20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <img 
                      src="/lovable-uploads/8cd6d8fc-7af0-4a3e-b16c-cc4046308648.png" 
                      alt="Netflix"
                      className="w-8 h-12 object-contain"
                    />
                  </motion.div>
                )}
                
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
              </motion.div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                <span className="text-muted-foreground text-lg">No image available</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            
            {isRecentlyAdded && (
              <motion.div 
                className="absolute top-4 left-4 z-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Badge className="recently-added-badge text-white font-bold px-3 py-1.5 text-xs">
                  Recently Added
                </Badge>
              </motion.div>
            )}

            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-6 right-6 z-50 h-14 w-14 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border-2 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-110 shadow-2xl"
            >
              <X className="h-7 w-7" />
            </Button>
          </div>

          {/* ── DESKTOP HERO (hidden on mobile) ── */}
          <div className="relative hidden sm:block w-full" style={{ aspectRatio: '16/9', maxHeight: 'min(50dvh, 480px)' }}>
            {backdropUrl ? (
              <>
                <img src={backdropUrl} alt={title} className="w-full h-full object-cover" />
                {/* Netflix-style gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#14141450] to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#14141430] via-transparent to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-[#1f1f1f]" />
            )}

            {/* Desktop close button — minimal Netflix style */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-[#141414] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Recently added badge */}
            {isRecentlyAdded && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-[#E50914] text-white text-xs font-semibold px-2 py-1 rounded-sm">Recently added</span>
              </div>
            )}

            {/* Title + action buttons at bottom of hero */}
            <div className="absolute bottom-8 left-6 right-6">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white font-black text-4xl md:text-5xl leading-none tracking-tight drop-shadow-lg mb-4"
                style={{ fontFamily: "'Netflix Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                {title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2"
              >
                {/* Play */}
                <button
                  onClick={handleDirectPlay}
                  className="flex items-center gap-2 bg-white text-black font-bold text-base px-6 py-2 rounded hover:bg-white/85 transition-colors"
                >
                  <Play className="h-5 w-5 fill-black" />
                  {source === 'continue-watching' ? 'Resume' : (resumeData.progress > 5 ? 'Resume' : 'Play')}
                </button>

                {/* My List */}
                <button
                  onClick={() => toggleMyList(item, mediaType)}
                  className="w-10 h-10 rounded-full border-2 border-white/70 flex items-center justify-center text-white hover:border-white hover:bg-white/10 transition-colors"
                  title={isInMyList(item.id) ? 'Remove from My List' : 'Add to My List'}
                >
                  <Plus className={`h-5 w-5 transition-transform ${isInMyList(item.id) ? 'rotate-45' : ''}`} />
                </button>

                {/* Like */}
                <button
                  onClick={handleLikeClick}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isLiked
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/70 text-white hover:border-white hover:bg-white/10'
                  }`}
                  title="Rate"
                >
                  <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-white' : ''}`} />
                </button>

                {/* Mute toggle — right aligned */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="ml-auto w-10 h-10 rounded-full border-2 border-white/70 flex items-center justify-center text-white hover:border-white hover:bg-white/10 transition-colors"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </motion.div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              MOBILE CONTENT (sm:hidden) — unchanged from original file 1
          ════════════════════════════════════════════════════════════════ */}
          <div className="sm:hidden px-4 py-4 space-y-4">
            {/* Netflix Series Badge */}
            <div className="flex items-center gap-2">
              <div className="text-netflix-red text-xl font-black tracking-tight">N</div>
              <span className="text-white/90 font-medium text-xs tracking-widest uppercase">
                {mediaType === 'movie' ? 'FILM' : 'SERIES'}
              </span>
            </div>
            
            <h1 className="text-2xl font-black text-foreground leading-tight tracking-tight">
              {title}
            </h1>
            
            {/* Match percentage and metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-green-500 font-semibold">{Math.round((item.vote_average / 10) * 100)}% match</span>
              <span className="text-muted-foreground">{new Date(releaseDate || '').getFullYear()}</span>
              <span className="text-muted-foreground border border-muted-foreground/30 px-1 text-xs">U/A 16+</span>
              {isTVDetails(details) && (
                <span className="text-muted-foreground">{details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}</span>
              )}
              {isMovieDetails(details) && details.runtime && (
                <span className="text-muted-foreground">{formatRuntime(details.runtime)}</span>
              )}
              <span className="text-muted-foreground border border-muted-foreground/30 px-1 text-xs">HD</span>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleDirectPlay}
                className="w-full flex items-center justify-center gap-2 text-lg px-6 py-4 rounded-md bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
              >
                <Play className="h-5 w-5 fill-current" />
                {source === 'continue-watching' ? 'Play' : (resumeData.progress > 5 ? 'Play' : 'Play')}
              </Button>
              
              {/* Trailer button */}
              {trailer && (
                <Button
                  onClick={() => setShowTrailer(true)}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md border-gray-500 text-white bg-transparent hover:bg-gray-800/50 transition-colors"
                >
                  <Info className="h-4 w-4" />
                  Trailer
                </Button>
              )}
            </div>
            
            {/* Resume progress indicator for mobile */}
            {resumeData.progress > 5 && resumeData.progress < 95 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Continue watching</span>
                  <span className="text-sm text-green-500 font-semibold">
                    {Math.round(resumeData.progress)}% complete
                    {mediaType === 'tv' && resumeData.hasWatchHistory && (
                      <span className="ml-2 text-muted-foreground">S{resumeData.seasonNumber}:E{resumeData.episodeNumber}</span>
                    )}
                  </span>
                </div>
                <div className="w-full h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[hsl(var(--netflix-red))] to-[hsl(var(--netflix-red-light))] rounded-full transition-all duration-700"
                    style={{ width: `${resumeData.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Overview */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                {item.overview || 'No overview available.'}
              </p>
              {(details as any)?.credits?.cast && (details as any).credits.cast.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <strong>Cast:</strong> {(details as any).credits.cast.slice(0, 6).map((actor: any) => actor.name).join(', ')}
                </p>
              )}
            </div>
            
            {/* Action icons */}
            <div className="flex justify-between pt-2">
              <button 
                className="flex flex-col items-center gap-2"
                onClick={() => toggleMyList(item, mediaType)}
              >
                <Plus className={`h-6 w-6 ${isInMyList(item.id) ? 'rotate-45' : ''} transition-transform duration-300`} />
                <span className="text-xs text-muted-foreground">My List</span>
              </button>
              
              <button 
                className="flex flex-col items-center gap-2"
                onClick={handleLikeClick}
              >
                <div className="flex items-center gap-1">
                  <ThumbsUp className={`h-6 w-6 ${isLiked ? 'fill-current text-red-400' : ''}`} />
                  {likes > 0 && <span className="text-xs font-medium">{likes}</span>}
                </div>
                <span className="text-xs text-muted-foreground">Like</span>
              </button>
              
              <button className="flex flex-col items-center gap-2">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="text-xs text-muted-foreground">Share</span>
              </button>
              
              <button className="flex flex-col items-center gap-2">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-muted-foreground">Reports</span>
              </button>
            </div>
            
            {/* Tabs for mobile */}
            <Tabs defaultValue={mediaType === 'movie' ? 'similar' : 'episodes'} className="w-full">
              <TabsList className={`grid w-full ${mediaType === 'movie' ? 'grid-cols-2' : 'grid-cols-3'} bg-transparent`}>
                {mediaType === 'tv' && (
                  <TabsTrigger value="episodes" className="text-sm font-medium data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-netflix-red data-[state=active]:bg-transparent">
                    Episodes
                  </TabsTrigger>
                )}
                <TabsTrigger value="similar" className="text-sm font-medium data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-netflix-red data-[state=active]:bg-transparent">
                  More Like This
                </TabsTrigger>
                <TabsTrigger value="details" className="text-sm font-medium data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-netflix-red data-[state=active]:bg-transparent">
                  More Details
                </TabsTrigger>
              </TabsList>
              
              {mediaType === 'tv' && (
                <TabsContent value="episodes" className="mt-4 space-y-4">
                  {isTVDetails(details) && details.seasons ? (
                    <>
                      <SeasonSelector
                        seasons={details.seasons}
                        selectedSeason={selectedSeason}
                        onSeasonChange={handleSeasonChange}
                      />
                      {isSeasonLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        </div>
                      ) : seasonDetails?.episodes ? (
                        <EpisodeList
                          episodes={seasonDetails.episodes}
                          onPlayEpisode={handlePlayEpisode}
                          onEpisodeInfo={handleEpisodeInfo}
                        />
                      ) : (
                        <p className="text-muted-foreground text-sm">No episodes available for this season.</p>
                      )}
                    </>
                  ) : isTVLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No episodes available.</p>
                  )}
                </TabsContent>
              )}
              
              <TabsContent value="similar" className="mt-4">
                 {isSimilarLoading ? (
                   <div className="flex items-center justify-center py-4">
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                   </div>
                 ) : enhancedSimilarContent.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {enhancedSimilarContent.slice(0, 6).map((similarItem) => (
                        <MediaCard
                          key={similarItem.id}
                          item={similarItem}
                          onPlay={onPlay}
                          onMoreInfo={handleSimilarItemMoreInfo}
                        />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No similar content found.</p>
                )}
              </TabsContent>
              
              <TabsContent value="details" className="mt-4 space-y-4 text-sm">
                <div className="space-y-4">
                  <h4 className="font-semibold mb-3 text-white">About {title}</h4>
                  
                  {/* Creators - Only for TV Shows */}
                  {mediaType === 'tv' && (details as any)?.created_by && (details as any).created_by.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Creators: </span>
                      <span className="text-white">{(details as any).created_by.map((creator: any) => creator.name).join(', ')}</span>
                    </div>
                  )}
                  
                  {/* Cast */}
                  {(details as any)?.credits?.cast && (details as any).credits.cast.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Cast: </span>
                      <span className="text-white">{(details as any).credits.cast.slice(0, 12).map((actor: any) => actor.name).join(', ')}</span>
                    </div>
                  )}
                  
                  {/* Genres */}
                  {details && 'genres' in details && details.genres && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Genres: </span>
                      <span className="text-white">{details.genres.map(g => g.name).join(', ')}</span>
                    </div>
                  )}
                  
                  {/* This Show/Movie Is */}
                  {details && 'genres' in details && details.genres && details.genres.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">This {mediaType === 'movie' ? 'Movie' : 'Show'} Is: </span>
                      <span className="text-white">
                        {details.genres.slice(0, 2).map(genre => {
                          const descriptors: Record<string, string> = {
                            'Drama': 'Emotional', 'Action': 'Exciting', 'Comedy': 'Funny',
                            'Thriller': 'Suspenseful', 'Horror': 'Scary', 'Romance': 'Romantic',
                            'Adventure': 'Thrilling', 'Crime': 'Gritty', 'Family': 'Heartwarming',
                            'Animation': 'Entertaining', 'Documentary': 'Informative',
                            'Fantasy': 'Magical', 'Mystery': 'Mysterious', 'War': 'Intense', 'Western': 'Classic'
                          };
                          return descriptors[genre.name] || genre.name;
                        }).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Maturity Rating */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Maturity Rating: </span>
                    <div className="flex items-center gap-2">
                      <span className="text-white bg-muted-foreground/20 px-2 py-1 rounded text-xs border border-muted-foreground/30">
                        {(mediaType === 'movie' && (item as Movie).adult) ? '18+' : '16+'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {(mediaType === 'movie' && (item as Movie).adult)
                          ? 'Strong violence, sexual content, substance abuse'
                          : 'Moderate violence, mild language, brief nudity'
                        }
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Suitable for persons aged {(mediaType === 'movie' && (item as Movie).adult) ? '18' : '16'} and above{(mediaType === 'tv' || !(item as Movie).adult) ? ' and under parental guidance for people under age of 16' : ''}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              DESKTOP CONTENT (hidden on mobile) — Netflix-style from file 2
          ════════════════════════════════════════════════════════════════ */}
          <div className="hidden sm:block px-4 sm:px-6 md:px-8 lg:px-10 pb-6 sm:pb-8">
            {/* Info section — Netflix 2-column */}
            <div className="grid grid-cols-3 gap-8 pt-4">
              {/* Left col (2/3) */}
              <div className="col-span-2 space-y-4">
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-green-500 font-semibold text-base">
                    {Math.round((item.vote_average / 10) * 100)}% Match
                  </span>
                  {releaseDate && <span className="text-white/70">{new Date(releaseDate).getFullYear()}</span>}
                  {isTVDetails(details) && (
                    <span className="text-white/70">
                      {details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}
                    </span>
                  )}
                  {isMovieDetails(details) && details.runtime && (
                    <span className="text-white/70">{formatRuntime(details.runtime)}</span>
                  )}
                  <span className="border border-white/40 text-white/70 text-xs px-1.5 py-0.5 rounded-sm">{maturityRating}</span>
                  <span className="text-white/50 text-xs">{contentWarnings}</span>
                  <span className="border border-white/40 text-white/70 text-xs px-1.5 py-0.5 rounded-sm">HD</span>
                </div>

                {/* Top 10 indicator — shown if vote_average ≥ 8 as a heuristic */}
                {item.vote_average >= 8 && <Top10Badge rank={2} />}

                {/* Overview */}
                <p className="text-white/80 text-sm leading-relaxed">
                  {item.overview || 'No overview available.'}
                </p>
              </div>

              {/* Right col (1/3) — metadata */}
              <div className="space-y-2 text-sm">
                {castList && (
                  <p className="text-white/80 leading-relaxed">
                    <span className="text-white/40">Cast: </span>
                    {castList}
                    {(details as any)?.credits?.cast?.length > 6 && <span className="text-white/40">, more</span>}
                  </p>
                )}
                {genresText && (
                  <p className="text-white/80 leading-relaxed">
                    <span className="text-white/40">Genres: </span>
                    {genresText}
                  </p>
                )}
                {thisShowIs && (
                  <p className="text-white/80 leading-relaxed">
                    <span className="text-white/40">This {mediaType === 'movie' ? 'Movie' : 'Show'} Is: </span>
                    <strong className="text-white font-semibold">{thisShowIs}</strong>
                  </p>
                )}
                {creatorsText && mediaType === 'tv' && (
                  <p className="text-white/80 leading-relaxed">
                    <span className="text-white/40">Creators: </span>
                    {creatorsText}
                  </p>
                )}
              </div>
            </div>

            {/* ── NETFLIX TABS ── */}
            <div className="mt-8">
              {/* Tab nav */}
              <div className="flex items-center border-b border-white/10 mb-6">
                {mediaType === 'tv' && (
                  <button
                    onClick={() => setActiveTab('episodes')}
                    className={`relative pb-3 mr-8 text-sm font-semibold transition-colors ${
                      activeTab === 'episodes' ? 'text-white' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    Episodes
                    {activeTab === 'episodes' && (
                      <motion.div layoutId="desktop-tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('more-like-this')}
                  className={`relative pb-3 mr-8 text-sm font-semibold transition-colors ${
                    activeTab === 'more-like-this' ? 'text-white' : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  More Like This
                  {activeTab === 'more-like-this' && (
                    <motion.div layoutId="desktop-tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`relative pb-3 text-sm font-semibold transition-colors ${
                    activeTab === 'details' ? 'text-white' : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  Details
                  {activeTab === 'details' && (
                    <motion.div layoutId="desktop-tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t" />
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {/* ── EPISODES TAB ── */}
                {activeTab === 'episodes' && mediaType === 'tv' && (
                  <motion.div key="episodes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-xl font-bold">Episodes</h3>
                      {isTVDetails(details) && details.seasons && (
                        <SeasonSelector
                          seasons={details.seasons}
                          selectedSeason={selectedSeason}
                          onSeasonChange={handleSeasonChange}
                        />
                      )}
                    </div>

                    {isSeasonLoading ? (
                      <div className="space-y-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex gap-4 p-4 animate-pulse">
                            <div className="w-8 h-6 bg-white/10 rounded" />
                            <div className="w-[120px] h-[68px] bg-white/10 rounded" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-white/10 rounded w-2/3" />
                              <div className="h-3 bg-white/10 rounded w-full" />
                              <div className="h-3 bg-white/10 rounded w-4/5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : seasonDetails?.episodes ? (
                      <div className="divide-y divide-white/5">
                        {seasonDetails.episodes.map((ep, i) => (
                          <NetflixEpisodeRow
                            key={ep.id}
                            episode={ep}
                            index={i}
                            onPlay={handlePlayEpisode}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/40 text-sm">No episodes available for this season.</p>
                    )}
                  </motion.div>
                )}

                {/* ── MORE LIKE THIS TAB ── */}
                {activeTab === 'more-like-this' && (
                  <motion.div key="similar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {isSimilarLoading ? (
                      <div className="grid grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="bg-[#2a2a2a] rounded animate-pulse" style={{ aspectRatio: '16/10' }} />
                        ))}
                      </div>
                    ) : enhancedSimilarContent.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {enhancedSimilarContent.slice(0, 9).map((s) => {
                          const sTitle = 'title' in s ? s.title : s.name;
                          const sType = 'title' in s ? 'movie' : 'tv';
                          const sRelease = 'release_date' in s ? s.release_date : (s as TVShow).first_air_date;
                          const sYear = sRelease ? new Date(sRelease).getFullYear() : '';
                          const sPoster = s.poster_path ? `${TMDB_IMAGE_URL.w500}${s.poster_path}` : '/placeholder.svg';

                          return (
                            <div
                              key={s.id}
                              className="group bg-[#2a2a2a] rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/40 transition-all"
                              onClick={() => handleSimilarItemMoreInfo(s, sType)}
                            >
                              {/* Thumbnail */}
                              <div className="relative" style={{ aspectRatio: '16/9' }}>
                                <img
                                  src={s.backdrop_path ? `${TMDB_IMAGE_URL.w500}${s.backdrop_path}` : sPoster}
                                  alt={sTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute bottom-2 right-2">
                                  <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {s.matchPercentage}% Match
                                  </span>
                                </div>
                              </div>
                              {/* Card info */}
                              <div className="p-3 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 text-xs text-white/50">
                                    <span className="text-green-500 font-semibold">{s.matchPercentage}%</span>
                                    {sYear && <span>{sYear}</span>}
                                    <span className="border border-white/30 px-1 rounded-sm text-[10px]">HD</span>
                                  </div>
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleSimilarItemMoreInfo(s, sType); }}
                                  >
                                    <Info className="h-4 w-4 text-white/60 hover:text-white" />
                                  </button>
                                </div>
                                <p className="text-white/60 text-xs leading-relaxed line-clamp-2">
                                  {s.overview || 'No description available.'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-white/40 text-sm">No similar content found.</p>
                    )}
                  </motion.div>
                )}

                {/* ── DETAILS TAB ── */}
                {activeTab === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="grid grid-cols-2 gap-8 text-sm">
                      <div className="space-y-4">
                        <div>
                          <span className="text-white/40 block mb-1">Cast</span>
                          <p className="text-white/80 leading-relaxed">
                            {(details as any)?.credits?.cast?.slice(0, 10).map((a: any) => a.name).join(', ') || 'N/A'}
                          </p>
                        </div>
                        {creatorsText && mediaType === 'tv' && (
                          <div>
                            <span className="text-white/40 block mb-1">Creators</span>
                            <p className="text-white/80">{creatorsText}</p>
                          </div>
                        )}
                        {genresText && (
                          <div>
                            <span className="text-white/40 block mb-1">Genres</span>
                            <p className="text-white/80">{genresText}</p>
                          </div>
                        )}
                        {thisShowIs && (
                          <div>
                            <span className="text-white/40 block mb-1">This {mediaType === 'movie' ? 'Movie' : 'Show'} Is</span>
                            <p className="text-white font-semibold">{thisShowIs}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-white/40 block mb-1">Maturity Rating</span>
                          <div className="flex items-center gap-2">
                            <span className="border border-white/40 text-white/80 text-xs px-1.5 py-0.5 rounded-sm">{maturityRating}</span>
                            <span className="text-white/50 text-xs">{contentWarnings}</span>
                          </div>
                        </div>
                        {details && 'original_language' in details && (
                          <div>
                            <span className="text-white/40 block mb-1">Audio & Subtitles</span>
                            <p className="text-white/80">{formatLanguage(details.original_language)}</p>
                          </div>
                        )}
                        {details && 'production_companies' in details && (details as any).production_companies?.[0] && (
                          <div>
                            <span className="text-white/40 block mb-1">Studio</span>
                            <p className="text-white/80">{(details as any).production_companies[0].name}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-white/40 block mb-1">Rating</span>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-white font-semibold">{item.vote_average.toFixed(1)}</span>
                            <span className="text-white/40">({item.vote_count?.toLocaleString()} votes)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </DialogContent>

    </Dialog>
    
    {/* Trailer Modal */}
    {trailer && (
        <TrailerModal
          isOpen={showTrailer}
          onClose={() => setShowTrailer(false)}
          videoKey={trailer.key}
          title={title}
        />
    )}
    </>
  );
};
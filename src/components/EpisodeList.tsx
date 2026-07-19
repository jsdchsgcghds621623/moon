import { useState } from 'react';
import { Play, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getImageUrl, Episode } from '@/lib/tmdb';
import { useIsMobile } from '@/hooks/use-mobile';

interface EpisodeListProps {
  episodes: Episode[];
  onPlayEpisode: (episode: Episode) => void;
  onEpisodeInfo: (episode: Episode) => void;
}

export const EpisodeList = ({
  episodes,
  onPlayEpisode,
  onEpisodeInfo,
}: EpisodeListProps) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const formatRuntime = (runtime: number) => {
    if (!runtime) return '';
    const h = Math.floor(runtime / 60);
    const m = runtime % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="divide-y divide-white/[0.08]">
      {episodes.map((episode) => {
        const isHovered = hoveredId === episode.id;
        const isExpanded = expandedId === episode.id;

        return (
          <div
            key={episode.id}
            className={`
              flex items-start gap-4 px-0 py-4
              cursor-pointer group
              transition-colors duration-150
              ${isHovered ? 'bg-white/[0.06]' : 'bg-transparent'}
            `}
            onMouseEnter={() => !isMobile && setHoveredId(episode.id)}
            onMouseLeave={() => !isMobile && setHoveredId(null)}
            onClick={() => isMobile
              ? setExpandedId(isExpanded ? null : episode.id)
              : onPlayEpisode(episode)
            }
          >
            {/* Episode Number */}
            <div className="flex-shrink-0 w-10 flex items-center justify-center">
              <span className="text-2xl font-light text-white/40 tabular-nums leading-none">
                {episode.episode_number}
              </span>
            </div>

            {/* Thumbnail */}
            <div
              className={`
                relative flex-shrink-0 rounded overflow-hidden bg-[#2a2a2a]
                ${isMobile ? 'w-[120px] h-[68px]' : 'w-[130px] h-[73px]'}
              `}
            >
              {episode.still_path ? (
                <img
                  src={`${getImageUrl('w300')}${episode.still_path}`}
                  alt={episode.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[#333] flex items-center justify-center">
                  <Play className="h-6 w-6 text-white/30" />
                </div>
              )}

              {/* Hover play overlay */}
              {(isHovered || isMobile) && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-150">
                  <div
                    className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayEpisode(episode);
                    }}
                  >
                    <Play className="h-4 w-4 fill-black text-black ml-0.5" />
                  </div>
                </div>
              )}

              {/* Runtime badge */}
              {episode.runtime && (
                <div className="absolute bottom-1 right-1 text-[10px] text-white/80 bg-black/70 px-1.5 py-0.5 rounded-sm font-medium leading-none">
                  {formatRuntime(episode.runtime)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className={`
                  font-medium text-white leading-snug
                  ${isMobile ? 'text-[13px] line-clamp-2' : 'text-[14px] line-clamp-1'}
                `}>
                  {episode.name}
                </h4>

                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  {/* Runtime on desktop (next to title) */}
                  {!isMobile && episode.runtime && (
                    <span className="text-[12px] text-white/50 font-medium whitespace-nowrap">
                      {formatRuntime(episode.runtime)}
                    </span>
                  )}

                  {/* Info (desktop) */}
                  {!isMobile && (
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); onEpisodeInfo(episode); }}
                      aria-label="Episode info"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  )}

                  {/* Expand chevron (mobile) */}
                  {isMobile && (
                    <button
                      className="w-7 h-7 flex items-center justify-center text-white/50"
                      onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : episode.id); }}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />
                      }
                    </button>
                  )}
                </div>
              </div>

              {/* Overview — always visible on desktop, toggle on mobile */}
              {(!isMobile || isExpanded) && (
                <p className={`
                  text-[13px] text-white/55 leading-relaxed
                  ${isMobile ? 'mt-2 line-clamp-4' : 'line-clamp-3'}
                `}>
                  {episode.overview || 'No description available for this episode.'}
                </p>
              )}

              {/* Mobile meta */}
              {isMobile && !isExpanded && (
                <p className="text-[11px] text-white/40 mt-0.5">
                  Episode {episode.episode_number}
                  {episode.runtime ? ` · ${formatRuntime(episode.runtime)}` : ''}
                </p>
              )}

              {/* Mobile expanded actions */}
              {isMobile && isExpanded && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-[13px] font-bold rounded-[4px] active:scale-95 transition-transform"
                    onClick={(e) => { e.stopPropagation(); onPlayEpisode(episode); }}
                  >
                    <Play className="h-3.5 w-3.5 fill-black" />
                    Play
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/15 text-white text-[13px] font-medium rounded-[4px] active:scale-95 transition-transform"
                    onClick={(e) => { e.stopPropagation(); onEpisodeInfo(episode); }}
                  >
                    <Info className="h-3.5 w-3.5" />
                    Info
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
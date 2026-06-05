import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Season {
  id: number;
  name: string;
  poster_path: string;
  season_number: number;
  episode_count: number;
}

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeason: number;
  onSeasonChange: (seasonNumber: number) => void;
}

export const SeasonSelector = ({ seasons, selectedSeason, onSeasonChange }: SeasonSelectorProps) => {
  const currentSeason = seasons.find(s => s.season_number === selectedSeason);
  const isMobile = useIsMobile();
  
  // Filter out season 0 (specials) unless it's the only season
  const filteredSeasons = seasons.filter(s => s.season_number > 0 || seasons.length === 1);

  // For mobile with more than 4 seasons, show scrollable list
  if (isMobile && filteredSeasons.length > 4) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Choose Season</h4>
        <ScrollArea className="h-32 w-full rounded-md border border-border/50 bg-muted/20">
          <div className="p-2 space-y-1">
            {filteredSeasons.map((season) => (
              <Button
                key={season.id}
                variant={season.season_number === selectedSeason ? "default" : "ghost"}
                onClick={() => onSeasonChange(season.season_number)}
                className="w-full justify-start text-left h-auto py-2 px-3"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{season.name}</span>
                  <span className="text-xs opacity-70">
                    {season.episode_count} episode{season.episode_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Default dropdown for desktop or mobile with 4 or fewer seasons
  // modal={false} + elevated z-index: required inside Dialog (overlay is z-[300])
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-muted/50 border-border/50 hover:bg-muted"
        >
          <span className="font-medium">
            {currentSeason?.name || `Season ${selectedSeason}`}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="start"
        className="z-[350] w-56 bg-popover/95 backdrop-blur-sm border-border/50"
      >
        <div
          className={
            filteredSeasons.length > 6
              ? "max-h-64 overflow-y-auto"
              : "max-h-none"
          }
        >
          {filteredSeasons.map((season) => (
            <DropdownMenuItem
              key={season.id}
              onClick={() => onSeasonChange(season.season_number)}
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50"
            >
              <div className="flex flex-col">
                <span className="font-medium">{season.name}</span>
                <span className="text-xs text-muted-foreground">
                  {season.episode_count} episode{season.episode_count !== 1 ? 's' : ''}
                </span>
              </div>
              {season.season_number === selectedSeason && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
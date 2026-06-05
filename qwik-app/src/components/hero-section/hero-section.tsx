import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';
import { Play, Plus, Info } from 'lucide-qwik';
import { Button } from '~/components/ui/button';

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

interface HeroStore {
  featuredContent: MediaItem | null;
  squidGameData: MediaItem | null;
  isLoading: boolean;
  isInMyList: boolean;
}

export const HeroSection = component$(() => {
  const store = useStore<HeroStore>({
    featuredContent: null,
    squidGameData: null,
    isLoading: true,
    isInMyList: false,
  });

  const SQUID_GAME_BANNER = 'https://image.tmdb.org/t/p/original/8pD0Alsxpb7HDRp7jSlCE9iovWb.jpg';
  const SQUID_GAME_DATA = {
    id: 93405,
    name: 'Squid Game',
    overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games. Inside, a tempting prize awaits — with deadly high stakes.',
    backdrop_path: '/8pD0Alsxpb7HDRp7jSlCE9iovWb.jpg',
    vote_average: 8.0,
    first_air_date: '2021-09-17'
  };

  useVisibleTask$(() => {
    // Simulate loading and set Squid Game as featured content
    setTimeout(() => {
      store.squidGameData = SQUID_GAME_DATA;
      store.featuredContent = SQUID_GAME_DATA;
      store.isLoading = false;
    }, 1000);
  });

  const toggleMyList = $(() => {
    store.isInMyList = !store.isInMyList;
    // In a real app, this would update localStorage or make an API call
  });

  const handlePlayClick = $(() => {
    // In a real app, this would open the media modal
    console.log('Play clicked');
  });

  const handleInfoClick = $(() => {
    // In a real app, this would open the info modal
    console.log('More info clicked');
  });

  if (store.isLoading || !store.featuredContent) {
    return (
      <div class="relative h-screen flex items-center justify-center bg-muted animate-pulse">
        <div class="text-center">
          <div class="w-64 h-8 bg-muted-foreground/20 rounded mb-4"></div>
          <div class="w-96 h-4 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    );
  }

  const title = store.featuredContent.title || store.featuredContent.name || '';
  const mediaType = store.featuredContent.title ? 'movie' : 'tv';
  const backdropUrl = SQUID_GAME_BANNER;

  return (
    <div class="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-all duration-[8000ms] ease-out"
        style={{
          backgroundImage: `url(${backdropUrl})`,
          filter: 'brightness(0.85) contrast(1.1) saturate(1.2)',
        }}
      />
      
      {/* Gradient overlays */}
      <div class="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
      
      {/* Floating elements */}
      <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-netflix-red/10 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-1/3 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      
      {/* Content */}
      <div class="relative z-10 flex flex-col h-full">
        {/* Desktop content */}
        <div class="flex-1 sm:flex sm:items-center sm:px-6 lg:px-20">
          <div class="hidden sm:block max-w-full lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
            {/* Netflix Series Badge */}
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
              <div class="flex items-center gap-2">
                <div class="text-netflix-red text-xl sm:text-2xl font-black tracking-tight">N</div>
                <span class="text-white/90 font-medium text-xs sm:text-sm tracking-widest uppercase">
                  {mediaType === 'tv' ? 'SERIES' : 'FILM'}
                </span>
              </div>
            </div>
            
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black mb-4 sm:mb-6 text-white drop-shadow-2xl leading-[0.9] tracking-tight">
              {title}
            </h1>
            
            {/* Metadata */}
            <div class="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
              <div class="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded text-white font-semibold text-xs sm:text-sm">
                {new Date(store.featuredContent.release_date || store.featuredContent.first_air_date || '').getFullYear()}
              </div>
              <div class="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    class={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      i < Math.floor(store.featuredContent!.vote_average / 2) ? 'bg-yellow-400' : 'bg-white/30'
                    }`} 
                  />
                ))}
                <span class="text-white/80 ml-2 text-xs sm:text-sm">{store.featuredContent.vote_average.toFixed(1)}</span>
              </div>
              <div class="text-white/80 text-xs sm:text-sm">
                {mediaType === 'movie' ? 'Movie' : 'Series'}
              </div>
            </div>
            
            <p class="text-sm sm:text-base lg:text-lg xl:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed max-w-full sm:max-w-xl lg:max-w-2xl font-light">
              {store.featuredContent.overview.length > 180 ? 
                `${store.featuredContent.overview.substring(0, 180)}...` : 
                store.featuredContent.overview}
            </p>
            
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
              <Button 
                onClick$={handlePlayClick} 
                class="netflix-hero-play flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-md bg-white text-black"
              >
                <Play class="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 fill-current" />
                Play Now
              </Button>
              
              <Button 
                onClick$={handleInfoClick} 
                class="netflix-hero-secondary flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-md"
              >
                <Info class="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7" />
                More Info
              </Button>
              
              <Button 
                onClick$={toggleMyList} 
                class="netflix-hero-list flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg lg:text-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 rounded-full bg-white text-black"
              >
                <Plus class={`h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 ${store.isInMyList ? 'rotate-45' : ''} transition-transform duration-300`} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile content */}
        <div class="sm:hidden px-4 pb-8 pt-4 space-y-4 animate-fade-in">
          {/* Netflix Series Badge */}
          <div class="flex items-center gap-2 mb-2">
            <div class="text-netflix-red text-xl font-black tracking-tight">N</div>
            <span class="text-white/90 font-medium text-xs tracking-widest uppercase">SERIES</span>
          </div>
          
          <h1 class="text-3xl font-black text-white drop-shadow-2xl leading-tight tracking-tight">
            {title}
          </h1>
          
          {/* Genre tags */}
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-white/80 text-sm">Sci-Fi</span>
            <span class="text-white/60 text-sm">•</span>
            <span class="text-white/80 text-sm">Action & Adventure</span>
            <span class="text-white/60 text-sm">•</span>
            <span class="text-white/80 text-sm">Based on Comics</span>
          </div>
          
          <div class="flex gap-3">
            <Button 
              onClick$={handlePlayClick} 
              class="flex-1 flex items-center justify-center gap-2 text-lg px-6 py-4 rounded-md bg-white text-black font-semibold"
            >
              <Play class="h-5 w-5 fill-current" />
              Play
            </Button>
            
            <Button 
              onClick$={toggleMyList} 
              class="flex-1 flex items-center justify-center gap-2 text-lg px-6 py-4 rounded-md bg-gray-600/80 backdrop-blur-sm text-white font-semibold"
            >
              <Plus class={`h-5 w-5 ${store.isInMyList ? 'rotate-45' : ''} transition-transform duration-300`} />
              My List
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
});
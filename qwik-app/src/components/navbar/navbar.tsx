import { component$, useSignal, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link, useLocation, useNavigate } from '@builder.io/qwik-city';
import { Search, Bell, ChevronDown, Menu, X, Edit2, ExternalLink } from 'lucide-qwik';
import { Button } from '~/components/ui/button';

interface NavbarStore {
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  searchQuery: string;
  isEditingName: boolean;
  profileName: string;
  profileAvatar: string;
  isNotificationOpen: boolean;
}

export const Navbar = component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  
  const store = useStore<NavbarStore>({
    isSearchOpen: false,
    isMobileMenuOpen: false,
    searchQuery: '',
    isEditingName: false,
    profileName: 'ME',
    profileAvatar: '/lovable-uploads/a8918201-a815-4479-ae74-1fce99787310.png',
    isNotificationOpen: false,
  });

  // Load profile from localStorage
  useVisibleTask$(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      store.profileName = profile.name;
      store.profileAvatar = profile.avatar;
    }
  });

  // Keep search open when on search page
  useVisibleTask$(({ track }) => {
    track(() => location.url.pathname);
    if (location.url.pathname === '/search') {
      store.isSearchOpen = true;
      const searchParams = new URLSearchParams(location.url.search);
      const query = searchParams.get('q') || '';
      store.searchQuery = query;
    }
  });

  const navItems = [
    { name: 'Home', path: '/home/', section: 'home' },
    { name: 'Movies', path: '/movies/', section: 'movies' },
    { name: 'TV Shows', path: '/tv-shows/', section: 'tv' },
    { name: 'New & Popular', path: '/new-popular/', section: 'trending' },
    { name: 'My List', path: '/my-list/', section: 'my-list' },
  ];

  const handleSearch = $((query: string) => {
    store.searchQuery = query;
    
    if (query.trim()) {
      nav(`/search/?q=${encodeURIComponent(query)}`);
    }
  });

  const handleNameSave = $(() => {
    store.isEditingName = false;
    const profile = { id: '1', name: store.profileName, avatar: store.profileAvatar };
    localStorage.setItem('userProfile', JSON.stringify(profile));
  });

  const closeSearch = $(() => {
    store.isSearchOpen = false;
    store.searchQuery = '';
    if (location.url.pathname !== '/home') {
      nav('/home/');
    }
  });

  return (
    <header class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background to-transparent font-netflix">
      <nav class="flex items-center justify-between px-3 sm:px-4 lg:px-16 py-3 sm:py-4">
        {/* Logo */}
        <div class="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
          <Link href="/home/" class="flex items-center">
            <div class="cursor-pointer hover:scale-105 transition-transform duration-200">
              <img 
                src="/lovable-uploads/bffb51a3-45e8-4440-9ab1-94f7b01c1195.png" 
                alt="Netflix Logo"
                class="h-6 sm:h-8 lg:h-10 w-auto object-contain"
              />
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <ul class="hidden md:flex items-center space-x-3 lg:space-x-6">
            {navItems.map((item) => (
              <li key={item.section}>
                <Link
                  href={item.path}
                  class={`transition-colors font-medium text-sm lg:text-base ${
                    location.url.pathname === item.path 
                      ? 'text-foreground font-semibold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side */}
        <div class="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
          {/* Search */}
          <div class="relative">
            {store.isSearchOpen ? (
              <div class="flex items-center bg-background/90 backdrop-blur-md rounded-lg border border-border/50 shadow-lg">
                <input
                  placeholder="Search titles..."
                  value={store.searchQuery}
                  onInput$={(e) => handleSearch((e.target as HTMLInputElement).value)}
                  class="w-32 xs:w-40 sm:w-48 md:w-56 lg:w-64 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/70 text-foreground px-3 py-2"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick$={closeSearch}
                  class="transition-all duration-300 hover:scale-110 hover:bg-muted/50 h-8 w-8 mr-1"
                >
                  <X class="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick$={() => store.isSearchOpen = true}
                class="h-8 w-8 sm:h-10 sm:w-10 hover:bg-muted/50 transition-all duration-300 hover:scale-110"
              >
                <Search class="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
          </div>

          {/* Notifications */}
          <div class="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 sm:h-10 sm:w-10 relative hover:bg-muted/50 transition-all duration-300 hover:scale-110"
              onClick$={() => store.isNotificationOpen = !store.isNotificationOpen}
            >
              <Bell class="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground" />
              <span class="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                1
              </span>
            </Button>
            
            {store.isNotificationOpen && (
              <div class="absolute right-0 top-full mt-2 w-80 sm:w-96 p-0 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl rounded-lg z-50">
                <div class="p-6">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="bg-blue-500 rounded-xl p-3 shadow-lg">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        class="text-white"
                      >
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.91 1.21-5.41 3.56-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.47-.81-.26-1.46-.4-1.4-.85.03-.23.36-.47.98-.72 3.85-1.68 6.43-2.79 7.73-3.34 3.68-1.54 4.45-1.8 4.95-1.81.11 0 .35.03.51.17.13.12.17.27.19.38-.01.06-.01.24-.03.42z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-bold text-lg text-foreground">Join Our Telegram Channel</h3>
                      <p class="text-sm text-muted-foreground">Stay updated with latest content</p>
                    </div>
                  </div>
                  
                  <div class="space-y-3 mb-4">
                    <div class="flex items-center gap-2 text-green-400">
                      <span class="text-yellow-400">⭐</span>
                      <span class="text-sm font-medium">Request Movies and Series</span>
                    </div>
                    <div class="flex items-center gap-2 text-green-400">
                      <span class="text-yellow-400">⭐</span>
                      <span class="text-sm font-medium">Latest App/Website Updates</span>
                    </div>
                    <div class="flex items-center gap-2 text-green-400">
                      <span class="text-yellow-400">⭐</span>
                      <span class="text-sm font-medium">Report Bugs and Errors</span>
                    </div>
                  </div>
                  
                  <a
                    href="https://t.me/Moonflix_official_Channel"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors group"
                    onClick$={() => store.isNotificationOpen = false}
                  >
                    Join Channel
                    <ExternalLink class="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div class="flex items-center space-x-2 sm:space-x-3">
            <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden">
              <img 
                src={store.profileAvatar} 
                alt={store.profileName}
                class="w-full h-full object-cover"
              />
            </div>
            
            <div class="hidden sm:flex items-center space-x-2">
              {store.isEditingName ? (
                <input
                  value={store.profileName}
                  onInput$={(e) => store.profileName = (e.target as HTMLInputElement).value}
                  onBlur$={handleNameSave}
                  onKeyPress$={(e) => e.key === 'Enter' && handleNameSave()}
                  class="w-16 sm:w-20 h-6 sm:h-8 text-xs sm:text-sm bg-background/80 border border-border rounded px-2"
                  autoFocus
                />
              ) : (
                <span 
                  class="text-xs sm:text-sm font-medium cursor-pointer hover:text-muted-foreground transition-colors"
                  onClick$={() => store.isEditingName = true}
                >
                  {store.profileName}
                </span>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                class="w-5 h-5 sm:w-6 sm:h-6"
                onClick$={() => store.isEditingName = true}
              >
                <Edit2 class="h-2 w-2 sm:h-3 sm:w-3" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            class="md:hidden h-8 w-8"
            onClick$={() => store.isMobileMenuOpen = !store.isMobileMenuOpen}
          >
            {store.isMobileMenuOpen ? (
              <X class="h-5 w-5" />
            ) : (
              <Menu class="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {store.isMobileMenuOpen && (
        <div class="md:hidden bg-background/95 backdrop-blur-md border-t border-border">
          <ul class="px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <li key={item.section}>
                <Link
                  href={item.path}
                  onClick$={() => store.isMobileMenuOpen = false}
                  class="block w-full text-left text-foreground hover:text-muted-foreground transition-colors text-sm py-2"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
});

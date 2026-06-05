import { component$, useStore, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { ProfileCard } from './profile-card';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids?: boolean;
}

interface ProfileStore {
  profiles: Profile[];
  showAddForm: boolean;
  newProfileName: string;
  selectedAvatar: string;
}

export const ProfileSelection = component$(() => {
  const nav = useNavigate();
  
  const store = useStore<ProfileStore>({
    profiles: [
      {
        id: '1',
        name: 'ME',
        avatar: '/lovable-uploads/a8918201-a815-4479-ae74-1fce99787310.png',
      },
      {
        id: '2',
        name: 'Kids',
        avatar: '/lovable-uploads/b39cfe51-d347-4b50-924c-4a5d672ff09c.png',
        isKids: true,
      },
    ],
    showAddForm: false,
    newProfileName: '',
    selectedAvatar: '/lovable-uploads/6687140f-57cf-4ac7-9e12-e54a2bb9e14f.png',
  });

  const isLoaded = useSignal(false);

  useVisibleTask$(() => {
    // Load profiles from localStorage
    const savedProfiles = localStorage.getItem('userProfiles');
    if (savedProfiles) {
      store.profiles = JSON.parse(savedProfiles);
    }
    isLoaded.value = true;
  });

  const handleProfileSelect = $((profile: Profile) => {
    // Save selected profile to localStorage
    localStorage.setItem('userProfile', JSON.stringify(profile));
    // Navigate to home
    nav('/home/');
  });

  const handleAddProfile = $(() => {
    if (store.newProfileName.trim()) {
      const newProfile: Profile = {
        id: Date.now().toString(),
        name: store.newProfileName.trim(),
        avatar: store.selectedAvatar,
      };
      
      store.profiles = [...store.profiles, newProfile];
      localStorage.setItem('userProfiles', JSON.stringify(store.profiles));
      
      // Reset form
      store.showAddForm = false;
      store.newProfileName = '';
      store.selectedAvatar = '/lovable-uploads/6687140f-57cf-4ac7-9e12-e54a2bb9e14f.png';
    }
  });

  const handleProfileEdit = $((profile: Profile) => {
    // In a real app, this would open an edit modal
    console.log('Edit profile:', profile);
  });

  const avatarOptions = [
    '/lovable-uploads/6687140f-57cf-4ac7-9e12-e54a2bb9e14f.png',
    '/lovable-uploads/8cd6d8fc-7af0-4a3e-b16c-cc4046308648.png',
    '/lovable-uploads/a8918201-a815-4479-ae74-1fce99787310.png',
    '/lovable-uploads/b39cfe51-d347-4b50-924c-4a5d672ff09c.png',
  ];

  return (
    <div class="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div class="absolute inset-0 bg-gradient-to-br from-netflix-red/5 via-transparent to-transparent" />
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-netflix-red/10 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-1/3 right-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      
      <div class="relative z-10 text-center max-w-6xl mx-auto">
        {/* Netflix Logo */}
        <div class="mb-12">
          <img 
            src="/lovable-uploads/bffb51a3-45e8-4440-9ab1-94f7b01c1195.png" 
            alt="Netflix"
            class="h-12 lg:h-16 mx-auto object-contain"
          />
        </div>

        <h1 class="text-4xl lg:text-6xl font-bold text-white mb-4 font-netflix">
          Who's watching?
        </h1>
        
        <p class="text-gray-400 text-lg lg:text-xl mb-12 max-w-2xl mx-auto">
          Choose a profile to continue watching
        </p>

        {/* Profiles Grid */}
        <div class="flex flex-wrap justify-center gap-8 lg:gap-12 mb-8">
          {isLoaded.value && store.profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onSelect$={handleProfileSelect}
              onEdit$={handleProfileEdit}
            />
          ))}
          
          {/* Add New Profile Card */}
          {!store.showAddForm && store.profiles.length < 5 && (
            <ProfileCard
              isAddNew
              onAddNew$={() => store.showAddForm = true}
            />
          )}
        </div>

        {/* Add Profile Form */}
        {store.showAddForm && (
          <div class="bg-gray-900 p-6 rounded-lg max-w-md mx-auto animate-fade-in">
            <h3 class="text-2xl font-bold text-white mb-4">Add Profile</h3>
            
            <div class="mb-4">
              <input
                type="text"
                placeholder="Profile name"
                value={store.newProfileName}
                onInput$={(e) => store.newProfileName = (e.target as HTMLInputElement).value}
                class="w-full p-3 bg-gray-800 text-white rounded border border-gray-600 focus:border-netflix-red focus:outline-none"
                maxLength={15}
              />
            </div>

            <div class="mb-6">
              <p class="text-gray-400 mb-3">Choose an avatar:</p>
              <div class="flex gap-3 justify-center">
                {avatarOptions.map((avatar) => (
                  <img
                    key={avatar}
                    src={avatar}
                    alt="Avatar option"
                    class={`w-12 h-12 rounded cursor-pointer border-2 transition-all duration-200 ${
                      store.selectedAvatar === avatar 
                        ? 'border-netflix-red scale-110' 
                        : 'border-transparent hover:border-white'
                    }`}
                    onClick$={() => store.selectedAvatar = avatar}
                  />
                ))}
              </div>
            </div>

            <div class="flex gap-3">
              <button
                onClick$={handleAddProfile}
                disabled={!store.newProfileName.trim()}
                class="flex-1 bg-netflix-red text-white py-3 px-6 rounded font-semibold hover:bg-netflix-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Profile
              </button>
              <button
                onClick$={() => {
                  store.showAddForm = false;
                  store.newProfileName = '';
                }}
                class="flex-1 bg-gray-600 text-white py-3 px-6 rounded font-semibold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Manage Profiles Link */}
        <div class="mt-12">
          <button class="text-gray-400 text-lg hover:text-white transition-colors border border-gray-600 hover:border-white px-8 py-3 rounded">
            Manage Profiles
          </button>
        </div>
      </div>
    </div>
  );
});
import { component$, type QRL } from '@builder.io/qwik';
import { Edit, Plus } from 'lucide-qwik';
import { Button } from '~/components/ui/button';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids?: boolean;
}

interface ProfileCardProps {
  profile?: Profile;
  isAddNew?: boolean;
  onSelect$?: QRL<(profile: Profile) => void>;
  onEdit$?: QRL<(profile: Profile) => void>;
  onAddNew$?: QRL<() => void>;
}

export const ProfileCard = component$<ProfileCardProps>(({ 
  profile, 
  isAddNew, 
  onSelect$, 
  onEdit$, 
  onAddNew$ 
}) => {
  if (isAddNew) {
    return (
      <div 
        class="group flex flex-col items-center cursor-pointer animate-scale-in"
        onClick$={onAddNew$}
      >
        <div class="relative mb-4">
          <div class="w-32 h-32 lg:w-40 lg:h-40 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 
                     flex items-center justify-center group-hover:scale-110 transition-all duration-300
                     border-2 border-gray-600 group-hover:border-white shadow-xl">
            <Plus class="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 group-hover:text-white transition-colors duration-300" />
          </div>
        </div>
        <span class="text-gray-400 text-lg lg:text-xl font-semibold group-hover:text-white transition-colors duration-300">
          Add Profile
        </span>
      </div>
    );
  }

  return (
    <div class="group flex flex-col items-center cursor-pointer animate-scale-in">
      <div class="relative mb-4">
        <img
          src={profile?.avatar}
          alt={profile?.name}
          class="w-32 h-32 lg:w-40 lg:h-40 rounded-lg object-cover group-hover:scale-110 
                 transition-all duration-300 shadow-xl border-2 border-transparent 
                 group-hover:border-white"
          onClick$={() => profile && onSelect$?.(profile)}
        />
        
        {/* Edit button */}
        <Button
          size="icon"
          variant="ghost"
          class="absolute -bottom-2 -right-2 w-8 h-8 bg-black/80 border border-white/30 
                 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300
                 hover:bg-white hover:text-black hover:scale-110"
          onClick$={(e) => {
            e.stopPropagation();
            profile && onEdit$?.(profile);
          }}
        >
          <Edit class="w-4 h-4" />
        </Button>
        
        {profile?.isKids && (
          <div class="absolute -top-2 -left-2 bg-netflix-red px-2 py-1 rounded-md text-xs font-bold">
            KIDS
          </div>
        )}
      </div>
      
      <span 
        class="text-gray-400 text-lg lg:text-xl font-semibold group-hover:text-white 
               transition-colors duration-300 text-center"
        onClick$={() => profile && onSelect$?.(profile)}
      >
        {profile?.name}
      </span>
    </div>
  );
});
import { useMyList } from '@/hooks/useMyList';
import { MediaCard } from './MediaCard';
import { Movie, TVShow } from '@/lib/tmdb';

interface MyListSectionProps {
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}

export const MyListSection = ({ onPlay, onMoreInfo }: MyListSectionProps) => {
  const { myList } = useMyList();

  return (
    <div className="px-4 lg:px-16 py-8 animate-fade-in">
      <h2 className="netflix-section-title">My List</h2>
      
      {myList.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl text-muted-foreground mb-4">
            Your list is empty
          </h3>
          <p className="text-muted-foreground">
            Add movies and TV shows to your list by clicking the + button
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {myList.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={onPlay}
              onMoreInfo={onMoreInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
};
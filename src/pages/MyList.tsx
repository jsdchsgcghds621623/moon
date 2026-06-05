import { useState } from 'react';
import { MyListSection } from '@/components/MyListSection';
import { MediaModalLazy as MediaModal } from '@/components/MediaModalLazy';
import { TrailerModal } from '@/components/TrailerModal';

import { Movie, TVShow, getMovieDetails, getTVShowDetails } from '@/lib/tmdb';
// import { useContinueWatching } from '@/hooks/useContinueWatching';

const MyList = () => {
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  
  // const { addToContinueWatching } = useContinueWatching();

  const handlePlay = async (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    try {
      // addToContinueWatching(item, mediaType, Math.random() * 60 + 10);

      const details = mediaType === 'movie' 
        ? await getMovieDetails(item.id)
        : await getTVShowDetails(item.id);
      
      const trailer = details.videos?.results.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (trailer) {
        setTrailerKey(trailer.key);
        setIsTrailerOpen(true);
      } else {
        setSelectedItem(item);
        setSelectedMediaType(mediaType);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error playing content:', error);
    }
  };

  const handleMoreInfo = (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  };

  return (
    <>
      <MyListSection
        onPlay={handlePlay}
        onMoreInfo={handleMoreInfo}
      />
      
      {selectedItem && (
        <MediaModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          mediaType={selectedMediaType}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
        />
      )}
      
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoKey={trailerKey}
        title={selectedItem ? ('title' in selectedItem ? selectedItem.title : selectedItem.name) : ''}
      />
    </>
  );
};

export default MyList;

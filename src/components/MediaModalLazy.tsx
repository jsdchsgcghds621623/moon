import { MediaModal } from './MediaModal';
import { Movie, TVShow } from '@/lib/tmdb';

interface MediaModalLazyProps {
  isOpen: boolean;
  onClose: () => void;
  item: Movie | TVShow | null;
  mediaType: 'movie' | 'tv';
  onPlay: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onPlayInitiated?: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  onMoreInfo?: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
  source?: 'continue-watching' | 'default';
}

export const MediaModalLazy = (props: MediaModalLazyProps) => {
  // Don't render anything if modal is not open
  if (!props.isOpen || !props.item) {
    return null;
  }

  // Direct render for instant opening
  return <MediaModal {...props} />;
};
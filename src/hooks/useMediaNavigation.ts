import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, TVShow } from '@/lib/tmdb';
import { getMediaPath, getMediaTitle } from '@/lib/seo';

export function useMediaNavigation() {
  const navigate = useNavigate();

  const openDetail = useCallback(
    (item: Movie | TVShow, mediaType: 'movie' | 'tv', options?: { asAnime?: boolean }) => {
      const title = getMediaTitle(item);
      navigate(getMediaPath(mediaType, title, item.id, options));
    },
    [navigate]
  );

  return { openDetail, navigate };
}

import { useState, useEffect, useCallback } from 'react';
import { Movie, TVShow } from '@/lib/tmdb';

/** Disabled: no save/load; browse UI hidden. Set true to re-enable. */
const CONTINUE_WATCHING_ENABLED = false;

export interface ContinueWatchingItem {
  content: Movie | TVShow;
  mediaType: 'movie' | 'tv';
  progress: number; // percentage 0-100
  lastWatched: number; // timestamp
  episodeNumber?: number; // for TV shows
  seasonNumber?: number; // for TV shows
}

/** Entries are removed this long after `lastWatched` (last play / progress update). */
const CONTINUE_WATCHING_TTL_MS = 3 * 60 * 60 * 1000;

const purgeExpiredItems = (items: ContinueWatchingItem[]): ContinueWatchingItem[] =>
  items.filter((item) => Date.now() - item.lastWatched < CONTINUE_WATCHING_TTL_MS);

const saveToStorage = (items: ContinueWatchingItem[]) => {
  if (!CONTINUE_WATCHING_ENABLED) return;
  const activeItems = purgeExpiredItems(items);
  if (activeItems.length) {
    localStorage.setItem('netflix-continue-watching', JSON.stringify(activeItems));
  } else {
    localStorage.removeItem('netflix-continue-watching');
  }
};

export const useContinueWatching = () => {
  const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    if (!CONTINUE_WATCHING_ENABLED) return;

    const savedItems = localStorage.getItem('netflix-continue-watching');
    if (savedItems) {
      try {
        const items = JSON.parse(savedItems) as ContinueWatchingItem[];
        const activeItems = purgeExpiredItems(items);
        const sortedItems = activeItems.sort(
          (a, b) => b.lastWatched - a.lastWatched
        );
        if (activeItems.length !== items.length) {
          saveToStorage(sortedItems);
        }
        setContinueWatchingItems(sortedItems);
      } catch (error) {
        console.error('Error parsing continue watching items:', error);
        localStorage.removeItem('netflix-continue-watching');
      }
    }

    const intervalId = window.setInterval(() => {
      setContinueWatchingItems((prev) => {
        const activeItems = purgeExpiredItems(prev);
        if (activeItems.length === prev.length) return prev;
        saveToStorage(activeItems);
        return activeItems;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const addToContinueWatching = useCallback(
    (
      content: Movie | TVShow,
      mediaType: 'movie' | 'tv',
      progress: number,
      episodeNumber?: number,
      seasonNumber?: number
    ) => {
      if (!CONTINUE_WATCHING_ENABLED) return;

      const newItem: ContinueWatchingItem = {
        content,
        mediaType,
        progress: Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
        lastWatched: Date.now(),
        episodeNumber: mediaType === 'tv' ? (episodeNumber || 1) : undefined,
        seasonNumber: mediaType === 'tv' ? (seasonNumber || 1) : undefined,
      };

      setContinueWatchingItems((prevItems) => {
        const filteredItems = prevItems.filter(
          (item) => !(item.content.id === content.id && item.mediaType === mediaType)
        );

        const updatedItems = [newItem, ...filteredItems];

        const limitedItems = updatedItems.slice(0, 10);

        saveToStorage(limitedItems);
        return limitedItems;
      });
    },
    []
  );

  const removeFromContinueWatching = useCallback((contentId: number, mediaType: 'movie' | 'tv') => {
    if (!CONTINUE_WATCHING_ENABLED) return;

    setContinueWatchingItems((prevItems) => {
      const updatedItems = prevItems.filter(
        (item) => !(item.content.id === contentId && item.mediaType === mediaType)
      );
      saveToStorage(updatedItems);
      return updatedItems;
    });

    try {
      const recentlyWatched = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
      const filteredRecentlyWatched = recentlyWatched.filter((item: { tmdbId: number; type: string }) => {
        return !(item.tmdbId === contentId && item.type === mediaType);
      });
      localStorage.setItem('recentlyWatched', JSON.stringify(filteredRecentlyWatched));
    } catch (error) {
      console.error('Error removing from recently watched:', error);
    }
  }, []);

  const updateProgress = useCallback(
    (
      contentId: number,
      mediaType: 'movie' | 'tv',
      progress: number,
      episodeNumber?: number,
      seasonNumber?: number
    ) => {
      if (!CONTINUE_WATCHING_ENABLED) return;

      setContinueWatchingItems((prevItems) => {
      const itemIndex = prevItems.findIndex(
        item => item.content.id === contentId && item.mediaType === mediaType
      );

      if (itemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          progress: Math.min(Math.max(progress, 0), 100),
          lastWatched: Date.now(),
          episodeNumber: mediaType === 'tv' ? (episodeNumber || updatedItems[itemIndex].episodeNumber || 1) : undefined,
          seasonNumber: mediaType === 'tv' ? (seasonNumber || updatedItems[itemIndex].seasonNumber || 1) : undefined,
        };

        // Remove if watched more than 95% or keep if progress is significant
        if (progress >= 95) {
          updatedItems.splice(itemIndex, 1);
        } else if (progress > 5) {
          // Move to front as most recently watched only if progress is significant
          const [item] = updatedItems.splice(itemIndex, 1);
          updatedItems.unshift(item);
        }

        saveToStorage(updatedItems);
        return updatedItems;
      }

      return prevItems;
      });
    },
    []
  );

  const getProgress = (contentId: number, mediaType: 'movie' | 'tv') => {
    const item = continueWatchingItems.find(
      item => item.content.id === contentId && item.mediaType === mediaType
    );
    return item?.progress || 0;
  };

  const getResumeData = (contentId: number, mediaType: 'movie' | 'tv') => {
    const item = continueWatchingItems.find(
      item => item.content.id === contentId && item.mediaType === mediaType
    );
    return {
      progress: item?.progress || 0,
      seasonNumber: item?.seasonNumber || 1,
      episodeNumber: item?.episodeNumber || 1,
      hasWatchHistory: !!item && item.progress > 0
    };
  };

  const clearContinueWatching = useCallback(() => {
    if (!CONTINUE_WATCHING_ENABLED) return;
    setContinueWatchingItems([]);
    localStorage.removeItem('netflix-continue-watching');
  }, []);

  return {
    continueWatchingItems,
    addToContinueWatching,
    removeFromContinueWatching,
    updateProgress,
    getProgress,
    getResumeData,
    clearContinueWatching,
  };
};

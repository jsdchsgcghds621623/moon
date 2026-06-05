import { useState, useEffect } from 'react';
import { Movie, TVShow } from '@/lib/tmdb';

export type MyListItem = (Movie | TVShow) & { 
  mediaType: 'movie' | 'tv';
  addedAt: number;
};

export const useMyList = () => {
  const [myList, setMyList] = useState<MyListItem[]>([]);

  useEffect(() => {
    const savedData = localStorage.getItem('netflix-my-list');
    if (savedData) {
      try {
        const parsedList: MyListItem[] = JSON.parse(savedData);
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        // Filter out expired items (older than 30 days)
        const validItems = parsedList.filter(item => {
          const addedAt = item.addedAt || 0;
          return (now - addedAt) < thirtyDaysMs;
        });
        
        // If we filtered out items, update localStorage
        if (validItems.length !== parsedList.length) {
          saveToStorage(validItems);
        }
        
        setMyList(validItems);
      } catch (error) {
        console.error('Error parsing saved list:', error);
        localStorage.removeItem('netflix-my-list');
      }
    }
  }, []);

  const saveToStorage = (list: MyListItem[]) => {
    localStorage.setItem('netflix-my-list', JSON.stringify(list));
  };

  const addToMyList = (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    const newItem = { ...item, mediaType, addedAt: Date.now() };
    const updatedList = [...myList, newItem];
    setMyList(updatedList);
    saveToStorage(updatedList);
  };

  const removeFromMyList = (id: number) => {
    const updatedList = myList.filter(item => item.id !== id);
    setMyList(updatedList);
    saveToStorage(updatedList);
  };

  const isInMyList = (id: number): boolean => {
    return myList.some(item => item.id === id);
  };

  const toggleMyList = (item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    if (isInMyList(item.id)) {
      removeFromMyList(item.id);
    } else {
      addToMyList(item, mediaType);
    }
  };

  return {
    myList,
    addToMyList,
    removeFromMyList,
    isInMyList,
    toggleMyList,
  };
};
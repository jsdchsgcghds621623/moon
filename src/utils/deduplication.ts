import { Movie, TVShow } from '@/lib/tmdb';

// Current year for filtering old content
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR_MOVIES = CURRENT_YEAR - 10; // Last 10 years for movies
const MIN_YEAR_TV = CURRENT_YEAR - 8; // Last 8 years for TV shows

// Filter content by date to remove old movies/shows
export const filterByDate = (items: (Movie | TVShow)[], mediaType: 'movie' | 'tv' = 'movie'): (Movie | TVShow)[] => {
  const minYear = mediaType === 'movie' ? MIN_YEAR_MOVIES : MIN_YEAR_TV;
  
  return items.filter(item => {
    let releaseYear = 0;
    
    if ('release_date' in item && item.release_date) {
      releaseYear = new Date(item.release_date).getFullYear();
    } else if ('first_air_date' in item && item.first_air_date) {
      releaseYear = new Date(item.first_air_date).getFullYear();
    }
    
    // Handle cases where year might be invalid
    if (isNaN(releaseYear) || releaseYear === 0) {
      return false;
    }
    
    return releaseYear >= minYear && releaseYear <= CURRENT_YEAR;
  });
};

// Filter content to only show high-quality items
export const filterHighQuality = (items: (Movie | TVShow)[]): (Movie | TVShow)[] => {
  return items.filter(item => {
    const rating = item.vote_average || 0;
    const voteCount = item.vote_count || 0;
    
    // More lenient filtering for Cinemeta content (some may not have many votes)
    return rating >= 5.5 && (voteCount >= 50 || rating >= 7.0);
  });
};

// Utility to remove duplicate content across different categories
export const deduplicateContent = (
  categories: { [key: string]: (Movie | TVShow)[] },
  priorityOrder: string[] = []
): { [key: string]: (Movie | TVShow)[] } => {
  const seenIds = new Set<number>();
  const deduplicatedCategories: { [key: string]: (Movie | TVShow)[] } = {};
  
  // Process categories in priority order first
  const orderedKeys = [
    ...priorityOrder.filter(key => categories[key]),
    ...Object.keys(categories).filter(key => !priorityOrder.includes(key))
  ];
  
  for (const categoryName of orderedKeys) {
    const items = categories[categoryName] || [];
    const uniqueItems = items.filter(item => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    
    deduplicatedCategories[categoryName] = uniqueItems;
  }
  
  return deduplicatedCategories;
};

// Create a content map for quick deduplication lookups
export const createContentMap = (contentArrays: (Movie | TVShow)[][]) => {
  const contentMap = new Map<number, Movie | TVShow>();
  
  contentArrays.forEach(array => {
    array.forEach(item => {
      if (!contentMap.has(item.id)) {
        contentMap.set(item.id, item);
      }
    });
  });
  
  return contentMap;
};

// Filter out items that appear in higher priority categories
export const filterDuplicates = (
  items: (Movie | TVShow)[],
  higherPriorityItems: (Movie | TVShow)[][]
): (Movie | TVShow)[] => {
  const priorityIds = new Set<number>();
  
  higherPriorityItems.forEach(array => {
    array.forEach(item => priorityIds.add(item.id));
  });
  
  return items.filter(item => !priorityIds.has(item.id));
};

// Comprehensive filter that combines all filtering logic
export const applyContentFilters = (
  categories: { [key: string]: (Movie | TVShow)[] },
  mediaType: 'movie' | 'tv' = 'movie',
  priorityOrder: string[] = []
): { [key: string]: (Movie | TVShow)[] } => {
  
  // First apply date and quality filters to each category but keep more items
  const filteredCategories: { [key: string]: (Movie | TVShow)[] } = {};
  
  Object.entries(categories).forEach(([key, items]) => {
    let filtered = items;
    
    // Apply less aggressive filtering to keep more content
    // Only filter by date for very old content (more than 15 years old)
    if (mediaType === 'movie') {
      filtered = items.filter(item => {
        if ('release_date' in item && item.release_date) {
          const year = new Date(item.release_date).getFullYear();
          return isNaN(year) ? true : year >= (CURRENT_YEAR - 15);
        }
        return true;
      });
    } else {
      filtered = items.filter(item => {
        if ('first_air_date' in item && item.first_air_date) {
          const year = new Date(item.first_air_date).getFullYear();
          return isNaN(year) ? true : year >= (CURRENT_YEAR - 12);
        }
        return true;
      });
    }
    
    // Apply moderate quality filtering (keep more items)
    filtered = filtered.filter(item => {
      const rating = item.vote_average || 0;
      const voteCount = item.vote_count || 0;
      return rating >= 4.0 && (voteCount >= 10 || rating >= 6.0);
    });
    
    // Ensure we have at least 20 items per category
    filteredCategories[key] = filtered.slice(0, 20);
  });
  
  // Then apply deduplication but prioritize keeping items
  return deduplicateContent(filteredCategories, priorityOrder);
};
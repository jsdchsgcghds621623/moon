import { useState, useEffect, useCallback } from 'react';

interface LikeState {
  likes: number;
  isLiked: boolean;
  isLoading: boolean;
}

export const useLikes = (movieId: string | number) => {
  const [state, setState] = useState<LikeState>({
    likes: 0,
    isLiked: false,
    isLoading: true
  });

  const normalizedId = String(movieId);

  // Check if user already liked this content
  useEffect(() => {
    const hasLiked = localStorage.getItem(`liked_${normalizedId}`) === 'true';
    setState(prev => ({ ...prev, isLiked: hasLiked }));
  }, [normalizedId]);

  // Load current like count - disable server fetch for now
  const loadLikes = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      console.log('🔄 Loading likes for ID:', normalizedId);
      
      // Use localStorage fallback directly since server is not available
      const localLikes = parseInt(localStorage.getItem(`likes_${normalizedId}`) || '0');
      const validLikes = isNaN(localLikes) ? 0 : localLikes;
      setState(prev => ({ 
        ...prev, 
        likes: validLikes,
        isLoading: false 
      }));
    } catch (error) {
      console.error('❌ Failed to load likes, using fallback:', error);
      // Fallback to localStorage
      const localLikes = parseInt(localStorage.getItem(`likes_${normalizedId}`) || '0');
      const validLikes = isNaN(localLikes) ? 0 : localLikes;
      setState(prev => ({ 
        ...prev, 
        likes: validLikes,
        isLoading: false 
      }));
    }
  }, [normalizedId]);

  // Load likes on mount
  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  // Toggle like/dislike
  const toggleLike = useCallback(async () => {
    try {
      if (state.isLiked) {
        // Unlike the content
        console.log('👎 Attempting to unlike content:', normalizedId);
        
        // Since server is not available, use localStorage fallback
        const currentLikes = Math.max(0, parseInt(localStorage.getItem(`likes_${normalizedId}`) || '0') - 1);
        const validLikes = isNaN(currentLikes) ? 0 : currentLikes;
        localStorage.setItem(`likes_${normalizedId}`, validLikes.toString());
        localStorage.setItem(`liked_${normalizedId}`, 'false');
        
        setState(prev => ({ 
          ...prev, 
          likes: validLikes,
          isLiked: false 
        }));
        
        return { success: true, message: '' };
      } else {
        // Like the content
        console.log('👍 Attempting to like content:', normalizedId);
        
        // Since server is not available, use localStorage fallback
        const currentLikes = parseInt(localStorage.getItem(`likes_${normalizedId}`) || '0') + 1;
        const validLikes = isNaN(currentLikes) ? 1 : currentLikes;
        localStorage.setItem(`likes_${normalizedId}`, validLikes.toString());
        localStorage.setItem(`liked_${normalizedId}`, 'true');
        
        setState(prev => ({ 
          ...prev, 
          likes: validLikes,
          isLiked: true 
        }));
        
        return { success: true, message: '' };
      }
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
      return { success: false, message: '' };
    }
  }, [normalizedId, state.isLiked]);

  return {
    likes: state.likes,
    isLiked: state.isLiked,
    isLoading: state.isLoading,
    toggleLike
  };
};
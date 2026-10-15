import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MediaCarousel } from '@/components/MediaCarousel';
import { MediaModalLazy } from '@/components/MediaModalLazy';
import { SeoHead } from '@/components/SeoHead';
import { useFranchiseCollectionDetail } from '@/hooks/useTMDBQuery';
import { Movie, TVShow } from '@/lib/tmdb';

const FranchiseCollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useFranchiseCollectionDetail(slug, Boolean(slug));

  const franchise = data?.franchise;
  const movies = data?.movies ?? [];
  const tvSeries = data?.tvSeries ?? [];

  const title = franchise?.name || 'Franchise Collection';
  const description = franchise?.poster || 'Browse the full franchise collection.';

  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlay = useCallback((item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  }, []);

  const handleMoreInfo = useCallback((item: Movie | TVShow, mediaType: 'movie' | 'tv') => {
    setSelectedItem(item);
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  }, []);

  if (!slug) {
    return null;
  }

  if (!isLoading && error) {
    return (
      <div className="px-4 lg:px-16 py-20 text-center text-white">
        <h1 className="text-3xl font-bold mb-4">Franchise not found</h1>
        <p className="text-base text-[#c0c0c0]">The franchise page you requested does not exist.</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <SeoHead
        title={`${title} Collection`}
        description={description}
        canonicalPath={`/franchise/${slug}`}
      />

      <div className="px-4 sm:px-6 lg:px-[60px] pt-8 pb-8">
        <div className="max-w-5xl">
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {title}
            </h1>
            <p className="mt-4 text-base text-[#d0d0d0] leading-relaxed max-w-3xl">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#a0a0a0]">
            <span className="px-3 py-2 rounded-full bg-white/5 border border-white/10">
              {franchise?.number_of_movies ?? 0} titles
            </span>
            <span className="px-3 py-2 rounded-full bg-white/5 border border-white/10">
              ${franchise?.total_box_office_billions ?? 0}B box office
            </span>
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="px-3 py-2 rounded-full border border-white/10 text-white/90 bg-white/5 hover:bg-white/10 transition"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-10 px-4 sm:px-6 lg:px-[60px]">
        {movies.length > 0 && (
          <MediaCarousel
            title="Movies in this Franchise"
            items={movies}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isLoading}
          />
        )}

        {tvSeries.length > 0 && (
          <MediaCarousel
            title="TV & Specials in this Franchise"
            items={tvSeries}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            isLoading={isLoading}
          />
        )}
      </div>

      {selectedItem && (
        <MediaModalLazy
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
    </div>
  );
};

export default FranchiseCollectionPage;

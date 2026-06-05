import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Navbar } from '~/components/navbar/navbar';
import { HeroSection } from '~/components/hero-section/hero-section';
import { MediaCarousel } from '~/components/media-carousel/media-carousel';
import { Footer } from '~/components/footer/footer';

export default component$(() => {
  return (
    <>
      <Navbar />
      <HeroSection />
      
      <div class="relative z-10 -mt-20">
        <MediaCarousel 
          title="Trending Now" 
          endpoint="/trending/all/week"
        />
        <MediaCarousel 
          title="Popular Movies" 
          endpoint="/movie/popular"
        />
        <MediaCarousel 
          title="Popular TV Shows" 
          endpoint="/tv/popular"
        />
        <MediaCarousel 
          title="Top Rated Movies" 
          endpoint="/movie/top_rated"
        />
        <MediaCarousel 
          title="Top Rated TV Shows" 
          endpoint="/tv/top_rated"
        />
      </div>
      
      <Footer />
    </>
  );
});

export const head: DocumentHead = {
  title: 'Netflix - Home',
  meta: [
    {
      name: 'description',
      content: 'Watch Netflix movies & TV shows online. Stream trending content, popular movies and top-rated TV shows.',
    },
  ],
};
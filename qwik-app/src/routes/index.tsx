import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { ProfileSelection } from '~/components/profile-selection/profile-selection';

export default component$(() => {
  return (
    <>
      <ProfileSelection />
    </>
  );
});

export const head: DocumentHead = {
  title: 'Netflix',
  meta: [
    {
      name: 'description',
      content: 'Watch Netflix movies & TV shows online or stream right to your smart TV, game console, PC, Mac, mobile, tablet and more.',
    },
    {
      name: 'keywords',
      content: 'netflix, movies, tv shows, streaming, entertainment',
    },
  ],
};
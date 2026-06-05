import { useLocation } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead';
import { SITE_NAME } from '@/lib/seo';

const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/browse': {
    title: `Watch Free Movies & TV Shows Online — ${SITE_NAME}`,
    description: `Stream Bollywood, Hollywood, anime, and web series in HD on ${SITE_NAME}. Trending movies and TV updated daily.`,
  },
  '/movies': {
    title: `Movies — Watch Free Online in HD — ${SITE_NAME}`,
    description: `Browse free movies online: action, comedy, horror, animation, and top Netflix picks on ${SITE_NAME}.`,
  },
  '/tv-shows': {
    title: `TV Shows & Web Series — ${SITE_NAME}`,
    description: `Watch TV series and web shows online in HD. Top rated, trending, and genre collections on ${SITE_NAME}.`,
  },
  '/new-popular': {
    title: `New & Popular — ${SITE_NAME}`,
    description: `Discover new releases and popular movies and TV shows streaming free on ${SITE_NAME}.`,
  },
  '/my-list': {
    title: `My List — ${SITE_NAME}`,
    description: `Your personal watchlist on ${SITE_NAME}. Save movies and series to watch later.`,
  },
  '/disclaimer': {
    title: `Disclaimer — ${SITE_NAME}`,
    description: `Legal disclaimer and terms of use for ${SITE_NAME}.`,
  },
  '/what-is-moonflix': {
    title: `What is Moonflix? — ${SITE_NAME}`,
    description: `Learn about Moonflix — free movie and TV discovery on moonflix.site and moonflix.in.`,
  },
};

export function RouteSeo() {
  const { pathname } = useLocation();
  const meta = ROUTE_META[pathname];
  if (!meta) return null;

  return (
    <SeoHead
      title={meta.title}
      description={meta.description}
      canonicalPath={pathname}
    />
  );
}

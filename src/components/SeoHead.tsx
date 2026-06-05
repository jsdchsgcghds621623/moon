import { useEffect } from 'react';

type SeoHeadProps = {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const JSON_LD_ID = 'moonflix-seo-jsonld';

function upsertMeta(
  selector: string,
  createAttrs: Record<string, string>,
  content: string
) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    Object.entries(createAttrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    const origin = window.location.origin;
    const canonical = canonicalPath.startsWith('http')
      ? canonicalPath
      : `${origin}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    const ogImage = image || `${origin}/lovable-uploads/Moonflix.png`;

    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta(
      'meta[name="robots"]',
      { name: 'robots' },
      noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large'
    );
    upsertCanonical(canonical);

    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, ogImage);

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, ogImage);

    const existing = document.getElementById(JSON_LD_ID);
    if (existing) existing.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = JSON_LD_ID;
      script.type = 'application/ld+json';
      const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      script.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, image, type, noindex, jsonLd]);

  return null;
}

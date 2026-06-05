/**
 * Generates a sitemap index + multiple child sitemaps for maximum crawl coverage.
 * Run: npm run generate:sitemap
 * Requires VITE_TMDB_API_KEY in .env or environment.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const sitemapsDir = path.join(publicDir, 'sitemaps');
const SITE_URL = (process.env.VITE_SITE_URL || 'https://moonflix.site').replace(/\/$/, '');
const CHUNK_SIZE = 5000;
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w780';
const today = new Date().toISOString().slice(0, 10);

function loadEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const API_KEY = process.env.VITE_TMDB_API_KEY;
if (!API_KEY) {
  console.warn('Missing VITE_TMDB_API_KEY — skipping sitemap generation');
  process.exit(0);
}

function slugify(title) {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'title'
  );
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mediaPath(type, title, id) {
  return `/${type}/${slugify(title)}-${id}`;
}

function toLastmod(dateStr) {
  if (!dateStr) return today;
  const d = dateStr.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today;
}

function isAnimeTv(item) {
  const genres = item.genre_ids || [];
  const lang = (item.original_language || '').toLowerCase();
  return genres.includes(16) && (lang === 'ja' || (item.origin_country || []).includes('JP'));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let requestCount = 0;

async function tmdb(apiPath, retries = 4) {
  const url = `https://api.themoviedb.org/3${apiPath}${apiPath.includes('?') ? '&' : '?'}api_key=${API_KEY}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    requestCount += 1;
    if (requestCount % 30 === 0) await sleep(1200);

    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await sleep(2500 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`TMDB ${apiPath}: ${res.status}`);
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1500 * attempt);
    }
  }

  throw new Error(`TMDB ${apiPath}: failed after ${retries} attempts`);
}

/** @typedef {{ loc: string, lastmod: string, changefreq: string, priority: string, image?: string, imageTitle?: string }} SitemapEntry */

/** @type {Map<string, SitemapEntry>} */
const movieEntries = new Map();
/** @type {Map<string, SitemapEntry>} */
const tvEntries = new Map();
/** @type {Map<string, SitemapEntry>} */
const animeEntries = new Map();
/** @type {Map<string, SitemapEntry>} */
const trendingEntries = new Map();

function addEntry(bucket, entry) {
  const existing = bucket.get(entry.loc);
  if (!existing || entry.lastmod > existing.lastmod) {
    bucket.set(entry.loc, entry);
  }
}

function addMediaItem(bucket, type, item, options = {}) {
  const title = type === 'movie' ? item.title : item.name;
  if (!title || !item.id) return;

  const pathType = options.pathType || type;
  const loc = `${SITE_URL}${mediaPath(pathType, title, item.id)}`;
  const date = type === 'movie' ? item.release_date : item.first_air_date;
  const poster = item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null;

  addEntry(bucket, {
    loc,
    lastmod: toLastmod(date),
    changefreq: options.changefreq || 'weekly',
    priority: options.priority || '0.7',
    image: poster,
    imageTitle: title,
  });
}

async function fetchPaged(endpoint, pages, onPage) {
  for (let page = 1; page <= pages; page++) {
    const data = await tmdb(`${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}`);
    onPage(data.results || [], page);
    if (!data.results?.length || page >= (data.total_pages || pages)) break;
  }
}

async function collectMovies() {
  const sources = [
    { endpoint: '/movie/popular', pages: 20 },
    { endpoint: '/movie/top_rated', pages: 15 },
    { endpoint: '/movie/now_playing', pages: 8 },
    { endpoint: '/movie/upcoming', pages: 8 },
    { endpoint: '/trending/movie/week', pages: 5 },
    { endpoint: '/trending/movie/day', pages: 3 },
    { endpoint: '/discover/movie?sort_by=vote_count.desc&vote_count.gte=500', pages: 10 },
    { endpoint: '/discover/movie?with_genres=35&sort_by=popularity.desc', pages: 5 },
    { endpoint: '/discover/movie?with_genres=28&sort_by=popularity.desc', pages: 5 },
    { endpoint: '/discover/movie?with_genres=27&sort_by=popularity.desc', pages: 5 },
    { endpoint: '/discover/movie?with_genres=878&sort_by=popularity.desc', pages: 5 },
    { endpoint: '/discover/movie?with_original_language=hi&sort_by=popularity.desc', pages: 8 },
    { endpoint: '/discover/movie?with_original_language=te&sort_by=popularity.desc', pages: 4 },
    { endpoint: '/discover/movie?with_original_language=ta&sort_by=popularity.desc', pages: 4 },
  ];

  for (const { endpoint, pages } of sources) {
    await fetchPaged(endpoint, pages, (results) => {
      for (const item of results) addMediaItem(movieEntries, 'movie', item);
    });
  }
}

async function collectTv() {
  const sources = [
    { endpoint: '/tv/popular', pages: 20 },
    { endpoint: '/tv/top_rated', pages: 15 },
    { endpoint: '/tv/on_the_air', pages: 8 },
    { endpoint: '/tv/airing_today', pages: 5 },
    { endpoint: '/trending/tv/week', pages: 5 },
    { endpoint: '/trending/tv/day', pages: 3 },
    { endpoint: '/discover/tv?sort_by=vote_count.desc&vote_count.gte=200', pages: 10 },
    { endpoint: '/discover/tv?with_original_language=ko&sort_by=popularity.desc', pages: 10 },
  ];

  for (const { endpoint, pages } of sources) {
    await fetchPaged(endpoint, pages, (results) => {
      for (const item of results) {
        if (isAnimeTv(item)) {
          addMediaItem(animeEntries, 'tv', item, { pathType: 'anime', priority: '0.75' });
        } else {
          addMediaItem(tvEntries, 'tv', item);
        }
      }
    });
  }
}

async function collectAnime() {
  const sources = [
    { endpoint: '/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc', pages: 20 },
    { endpoint: '/discover/tv?with_genres=16&sort_by=popularity.desc', pages: 10 },
  ];

  for (const { endpoint, pages } of sources) {
    await fetchPaged(endpoint, pages, (results) => {
      for (const item of results) {
        addMediaItem(animeEntries, 'tv', item, { pathType: 'anime', priority: '0.75' });
      }
    });
  }
}

async function collectTrending() {
  const sources = [
    { endpoint: '/trending/all/day', pages: 5 },
    { endpoint: '/trending/all/week', pages: 5 },
  ];

  for (const { endpoint, pages } of sources) {
    await fetchPaged(endpoint, pages, (results) => {
      for (const item of results) {
        const type = item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : null;
        if (!type) continue;

        const pathType =
          type === 'tv' && isAnimeTv(item) ? 'anime' : type === 'movie' ? 'movie' : 'tv';

        addMediaItem(trendingEntries, type, item, {
          pathType,
          changefreq: 'daily',
          priority: '0.85',
        });
      }
    });
  }
}

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/browse', priority: '0.95', changefreq: 'daily' },
  { path: '/movies', priority: '0.95', changefreq: 'daily' },
  { path: '/tv-shows', priority: '0.95', changefreq: 'daily' },
  { path: '/new-popular', priority: '0.9', changefreq: 'daily' },
  { path: '/trending', priority: '0.9', changefreq: 'daily' },
  { path: '/top-rated', priority: '0.9', changefreq: 'daily' },
  { path: '/comedy-movies', priority: '0.88', changefreq: 'daily' },
  { path: '/action-movies', priority: '0.88', changefreq: 'daily' },
  { path: '/horror-movies', priority: '0.88', changefreq: 'daily' },
  { path: '/anime', priority: '0.9', changefreq: 'daily' },
  { path: '/korean-drama', priority: '0.88', changefreq: 'daily' },
  { path: '/hindi-movies', priority: '0.88', changefreq: 'daily' },
  { path: '/sci-fi-movies', priority: '0.88', changefreq: 'daily' },
  { path: '/disclaimer', priority: '0.4', changefreq: 'monthly' },
  { path: '/what-is-moonflix', priority: '0.5', changefreq: 'monthly' },
];

function buildUrlset(entries, includeImages = false) {
  const imageNsDecl = includeImages
    ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
    : '';

  const body = entries
    .sort((a, b) => a.loc.localeCompare(b.loc))
    .map((entry) => {
      const imageBlock =
        includeImages && entry.image
          ? `
    <image:image>
      <image:loc>${escapeXml(entry.image)}</image:loc>
      <image:title>${escapeXml(entry.imageTitle || '')}</image:title>
    </image:image>`
          : '';

      return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${imageBlock}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageNsDecl}>
${body}
</urlset>
`;
}

function buildSitemapIndex(files) {
  const body = files
    .map(
      (file) => `  <sitemap>
    <loc>${escapeXml(`${SITE_URL}/sitemaps/${file}`)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

function chunkEntries(entries, prefix) {
  const chunks = [];
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    chunks.push({
      filename: entries.length <= CHUNK_SIZE ? `${prefix}.xml` : `${prefix}-${String(Math.floor(i / CHUNK_SIZE) + 1).padStart(3, '0')}.xml`,
      entries: entries.slice(i, i + CHUNK_SIZE),
    });
  }
  return chunks;
}

function writeSitemapFile(filename, xml) {
  const outPath = path.join(sitemapsDir, filename);
  fs.writeFileSync(outPath, xml, 'utf8');
  return filename;
}

console.log('Generating indexable sitemap index + child sitemaps…');

fs.mkdirSync(sitemapsDir, { recursive: true });

console.log('  → movies…');
await collectMovies();
console.log('  → tv…');
await collectTv();
console.log('  → anime…');
await collectAnime();
console.log('  → trending…');
await collectTrending();

const staticEntries = STATIC_PAGES.map((page) => ({
  loc: `${SITE_URL}${page.path}`,
  lastmod: today,
  changefreq: page.changefreq,
  priority: page.priority,
}));

const childFiles = [];
childFiles.push(writeSitemapFile('static.xml', buildUrlset(staticEntries)));

for (const chunk of chunkEntries([...movieEntries.values()], 'movies')) {
  childFiles.push(writeSitemapFile(chunk.filename, buildUrlset(chunk.entries, true)));
}

for (const chunk of chunkEntries([...tvEntries.values()], 'tv')) {
  childFiles.push(writeSitemapFile(chunk.filename, buildUrlset(chunk.entries, true)));
}

for (const chunk of chunkEntries([...animeEntries.values()], 'anime')) {
  childFiles.push(writeSitemapFile(chunk.filename, buildUrlset(chunk.entries, true)));
}

childFiles.push(
  writeSitemapFile('trending.xml', buildUrlset([...trendingEntries.values()], true))
);

const indexXml = buildSitemapIndex(childFiles);
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml, 'utf8');

const totalUrls =
  staticEntries.length +
  movieEntries.size +
  tvEntries.size +
  animeEntries.size +
  trendingEntries.size;

console.log('');
console.log(`Sitemap index : ${path.join(publicDir, 'sitemap.xml')}`);
console.log(`Child sitemaps: ${childFiles.length} files in public/sitemaps/`);
console.log(`Total URLs    : ${totalUrls}`);
console.log(`  static      : ${staticEntries.length}`);
console.log(`  movies      : ${movieEntries.size}`);
console.log(`  tv          : ${tvEntries.size}`);
console.log(`  anime       : ${animeEntries.size}`);
console.log(`  trending    : ${trendingEntries.size}`);
console.log(`TMDB requests : ${requestCount}`);

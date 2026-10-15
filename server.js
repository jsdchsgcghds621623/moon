import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import './load-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || process.env.API_PORT || 8080);
const TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = join(CACHE_DIR, 'recommendations.json');
const DIST_DIR = resolve(__dirname, 'dist');

const tmdbApiKey = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || '';
let cache = {};

const loadCache = async () => {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      cache = parsed;
    }
  } catch {
    cache = {};
  }
};

const saveCache = async () => {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
};

const getRecommendations = async (mediaType, id) => {
  const key = `${mediaType}:${id}`;
  const now = Date.now();
  const entry = cache[key];

  if (entry && entry.expiresAt > now) {
    return { data: entry.data, fromCache: true };
  }

  if (!tmdbApiKey) {
    throw new Error('TMDB API key is not configured.');
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/${mediaType}/${id}/recommendations?language=en-US&page=1&api_key=${tmdbApiKey}`
  );

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  const payload = await response.json();
  cache[key] = {
    data: payload,
    expiresAt: now + TTL_MS,
    updatedAt: now,
  };
  await saveCache();

  return { data: payload, fromCache: false };
};

const serveFrontend = async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;

    if (filePath.startsWith('/api/')) {
      return false;
    }

    if (filePath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return true;
    }

    const normalizedPath = filePath.replace(/^\/+/, '');
    const candidatePath = resolve(DIST_DIR, normalizedPath);

    let finalPath = candidatePath;
    try {
      const stats = await stat(finalPath);
      if (stats.isDirectory()) {
        finalPath = resolve(DIST_DIR, normalizedPath, 'index.html');
      }
    } catch {
      if (!extname(candidatePath)) {
        finalPath = resolve(DIST_DIR, normalizedPath, 'index.html');
      }
    }

    try {
      await stat(finalPath);
      const ext = extname(finalPath).toLowerCase();
      const contentType = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.ico': 'image/x-icon',
      }[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      createReadStream(finalPath).pipe(res);
      return true;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Not Found</h1>');
      return true;
    }
  } catch (error) {
    console.error('Frontend serve error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
    return true;
  }
};

const startServer = async () => {
  await loadCache();

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);

      if (url.pathname === '/api/recommendations') {
        const mediaType = url.searchParams.get('mediaType');
        const id = url.searchParams.get('id');
        const page = url.searchParams.get('page') || '1';

        if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'mediaType must be movie or tv' }));
          return;
        }

        if (!id || Number.isNaN(Number(id))) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'id must be a valid number' }));
          return;
        }

        const { data, fromCache } = await getRecommendations(mediaType, Number(id));
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        });
        res.end(JSON.stringify({ ...data, fromCache, page: Number(page) }));
        return;
      }

      const served = await serveFrontend(req, res);
      if (!served) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
};

startServer();

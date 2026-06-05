import http from 'http';
import https from 'https';
import url from 'url';
import fs from 'fs';
import path from 'path';

const PORT = 5001;
const API_TOKEN = '82f9520d915e75bbe1df1c93'; // StreamP2P API token
const API_BASE = 'https://streamp2p.com/api/v1/video/manage';

// Store likes in memory
const likesFile = path.join(process.cwd(), 'likes.json');
let likeCounts = {};

// Load existing likes
if (fs.existsSync(likesFile)) {
  try {
    likeCounts = JSON.parse(fs.readFileSync(likesFile, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to load likes.json:', err.message);
    likeCounts = {};
  }
}

// Save likes to file
function saveLikes() {
  fs.writeFileSync(likesFile, JSON.stringify(likeCounts), 'utf8');
}

// Handle like request
function handleLikeRequest(req, res, movieId) {
  if (!movieId) {
    res.writeHead(400, corsHeaders);
    res.end(JSON.stringify({ error: 'Missing movieId' }));
    return;
  }

  likeCounts[movieId] = (likeCounts[movieId] || 0) + 1;
  saveLikes();

  res.writeHead(200, corsHeaders);
  res.end(JSON.stringify({ movieId, likes: likeCounts[movieId] }));
}

// Handle get likes request
function handleGetLikes(req, res, movieId) {
  if (!movieId) {
    res.writeHead(400, corsHeaders);
    res.end(JSON.stringify({ error: 'Missing movieId' }));
    return;
  }

  res.writeHead(200, corsHeaders);
  res.end(JSON.stringify({ movieId, likes: likeCounts[movieId] || 0 }));
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

const extractSeasonEpisode = (name = '') => {
  const match = name.toLowerCase().match(/s(\d{1,2})[.\- ]?e(\d{1,2})/);
  if (match) {
    return {
      season: match[1].padStart(2, '0'),
      episode: match[2].padStart(2, '0'),
    };
  }
  return { season: null, episode: null };
};

const parseSlugParts = (slug = '') => {
  const parts = slug.toLowerCase().split('/');
  const title = parts[0]?.replace(/-/g, ' ') || '';

  const seasonMatch = slug.match(/season-?(\d+)/i);
  const episodeMatch = slug.match(/episode-?(\d+)/i);

  const season = seasonMatch ? seasonMatch[1].padStart(2, '0') : null;
  const episode = episodeMatch ? episodeMatch[1].padStart(2, '0') : null;

  return { title, season, episode };
};

const server = http.createServer((req, res) => {
  console.log(`🔵 Request: [${req.method}] ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🟢 StreamP2P Proxy Server Running');
    return;
  }

  // Debug logging for likes endpoints
  console.log(`🔍 Checking route: ${parsedUrl.pathname}, Method: ${req.method}`);

  if (parsedUrl.pathname === '/api/movie/like' && req.method === 'POST') {
    console.log('✅ Matched POST /api/movie/like route');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📨 Like request data:', data);
        handleLikeRequest(req, res, data.movieId);
      } catch (err) {
        console.error('❌ JSON parse error:', err);
        res.writeHead(400, corsHeaders);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (parsedUrl.pathname === '/api/movie/likes' && req.method === 'GET') {
    console.log('✅ Matched GET /api/movie/likes route');
    const movieId = parsedUrl.query.movieId;
    console.log('📨 Get likes for movieId:', movieId);
    handleGetLikes(req, res, movieId);
    return;
  }

  if (parsedUrl.pathname === '/api/stream/match') {
    const slug = parsedUrl.query.slug || '';
    const tmdbId = parsedUrl.query.tmdbId || null;
    const { title, season, episode } = parseSlugParts(slug);

    const searchPath = `/api/v1/video/manage?page=1&perPage=200&search=${encodeURIComponent(title)}`;
    console.log(`➡️ Slug: "${slug}" → "${title}" S${season || 'null'}E${episode || 'null'}, TMDB: ${tmdbId}`);

    const options = {
      hostname: 'streamp2p.com',
      path: searchPath,
      method: 'GET',
      headers: {
        'api-token': API_TOKEN,
        'User-Agent': 'MoonflixProxy/1.0'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let body = '';

      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        try {
          const result = JSON.parse(body);
          const all = result.data || [];
          const normalizedSlug = normalize(title);

          const match = all.find(item => {
            const filename = item.name.toLowerCase();
            const { season: fileSeason, episode: fileEpisode } = extractSeasonEpisode(filename);
            const normalizedFilename = normalize(filename);

            const hasTMDB = tmdbId && filename.includes(`{${tmdbId}}`);
            const seasonMatch = season && fileSeason && season === fileSeason;
            const episodeMatch = episode && fileEpisode && episode === fileEpisode;

            // ✅ Primary: TMDB match + season + episode
            if (hasTMDB && season && episode) {
              return seasonMatch && episodeMatch;
            }

            // 🟡 Fallback: fuzzy title match + optional S/E
            const titleMatch = normalizedFilename.includes(normalizedSlug);
            return titleMatch && (!season || seasonMatch) && (!episode || episodeMatch);
          });

          if (match) {
            console.log(`✅ Matched: ${match.name}`);

            // Build download URL
            const downloadUrl = `https://moonflix.p2pplay.pro/#${match.id}&dl=1`;

            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify({
              data: [{
                ...match,
                downloadUrl
              }]
            }));
          } else {
            console.warn('⚠️ No accurate match found');
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify({ data: [] }));
          }
        } catch (err) {
          console.error('❌ JSON parse error:', err.message);
          res.writeHead(500, corsHeaders);
          res.end(JSON.stringify({ error: 'Parse error', details: err.message }));
        }
      });
    });

    proxyReq.on('error', (err) => {
      console.error('❌ Proxy error:', err.message);
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ error: 'Proxy failed', details: err.message }));
    });

    proxyReq.end();
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
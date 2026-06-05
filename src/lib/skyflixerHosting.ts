export const SKYFLIXER_VIDEOHOSTING_API =
  import.meta.env.VITE_SKYFLIXER_VIDEOHOSTING_API ?? '';

export type SkyflixerServerEntry = {
  hostName?: string;
  available?: boolean;
  embedUrl?: string;
  downloadUrl?: string;
  source?: string;
};

export type SkyflixerServers = Record<string, SkyflixerServerEntry | undefined>;

const PRIMARY_ORDER = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'] as const;

/** Same priority as Smart Player — these are the only CDN entries that expose `downloadUrl`. */
export function getBestPrimaryDownloadUrl(
  servers: SkyflixerServers | undefined | null
): string | null {
  if (!servers) return null;
  for (const key of PRIMARY_ORDER) {
    const s = servers[key];
    if (s?.available && s.downloadUrl) return s.downloadUrl;
  }
  return null;
}

export type VideohostingRequest = {
  title: string;
  year: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
};

export async function fetchSkyflixerVideohosting(
  params: VideohostingRequest
): Promise<unknown> {
  const body = {
    title: params.title,
    year: params.year,
    type: params.mediaType === 'tv' ? 'series' : 'movie',
    tmdbId: String(params.tmdbId),
    ...(params.mediaType === 'tv'
      ? { season: params.season, episode: params.episode }
      : {}),
  };

  const res = await fetch(SKYFLIXER_VIDEOHOSTING_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Skyflixer API error: ${res.status}`);
  }

  return res.json();
}

export function extractServersFromVideohostingResponse(
  data: unknown
): SkyflixerServers | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, unknown>;
  if (o.servers && typeof o.servers === 'object') {
    return o.servers as SkyflixerServers;
  }
  const inner = o.data as Record<string, unknown> | undefined;
  if (inner?.servers && typeof inner.servers === 'object') {
    return inner.servers as SkyflixerServers;
  }
  const result = o.result as Record<string, unknown> | undefined;
  if (result?.servers && typeof result.servers === 'object') {
    return result.servers as SkyflixerServers;
  }
  return undefined;
}

export async function resolveSkyflixerDownloadUrl(
  params: VideohostingRequest
): Promise<string> {
  const data = await fetchSkyflixerVideohosting(params);
  const servers = extractServersFromVideohostingResponse(data);
  const url = getBestPrimaryDownloadUrl(servers);
  if (!url) {
    throw new Error('No download link Available');
  }
  return url;
}

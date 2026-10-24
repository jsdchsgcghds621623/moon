/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROFILE?: string;
  readonly VITE_TMDB_API_KEY?: string;
  readonly VITE_LOCAL_STREAM_API_URL?: string;
  readonly VITE_LOCAL_STREAM_DECRYPT_API_KEY?: string;
  readonly VITE_SKYFLIXER_VIDEOHOSTING_API?: string;
  readonly VITE_YANDEX_METRIKA_ID?: string;
  readonly VITE_CONTENT_REQUEST_API_URL?: string;
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
  readonly VITE_ACZONE_ZONE_ID?: string;
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string;
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Yandex Metrica tag (loaded via external script). */
interface Window {
  ym?: (...args: unknown[]) => void;
  heap?: {
    identify: (identity: string) => void;
    addUserProperties?: (properties: Record<string, unknown>) => void;
    onReady?: (callback: () => void) => void;
  };
  heapReadyCb?: Array<{ name: string; fn: () => void }>;
}

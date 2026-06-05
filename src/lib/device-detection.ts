const TV_UA_KEYWORDS = [
  'smart-tv',
  'smarttv',
  'television',
  'tizen',
  'webos',
  'roku',
  'appletv',
  'chromecast',
  'androidtv',
  'googletv',
  'firetv',
  'viera',
  'netcast',
  'bravia',
  'hbbtv',
  'nettv',
  'philipstv',
  'sonydtv',
];

export const MOBILE_BREAKPOINT = 768;
export const TABLET_MAX_BREAKPOINT = 1024;

/** TV detection via user-agent only (avoids false positives on desktop 1080p). */
export function detectTVFromUA(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return TV_UA_KEYWORDS.some((keyword) => ua.includes(keyword));
}

export function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

export function detectCoarsePointerNoHover(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    !window.matchMedia('(hover: hover)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function getViewportWidth(): number {
  if (typeof window === 'undefined') return 1024;
  return window.innerWidth;
}

export function isMobileWidth(width: number): boolean {
  return width < MOBILE_BREAKPOINT;
}

export function isTabletWidth(width: number): boolean {
  return width >= MOBILE_BREAKPOINT && width < TABLET_MAX_BREAKPOINT;
}

/** Module-level flags synced by DeviceProvider for non-React consumers (e.g. getImageUrl). */
let runtimeFlags = {
  isTV: false,
  isMobile: false,
  isTablet: false,
  isTouch: false,
};

export function setRuntimeDeviceFlags(flags: Partial<typeof runtimeFlags>) {
  runtimeFlags = { ...runtimeFlags, ...flags };
}

export function getRuntimeDeviceFlags() {
  return runtimeFlags;
}

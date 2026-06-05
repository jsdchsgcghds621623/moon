interface HeapProfile {
  id: string;
  name: string;
}

interface HeapClient {
  identify: (identity: string) => void;
  addUserProperties?: (properties: Record<string, unknown>) => void;
  onReady?: (callback: () => void) => void;
}

export function getActiveProfile(): HeapProfile | null {
  try {
    const raw = localStorage.getItem('moonflix_active_profile');
    if (!raw) return null;

    const profile = JSON.parse(raw) as Partial<HeapProfile>;
    if (typeof profile.id === 'string' && profile.id.length > 0) {
      return {
        id: profile.id,
        name: typeof profile.name === 'string' ? profile.name : '',
      };
    }
  } catch {
    /* ignore malformed profile data */
  }

  return null;
}

function runWhenHeapReady(callback: () => void) {
  const heap = (window as Window & { heap?: HeapClient }).heap;
  if (heap?.onReady) {
    heap.onReady(callback);
    return;
  }

  callback();
}

/** Attach a stable user identity in Heap for cross-session tracking. */
export function identifyHeapUser(identity: string, properties?: Record<string, unknown>) {
  if (!identity) return;

  runWhenHeapReady(() => {
    const heap = (window as Window & { heap?: HeapClient }).heap;
    heap?.identify?.(identity);

    if (properties && heap?.addUserProperties) {
      heap.addUserProperties(properties);
    }
  });
}

/** Identify the current profile when one is active (e.g. on app launch). */
export function syncHeapIdentity() {
  const profile = getActiveProfile();
  if (!profile) return;

  identifyHeapUser(profile.id, { profile_name: profile.name });
}

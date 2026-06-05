import * as React from 'react';
import { Movie, TVShow } from '@/lib/tmdb';

type SearchHandler = (query: string) => void;
type MediaHandler = (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;

export interface NavbarSearchActions {
  onPlay?: MediaHandler;
  onMoreInfo?: MediaHandler;
}

interface NavbarSearchContextValue {
  registerHandler: (handler: SearchHandler | undefined) => void;
  notifySearch: (query: string) => void;
  registerActions: (actions: NavbarSearchActions | undefined) => void;
  onPlay?: MediaHandler;
  onMoreInfo?: MediaHandler;
}

const NavbarSearchContext = React.createContext<NavbarSearchContextValue | null>(null);

export function NavbarSearchProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = React.useRef<SearchHandler | undefined>(undefined);
  const [actions, setActions] = React.useState<NavbarSearchActions>({});

  const registerHandler = React.useCallback((handler: SearchHandler | undefined) => {
    handlerRef.current = handler;
  }, []);

  const registerActions = React.useCallback((next: NavbarSearchActions | undefined) => {
    setActions(next ?? {});
  }, []);

  const notifySearch = React.useCallback((query: string) => {
    handlerRef.current?.(query);
  }, []);

  const value = React.useMemo(
    () => ({
      registerHandler,
      notifySearch,
      registerActions,
      onPlay: actions.onPlay,
      onMoreInfo: actions.onMoreInfo,
    }),
    [registerHandler, notifySearch, registerActions, actions]
  );

  return (
    <NavbarSearchContext.Provider value={value}>
      {children}
    </NavbarSearchContext.Provider>
  );
}

export function useNavbarSearchRegistry() {
  const ctx = React.useContext(NavbarSearchContext);
  if (!ctx) {
    throw new Error('useNavbarSearchRegistry must be used within NavbarSearchProvider');
  }
  return ctx;
}

/** Pages call this to wire navbar search input to local state (e.g. Index browse search). */
export function useRegisterNavbarSearch(handler: SearchHandler) {
  const { registerHandler } = useNavbarSearchRegistry();
  React.useEffect(() => {
    registerHandler(handler);
    return () => registerHandler(undefined);
  }, [handler, registerHandler]);
}

/** Register play / more-info handlers for navbar suggestion dropdown. */
export function useRegisterNavbarSearchActions(actions: NavbarSearchActions) {
  const { registerActions } = useNavbarSearchRegistry();
  React.useEffect(() => {
    registerActions(actions);
    return () => registerActions(undefined);
  }, [actions, registerActions]);
}

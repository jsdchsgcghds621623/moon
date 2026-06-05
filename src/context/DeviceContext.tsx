import * as React from 'react';
import {
  detectCoarsePointerNoHover,
  detectTouchDevice,
  detectTVFromUA,
  getViewportWidth,
  isMobileWidth,
  isTabletWidth,
  setRuntimeDeviceFlags,
} from '@/lib/device-detection';

export interface DeviceContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  isTV: boolean;
  /** Show carousel arrows without hover (touch, TV, tablet, coarse pointer). */
  showCarouselControls: boolean;
}

const DeviceContext = React.createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DeviceContextValue>(() => ({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    isTV: false,
    showCarouselControls: false,
  }));

  React.useEffect(() => {
    const update = () => {
      const width = getViewportWidth();
      const isMobile = isMobileWidth(width);
      const isTablet = isTabletWidth(width);
      const isTouch = detectTouchDevice();
      const isTV = detectTVFromUA();
      const showCarouselControls =
        isTouch || isTV || isTablet || detectCoarsePointerNoHover();

      const next: DeviceContextValue = {
        isMobile,
        isTablet,
        isTouch,
        isTV,
        showCarouselControls,
      };

      setState(next);
      setRuntimeDeviceFlags({
        isTV,
        isMobile,
        isTablet,
        isTouch,
      });
    };

    update();

    const widthMql = window.matchMedia('(max-width: 1023px)');
    const mobileMql = window.matchMedia('(max-width: 767px)');
    const coarseMql = window.matchMedia('(pointer: coarse)');
    const hoverMql = window.matchMedia('(hover: none)');

    widthMql.addEventListener('change', update);
    mobileMql.addEventListener('change', update);
    coarseMql.addEventListener('change', update);
    hoverMql.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      widthMql.removeEventListener('change', update);
      mobileMql.removeEventListener('change', update);
      coarseMql.removeEventListener('change', update);
      hoverMql.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <DeviceContext.Provider value={state}>{children}</DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextValue {
  const ctx = React.useContext(DeviceContext);
  if (!ctx) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return ctx;
}

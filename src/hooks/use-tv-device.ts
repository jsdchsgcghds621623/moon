import { useState, useEffect } from 'react';
import { detectTVFromUA } from '@/lib/device-detection';

/** @deprecated Prefer useDevice() from DeviceContext */
export function useIsTVDevice() {
  const [isTVDevice, setIsTVDevice] = useState(false);

  useEffect(() => {
    setIsTVDevice(detectTVFromUA());
  }, []);

  return isTVDevice;
}

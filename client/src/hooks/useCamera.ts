import { useCallback, useEffect, useState } from 'react';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

interface UseCameraResult {
  devices: CameraDevice[];
  refreshDevices: () => Promise<void>;
  permission: 'idle' | 'granted' | 'denied';
  requestPermission: () => Promise<boolean>;
}

/** Enumerates available video input devices and handles permission state. */
export function useCamera(): UseCameraResult {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');

  const refreshDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    const cams = all
      .filter((d) => d.kind === 'videoinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${i + 1}`,
      }));
    setDevices(cams);
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission('granted');
      await refreshDevices();
      return true;
    } catch {
      setPermission('denied');
      return false;
    }
  }, [refreshDevices]);

  useEffect(() => {
    void refreshDevices();
    const handler = () => void refreshDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', handler);
  }, [refreshDevices]);

  return { devices, refreshDevices, permission, requestPermission };
}

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

interface QrCameraScannerProps {
  onScan: (decodedText: string) => void;
  paused: boolean;
}

export default function QrCameraScanner({ onScan, paused }: QrCameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'gate-qr-camera';
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // already stopped
      }
      scannerRef.current = null;
    }
    setActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (scannerRef.current) return;
    setError('');
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decoded) => {
          if (paused) return;
          scanner.pause(true);
          onScanRef.current(decoded);
        },
        () => {}
      );
      setActive(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not access camera. Allow camera permission and try again.'
      );
      setActive(false);
      scannerRef.current = null;
    }
  }, [paused]);

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!paused && scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch {
        // not paused
      }
    }
  }, [paused]);

  return (
    <div className="space-y-3">
      <div
        id={containerId}
        className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-indigo-500/30 bg-black min-h-[280px]"
      />
      {error && (
        <div className="space-y-2 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button type="button" onClick={startCamera} className="btn-primary text-sm">
            <Camera className="h-4 w-4" /> Retry Camera
          </button>
        </div>
      )}
      {active && (
        <div className="flex justify-center">
          <button type="button" onClick={stopCamera} className="btn-secondary text-sm">
            <CameraOff className="h-4 w-4" /> Stop Camera
          </button>
        </div>
      )}
    </div>
  );
}

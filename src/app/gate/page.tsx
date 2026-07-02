'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ScanLine,
  Wifi,
  WifiOff,
  LogOut,
  CheckCircle,
  XCircle,
  User,
  Keyboard,
} from 'lucide-react';

const QrCameraScanner = dynamic(() => import('@/components/QrCameraScanner'), { ssr: false });

interface ScanResult {
  success: boolean;
  error?: string;
  code?: string;
  ticket?: {
    ticketUid: string;
    entryCode?: string;
    name: string;
    rollNo: string;
    affiliation: string;
    accommodationType: string;
  };
}

interface CachedTicket {
  ticketUid: string;
  entryCode: string;
  qrSignature: string;
  name: string;
  rollNo: string;
}

export default function GateScannerPage() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanPaused, setScanPaused] = useState(false);
  const [entryCode, setEntryCode] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [cache, setCache] = useState<CachedTicket[]>([]);
  const [lastSync, setLastSync] = useState<string>('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const inputRef = useRef<HTMLInputElement>(null);

  const syncCache = useCallback(async () => {
    try {
      const res = await fetch('/api/gate/scan');
      if (res.status === 401) {
        router.push('/gate/login');
        return;
      }
      const data = await res.json();
      setCache(data.tickets);
      setLastSync(data.syncedAt);
      localStorage.setItem('gate_ticket_cache', JSON.stringify(data.tickets));
      localStorage.setItem('gate_cache_sync', data.syncedAt);
      setOnline(true);
    } catch {
      setOnline(false);
      const cached = localStorage.getItem('gate_ticket_cache');
      if (cached) setCache(JSON.parse(cached));
      const sync = localStorage.getItem('gate_cache_sync');
      if (sync) setLastSync(sync);
    }
  }, [router]);

  useEffect(() => {
    syncCache();
    const interval = setInterval(syncCache, 60000);
    const handleOnline = () => { setOnline(true); syncCache(); };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnline(navigator.onLine);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncCache]);

  const handleScan = useCallback(async (qrToken: string) => {
    setScanning(true);
    setResult(null);
    setScanPaused(true);

    if (!online) {
      const cached = cache.find((t) => t.qrSignature === qrToken);
      if (cached) {
        setResult({
          success: true,
          ticket: {
            ticketUid: cached.ticketUid,
            entryCode: cached.entryCode,
            name: cached.name,
            rollNo: cached.rollNo,
            affiliation: '',
            accommodationType: '',
          },
        });
      } else {
        setResult({ success: false, error: 'Ticket not in offline cache', code: 'OFFLINE_MISS' });
      }
      setScanning(false);
      return;
    }

    const res = await fetch('/api/gate/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken, offline: false }),
    });
    const data = await res.json();
    setResult(data);
    setScanning(false);
    if (data.success) syncCache();
  }, [online, cache, syncCache]);

  async function handleManualOverride() {
    setScanning(true);
    const res = await fetch('/api/gate/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'manual_override',
        entryCode: entryCode.toUpperCase(),
        reason: overrideReason,
      }),
    });
    const data = await res.json();
    setResult(
      data.success
        ? {
            success: true,
            ticket: {
              ticketUid: '',
              entryCode: data.entryCode,
              name: data.name,
              rollNo: data.rollNo,
              affiliation: '',
              accommodationType: '',
            },
          }
        : { success: false, error: data.error, code: data.code }
    );
    setScanning(false);
    setEntryCode('');
    setOverrideReason('');
    setScanPaused(true);
    if (data.success) syncCache();
  }

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/gate/login');
  }

  function handleScanNext() {
    setResult(null);
    setScanPaused(false);
    inputRef.current?.focus();
  }

  function handleQrInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const value = (e.target as HTMLInputElement).value.trim();
      if (value) {
        handleScan(value);
        (e.target as HTMLInputElement).value = '';
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-indigo-400" />
            <span className="font-bold text-white">Gate Scanner</span>
          </div>
          <div className="flex items-center gap-3">
            {online ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Wifi className="h-3 w-3" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            )}
            <button onClick={handleLogout} className="text-slate-400 hover:text-white">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-4 flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              mode === 'camera' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Camera Scan
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              mode === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Manual ID
          </button>
        </div>

        {mode === 'camera' ? (
          <div className="card mb-6 p-4">
            <p className="mb-3 text-center text-sm text-slate-400">
              Point camera at the ticket QR code
            </p>
            <QrCameraScanner onScan={handleScan} paused={scanPaused || scanning} />
            {scanning && <p className="mt-3 text-center text-indigo-300">Verifying...</p>}
            <div className="mt-4 border-t border-slate-700 pt-4">
              <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
                <Keyboard className="h-3 w-3" /> Hardware scanner fallback
              </p>
              <input
                ref={inputRef}
                className="input text-center font-mono text-sm"
                placeholder="Or paste QR token here..."
                onKeyDown={handleQrInput}
              />
            </div>
          </div>
        ) : (
          <div className="card mb-6 p-6">
            <p className="mb-4 text-sm text-slate-400">
              Enter the unique Ticket ID printed on the pass (e.g. CS26-7K4M2P)
            </p>
            <div className="space-y-3">
              <input
                className="input text-center font-mono text-lg uppercase tracking-widest"
                placeholder="CS26-XXXXXX"
                value={entryCode}
                onChange={(e) => setEntryCode(e.target.value.toUpperCase())}
              />
              <textarea
                className="input min-h-[80px]"
                placeholder="Reason for manual entry (required)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
              <button
                onClick={handleManualOverride}
                disabled={entryCode.length < 10 || overrideReason.length < 10 || scanning}
                className="btn-primary w-full"
              >
                Verify Ticket ID
              </button>
            </div>
          </div>
        )}

        {result && (
          <div
            className={`card mb-6 p-6 text-center ${
              result.success ? 'border-emerald-500/50' : 'border-red-500/50'
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle className="mx-auto mb-3 h-16 w-16 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-300">ENTRY GRANTED</h2>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <User className="h-8 w-8 text-slate-400" />
                  <div className="text-left">
                    <p className="text-lg font-semibold text-white">{result.ticket?.name}</p>
                    <p className="text-slate-400">{result.ticket?.rollNo}</p>
                    {result.ticket?.entryCode && (
                      <p className="font-mono text-xs text-cyan-400">{result.ticket.entryCode}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <XCircle className="mx-auto mb-3 h-16 w-16 text-red-400" />
                <h2 className="text-xl font-bold text-red-300">ENTRY DENIED</h2>
                <p className="mt-2 text-red-200">{result.error}</p>
                {result.code && <p className="mt-1 text-xs text-slate-500">{result.code}</p>}
              </>
            )}
            <button onClick={handleScanNext} className="btn-secondary mt-4">
              Scan Next
            </button>
          </div>
        )}

        {mode === 'camera' && (
          <button
            onClick={() => setMode('manual')}
            className="card w-full p-3 text-sm text-slate-400 hover:text-white"
          >
            QR not working? Use Manual Ticket ID →
          </button>
        )}

        <div className="mt-4 text-center text-xs text-slate-600">
          {cache.length} tickets cached · Last sync:{' '}
          {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}
        </div>

        <Link href="/admin/dashboard" className="mt-4 block text-center text-sm text-slate-500 hover:text-white">
          Admin Dashboard
        </Link>
      </main>
    </div>
  );
}

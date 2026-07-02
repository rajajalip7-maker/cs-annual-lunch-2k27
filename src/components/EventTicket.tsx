'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { EVENT } from '@/lib/event';

interface EventTicketProps {
  name: string;
  rollNo: string;
  ticketUid: string;
  entryCode: string;
  accommodationType: string;
  qrDataUrl: string;
  downloadUrl?: string;
  showDownload?: boolean;
}

export default function EventTicket({
  name,
  rollNo,
  ticketUid,
  entryCode,
  accommodationType,
  qrDataUrl,
  downloadUrl,
  showDownload = true,
}: EventTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [bgSrc, setBgSrc] = useState<string>(EVENT.backgroundFallback);
  const typeLabel = accommodationType === 'hostellite' ? 'Hostellite' : 'Day Scholar';

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgSrc(EVENT.backgroundImage);
    img.onerror = () => setBgSrc(EVENT.backgroundFallback);
    img.src = EVENT.backgroundImage;
  }, []);

  async function handleDownload() {
    if (downloadUrl) {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${rollNo}.png`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ticketRef}
        className="relative w-full max-w-[360px] overflow-hidden rounded-3xl border-2 border-indigo-500/40 shadow-2xl"
        style={{ aspectRatio: '2/3' }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgSrc})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-indigo-950/85 to-slate-900/95" />

        {/* Accent bar */}
        <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-400" />

        <div className="relative flex h-full flex-col p-5 text-white">
          {/* Header */}
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              {EVENT.subtitle}
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{EVENT.name}</h2>
            <p className="mt-0.5 text-[11px] text-indigo-300">{EVENT.tagline}</p>
          </div>

          {/* Event details */}
          <div className="mt-4 rounded-xl border border-slate-600/50 bg-slate-900/50 p-3 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-500">Date</p>
                <p className="mt-0.5 font-semibold text-white">{EVENT.dateShort}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-500">Day</p>
                <p className="mt-0.5 font-semibold text-white">{EVENT.day}</p>
              </div>
            </div>
            <div className="my-2 border-t border-slate-700/50" />
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-500">Time</p>
                <p className="mt-0.5 font-semibold text-white">{EVENT.timeRange}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-500">Venue</p>
                <p className="mt-0.5 font-semibold text-white">{EVENT.venue}</p>
                <p className="text-slate-400">{EVENT.venueDetail}</p>
              </div>
            </div>
          </div>

          {/* Attendee */}
          <div className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
              Attendee
            </p>
            <p className="mt-1 text-lg font-bold">{name}</p>
            <p className="text-sm text-indigo-200">{rollNo}</p>
            <p className="text-xs text-slate-400">{typeLabel}</p>
          </div>

          {/* QR */}
          <div className="mt-auto flex justify-center pt-3">
            <div className="rounded-xl bg-white p-2 shadow-lg">
              <img src={qrDataUrl} alt="Entry QR Code" className="h-36 w-36" />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">Ticket ID</p>
            <p className="font-mono text-sm font-bold tracking-wider text-white">{entryCode}</p>
            <p className="mt-1 font-mono text-[8px] text-slate-600">{ticketUid}</p>
            <p className="text-[9px] font-medium text-amber-400/90">Bring this ticket to the venue on event day</p>
            <p className="text-[9px] text-slate-600">Valid for one entry at the gate</p>
          </div>
        </div>
      </div>

      {showDownload && downloadUrl && (
        <button onClick={handleDownload} className="btn-primary text-sm">
          <Download className="h-4 w-4" /> Download Ticket
        </button>
      )}
    </div>
  );
}

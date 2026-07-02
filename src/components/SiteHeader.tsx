'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Terminal, ChevronDown, Settings, ScanLine } from 'lucide-react';
import { EVENT } from '@/lib/event';

const NAV = [
  { label: 'HOME', href: '/' },
  { label: 'EVENT DETAILS', href: '/event-details' },
  { label: 'SCHEDULE', href: '/schedule' },
  { label: 'FAQS', href: '/faqs' },
];

export default function SiteHeader() {
  const [staffOpen, setStaffOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <header className="relative z-20 border-b border-cyan-500/10 bg-[#050a14]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <Terminal className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wider text-white">{EVENT.department}</p>
            <p className="text-[11px] text-cyan-400/80">{EVENT.year}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-semibold tracking-widest text-slate-300 transition hover:text-cyan-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setStaffOpen(!staffOpen)}
            onBlur={() => setTimeout(() => setStaffOpen(false), 150)}
            className="flex items-center gap-2 rounded-lg border border-slate-600/50 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold tracking-wide text-white transition hover:border-cyan-500/40"
          >
            <Settings className="h-4 w-4 text-cyan-400" />
            STAFF ACCESS
            <ChevronDown className={`h-4 w-4 transition ${staffOpen ? 'rotate-180' : ''}`} />
          </button>
          {staffOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-600/50 bg-slate-900 shadow-2xl">
              <Link
                href="/admin/login"
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-cyan-400" />
                Admin Dashboard
              </Link>
              <Link
                href="/gate/login"
                className="flex items-center gap-3 border-t border-slate-700/50 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
              >
                <ScanLine className="h-4 w-4 text-cyan-400" />
                Gate Scanner View
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

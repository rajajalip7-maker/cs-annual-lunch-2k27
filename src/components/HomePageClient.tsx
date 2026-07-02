'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Ticket,
  Gift,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { EVENT, getCountdown, formatCountdown } from '@/lib/event';

export default function HomePageClient() {
  const [regCountdown, setRegCountdown] = useState('');
  const [eventCountdown, setEventCountdown] = useState('');

  useEffect(() => {
    const tick = () => {
      setRegCountdown(formatCountdown(getCountdown(EVENT.registrationClosesAt)));
      setEventCountdown(formatCountdown(getCountdown(EVENT.eventStartsAt)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050a14]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,_transparent_60%)]" />
        <div className="absolute left-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_20%_50%,_rgba(99,102,241,0.12)_0%,_transparent_50%)]" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_80%_50%,_rgba(6,182,212,0.1)_0%,_transparent_50%)]" />
        <CodeRain />
        <WireframeDecor position="left" />
        <WireframeDecor position="right" />
      </div>

      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-12 pt-20 text-center">
        <h1 className="text-3xl font-black leading-tight tracking-wide text-white md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            {EVENT.heroTitle}
          </span>
          <br />
          <span className="text-white">{EVENT.heroSubtitle}</span>
        </h1>

        <p className="mt-6 text-lg text-slate-300 md:text-xl">
          {EVENT.dateHero} | {EVENT.time}
        </p>
        <p className="mt-1 text-base text-slate-400">{EVENT.venueDetail}</p>

        <Link
          href="/register"
          className="register-btn mt-10 inline-block rounded-xl px-14 py-4 text-lg font-black tracking-widest text-black"
        >
          REGISTER NOW
        </Link>

        <p className="mt-8 font-mono text-sm tracking-wide text-slate-400">
          REGISTRATION CLOSES IN:{' '}
          <span className="text-cyan-400">{regCountdown}</span>
        </p>
      </main>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        <InfoCard icon={<Calendar className="h-5 w-5 text-cyan-400" />} title="Event Countdown:">
          <p className="font-mono text-2xl font-bold text-cyan-400 md:text-3xl">{eventCountdown}</p>
        </InfoCard>
        <InfoCard icon={<Ticket className="h-5 w-5 text-cyan-400" />} title="Ticket Details:">
          <p className="text-sm leading-relaxed text-slate-300">
            {EVENT.pricingDisplay}
            <br />
            <span className="text-cyan-400/80">Secure your spot!</span>
          </p>
        </InfoCard>
        <InfoCard icon={<Gift className="h-5 w-5 text-cyan-400" />} title="Pass Includes:">
          <p className="text-sm leading-relaxed text-slate-300">{EVENT.passIncludes}</p>
        </InfoCard>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-slate-900/40 p-5 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CodeRain() {
  const snippets = [
    'const lunch = await celebrate();',
    'import { CS } from "department";',
    'class Student extends CSFamily {}',
    'export default annualLunch2k26;',
    'async function register() { return true; }',
    'if (csStudent) joinLunch();',
  ];
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.04]">
      {snippets.map((s, i) => (
        <p
          key={i}
          className="absolute font-mono text-xs text-cyan-300"
          style={{
            left: `${(i * 17) % 90}%`,
            top: `${(i * 23) % 80}%`,
            transform: `rotate(${(i % 3) - 1}deg)`,
          }}
        >
          {s}
        </p>
      ))}
    </div>
  );
}

function WireframeDecor({ position }: { position: 'left' | 'right' }) {
  return (
    <div
      className={`absolute top-1/3 ${position === 'left' ? 'left-4 md:left-12' : 'right-4 md:right-12'} opacity-20`}
    >
      <svg width="120" height="200" viewBox="0 0 120 200" fill="none">
        <polygon points="60,10 110,60 60,110 10,60" stroke="#22d3ee" strokeWidth="1" fill="none" />
        <polygon points="60,50 90,80 60,110 30,80" stroke="#6366f1" strokeWidth="1" fill="none" />
        <line x1="60" y1="110" x2="60" y2="190" stroke="#22d3ee" strokeWidth="1" />
        <line x1="30" y1="150" x2="90" y2="150" stroke="#6366f1" strokeWidth="1" />
        <circle cx="60" cy="170" r="20" stroke="#22d3ee" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

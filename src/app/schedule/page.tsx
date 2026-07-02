import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { EVENT } from '@/lib/event';

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-[#050a14]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="mb-6 inline-block text-sm text-cyan-400 hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-white">Schedule</h1>
        <p className="mb-2 text-cyan-400">{EVENT.name}</p>
        <p className="mb-10 text-slate-400">{EVENT.date} · {EVENT.venue}</p>

        <div className="relative space-y-0">
          {EVENT.schedule.map((item, i) => (
            <div key={i} className="relative flex gap-6 pb-8">
              {i < EVENT.schedule.length - 1 && (
                <div className="absolute left-[4.5rem] top-10 h-full w-px bg-cyan-500/20" />
              )}
              <div className="w-24 shrink-0 text-right">
                <span className="font-mono text-sm font-bold text-cyan-400">{item.time}</span>
              </div>
              <div className="flex-1 rounded-xl border border-cyan-500/20 bg-slate-900/40 p-5">
                <h2 className="font-semibold text-white">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/register" className="register-btn inline-block rounded-xl px-10 py-3 font-bold text-black">
            REGISTER NOW
          </Link>
        </div>
      </main>
    </div>
  );
}

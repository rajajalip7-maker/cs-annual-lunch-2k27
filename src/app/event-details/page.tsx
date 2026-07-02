import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { EVENT } from '@/lib/event';

export default function EventDetailsPage() {
  return (
    <div className="min-h-screen bg-[#050a14]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="mb-6 inline-block text-sm text-cyan-400 hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-white">Event Details</h1>
        <p className="mb-10 text-cyan-400">{EVENT.name}</p>

        <div className="space-y-6">
          {EVENT.details.map((item) => (
            <div key={item.title} className="rounded-xl border border-cyan-500/20 bg-slate-900/40 p-6">
              <h2 className="mb-2 text-lg font-semibold text-white">{item.title}</h2>
              <p className="text-slate-300 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/register" className="register-btn inline-block rounded-xl px-10 py-3 font-bold text-black">
            REGISTER NOW
          </Link>
        </div>
      </main>
    </div>
  );
}

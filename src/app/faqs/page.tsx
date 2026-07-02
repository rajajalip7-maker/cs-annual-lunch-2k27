import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { EVENT } from '@/lib/event';

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-[#050a14]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="mb-6 inline-block text-sm text-cyan-400 hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-white">FAQs</h1>
        <p className="mb-10 text-slate-400">Frequently asked questions about {EVENT.name}</p>

        <div className="space-y-4">
          {EVENT.faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-cyan-500/20 bg-slate-900/40 p-5">
              <h2 className="font-semibold text-white">{faq.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

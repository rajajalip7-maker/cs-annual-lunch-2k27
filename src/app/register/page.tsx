import Link from 'next/link';
import { UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { EVENT } from '@/lib/event';

export default function RegisterHubPage() {
  return (
    <div className="min-h-screen bg-[#050a14]">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 py-16">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white md:text-3xl">{EVENT.name}</h1>
          <p className="mt-2 text-slate-400">Register for the annual lunch event</p>
        </div>

        <div className="mt-10 space-y-4">
          <Link
            href="/signup"
            className="card flex items-center gap-4 p-6 transition hover:border-cyan-500/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
              <UserPlus className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Sign Up</p>
              <p className="text-sm text-slate-400">New student? Create your account first</p>
            </div>
          </Link>

          <Link
            href="/login"
            className="card flex items-center gap-4 p-6 transition hover:border-indigo-500/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
              <LogIn className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Log In</p>
              <p className="text-sm text-slate-400">Already registered? Log in to check status or get your ticket</p>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          After sign up, complete your registration with payment proof. Returning students should log in — no need to sign up again.
        </p>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

export default function StudentLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollNo: form.get('rollNo'),
        password: form.get('password'),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Login failed');
      setLoading(false);
      return;
    }

    router.push(data.user.profileComplete ? '/dashboard' : '/register/complete');
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-md px-4">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="card p-8">
          <h1 className="mb-2 text-2xl font-bold text-white">Student Login</h1>
          <p className="mb-6 text-sm text-slate-400">
            Log in to check your payment status and download your ticket.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Roll Number</label>
              <input name="rollNo" required className="input" placeholder="24-CS-151" />
            </div>
            <div>
              <label className="label">Password</label>
              <PasswordInput name="password" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-cyan-400 hover:underline">Sign up</Link>
            {' · '}
            <Link href="/register" className="text-cyan-400 hover:underline">Register hub</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

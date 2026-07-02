'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get('name'),
      rollNo: form.get('rollNo'),
      email: form.get('email'),
      password: form.get('password'),
      confirmPassword: form.get('confirmPassword'),
    };

    const res = await fetch('/api/auth/student/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data: { error?: string } = {};
    try {
      data = await res.json();
    } catch {
      setError('Server error — please restart the app and try again.');
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError(data.error || 'Signup failed');
      setLoading(false);
      return;
    }

    router.push('/register/complete');
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-md px-4">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="card p-8">
          <h1 className="mb-2 text-2xl font-bold text-white">Create Account</h1>
          <p className="mb-6 text-sm text-slate-400">
            Sign up first, then complete your registration and payment.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="name" required className="input" placeholder="Ahmed Khan" />
            </div>
            <div>
              <label className="label">Roll Number</label>
              <input name="rollNo" required className="input" placeholder="24-CS-151" />
              <p className="mt-1 text-xs text-slate-500">Format: 24-CS-151 (CS can be upper or lower case)</p>
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" placeholder="you@university.edu" />
            </div>
            <div>
              <label className="label">Password</label>
              <PasswordInput name="password" required minLength={6} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <PasswordInput name="confirmPassword" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:underline">Log in</Link>
            {' · '}
            <Link href="/register" className="text-cyan-400 hover:underline">Register hub</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password'),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Login failed');
      setLoading(false);
      return;
    }

    router.push(data.admin.role === 'gate_staff' ? '/gate' : '/admin/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Staff Login</h1>
            <p className="text-sm text-slate-400">Admin & Gate Scanner access</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input name="username" className="input" required />
          </div>
          <div>
            <label className="label">Password</label>
            <PasswordInput name="password" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

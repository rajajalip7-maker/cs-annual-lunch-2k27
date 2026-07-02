'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { PAYMENT_INSTRUCTIONS, getHostelOptionsForGender } from '@/lib/validation';
import { EVENT } from '@/lib/event';

export default function RegisterCompletePage() {
  const router = useRouter();
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [accommodationType, setAccommodationType] = useState<'hostellite' | 'day_scholar'>('day_scholar');
  const [hostelName, setHostelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [user, setUser] = useState<{ name: string; rollNo: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/student/me')
      .then((r) => {
        if (r.status === 401) {
          router.push('/register');
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.payment && ['pending', 'approved', 'flagged'].includes(d.payment.status)) {
          router.push('/dashboard');
          return;
        }
        setUser(d.user);
        setAuthChecked(true);
      });
  }, [router]);

  const hostelOptions = gender ? getHostelOptionsForGender(gender) : [];

  function handleGenderChange(next: 'male' | 'female') {
    setGender(next);
    if (hostelName && !(getHostelOptionsForGender(next) as readonly string[]).includes(hostelName)) {
      setHostelName('');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('accommodationType', accommodationType);
    if (accommodationType === 'hostellite') {
      formData.set('hostelName', hostelName);
    }

    try {
      const res = await fetch('/api/register', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-2xl px-4">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="card p-8">
          <h1 className="mb-2 text-2xl font-bold text-white">{EVENT.name}</h1>
          <p className="mb-6 text-slate-400">Complete your registration and upload payment proof.</p>

          {user && (
            <div className="mb-6 rounded-lg bg-slate-800/50 p-3 text-sm">
              <p className="text-white">{user.name} · {user.rollNo}</p>
              <p className="text-slate-400">{user.email}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Mobile</label>
                <input name="mobile" required className="input" placeholder="03001234567" />
              </div>
              <div>
                <label className="label">Affiliation / Department</label>
                <input name="affiliation" required className="input" placeholder="Computer Science" defaultValue="Computer Science" />
              </div>
            </div>

            <div>
              <label className="label">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map((g) => (
                  <label
                    key={g}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-600 p-4 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/10"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      required
                      checked={gender === g}
                      onChange={() => handleGenderChange(g)}
                      className="accent-indigo-500"
                    />
                    <span className="capitalize text-white">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Are you a Day Scholar or Hostellite?</label>
              <div className="grid grid-cols-2 gap-3">
                {(['day_scholar', 'hostellite'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setAccommodationType(type);
                      if (type === 'day_scholar') setHostelName('');
                    }}
                    className={`rounded-lg border p-4 text-left transition ${
                      accommodationType === type
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium capitalize text-white">
                      {type === 'day_scholar' ? 'Day Scholar' : 'Hostellite'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {accommodationType === 'hostellite' && (
              <div>
                <label className="label">Which Hostel?</label>
                {!gender ? (
                  <p className="text-sm text-amber-300">Select your gender first to see hostel options.</p>
                ) : (
                  <select
                    name="hostelName"
                    required
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                    className="input"
                  >
                    <option value="">Select your hostel</option>
                    {hostelOptions.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="rounded-lg border border-slate-600 bg-slate-900/30 p-4">
              <h3 className="mb-2 font-medium text-white">Payment Instructions</h3>
              <div className="space-y-1 text-sm text-slate-400">
                <p>Bank: {PAYMENT_INSTRUCTIONS.bank}</p>
                <p>Account No: {PAYMENT_INSTRUCTIONS.accountNumber}</p>
                <p>Title: {PAYMENT_INSTRUCTIONS.title}</p>
                <p className="text-amber-300">Amount: PKR {PAYMENT_INSTRUCTIONS.amount}</p>
                <p className="text-xs">{PAYMENT_INSTRUCTIONS.note}</p>
              </div>
            </div>

            <div>
              <label className="label">Payment Proof (JPG, PNG, or PDF — max 5MB)</label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 p-8 transition hover:border-indigo-500">
                <Upload className="mb-2 h-8 w-8 text-slate-500" />
                <span className="text-sm text-slate-400">
                  {fileName || 'Click to upload screenshot'}
                </span>
                <input
                  name="proof"
                  type="file"
                  required
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                />
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

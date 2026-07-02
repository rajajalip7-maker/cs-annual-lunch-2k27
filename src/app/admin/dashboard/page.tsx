'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface Payment {
  id: string;
  status: string;
  amount: number;
  transactionId: string;
  createdAt: string;
  slaDueAt: string;
  flaggedReason?: string;
  fileName: string;
  user: { name: string; rollNo: string; mobile: string; gender: string; accommodationType: string; hostelName?: string };
  ticket?: { id: string; status: string };
  sla: { status: string; label: string; hoursRemaining: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [overdue, setOverdue] = useState(0);
  const [filter, setFilter] = useState('pending');
  const [genderFilter, setGenderFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ status: filter, search, gender: genderFilter });
    const res = await fetch(`/api/admin/payments?${params}`);
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    const data = await res.json();
    setPayments(data.payments);
    const countMap: Record<string, number> = {};
    data.counts?.forEach((c: { status: string; _count: { id: number } }) => {
      countMap[c.status] = c._count.id;
    });
    setCounts(countMap);
    setOverdue(data.overdue);
    setLoading(false);
  }, [filter, genderFilter, search, router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/admin/login');
  }

  async function handleBulk(action: 'approve' | 'reject') {
    if (selected.size === 0) return;
    let reason = '';
    if (action === 'reject') {
      reason = prompt('Rejection reason (required):') || '';
      if (reason.length < 10) return alert('Reason must be at least 10 characters');
    }
    if (!confirm(`${action} ${selected.size} payment(s)?`)) return;

    await fetch('/api/admin/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), action, reason }),
    });
    setSelected(new Set());
    load();
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const tabs = [
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'flagged', label: 'Flagged', count: counts.flagged },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-white">Admin Portal</h1>
            <p className="text-xs text-slate-400">Payment verification & ticketing</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/gate" className="btn-secondary text-sm">Gate Scanner</Link>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {overdue > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-300">
            <AlertTriangle className="h-5 w-5" />
            {overdue} submission(s) past SLA deadline
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-10"
              placeholder="Search roll no, name, transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="all">All Genders</option>
            <option value="male">Boys</option>
            <option value="female">Girls</option>
          </select>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <button onClick={() => handleBulk('approve')} className="btn-success text-sm">
                Approve ({selected.size})
              </button>
              <button onClick={() => handleBulk('reject')} className="btn-danger text-sm">
                Reject ({selected.size})
              </button>
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : payments.length === 0 ? (
          <div className="card p-12 text-center text-slate-400">No records found</div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="card flex items-center gap-4 p-4">
                {(p.status === 'pending' || p.status === 'flagged') && (
                  <button onClick={() => toggleSelect(p.id)} className="text-slate-400 hover:text-white">
                    {selected.has(p.id) ? (
                      <CheckSquare className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{p.user.name}</span>
                    <span className="text-sm text-slate-500">{p.user.rollNo}</span>
                    <span className={`badge badge-${p.status === 'flagged' ? 'flagged' : p.status}`}>
                      {p.status}
                    </span>
                    {p.sla.status === 'overdue' && p.status === 'pending' && (
                      <span className="badge bg-red-500/20 text-red-300">
                        <Clock className="mr-1 h-3 w-3" /> SLA Overdue
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    PKR {p.amount} · {p.user.mobile}
                    {p.user.gender && (
                      <span className="ml-2 capitalize">· {p.user.gender}</span>
                    )}
                    {p.user.accommodationType === 'hostellite' && p.user.hostelName && (
                      <span> · {p.user.hostelName}</span>
                    )}
                  </div>
                  {p.flaggedReason && (
                    <div className="mt-1 text-xs text-orange-300">{p.flaggedReason}</div>
                  )}
                </div>
                <Link
                  href={`/admin/review/${p.id}`}
                  className="btn-primary text-sm"
                >
                  Review <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

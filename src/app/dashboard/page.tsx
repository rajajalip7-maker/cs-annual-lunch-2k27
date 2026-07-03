'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, LogOut } from 'lucide-react';
import EventTicket from '@/components/EventTicket';

interface DashboardData {
  user: {
    name: string;
    rollNo: string;
    gender: string;
    accommodationType: string;
    hostelName?: string;
    profileComplete: boolean;
  };
  payment: {
    id: string;
    status: string;
    rejectionReason?: string;
    flaggedReason?: string;
    sla: { remaining: string; label: string };
    ticket?: { id: string; ticketUid: string };
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [ticketData, setTicketData] = useState<{
    name: string;
    rollNo: string;
    ticketUid: string;
    entryCode: string;
    accommodationType: string;
    qrDataUrl: string;
    downloadUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
        setData(d);
        if (d.payment?.status === 'approved' && d.payment.ticket) {
          fetch(`/api/tickets/by-payment/${d.payment.id}`)
            .then((r) => r.json())
            .then((t) => {
              if (!t.error) {
                setTicketData({
                  ...t.user,
                  ticketUid: t.ticket.ticketUid,
                  entryCode: t.ticket.entryCode,
                  qrDataUrl: t.qrDataUrl,
                  downloadUrl: t.downloadUrl,
                });
              }
            });
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/student/login', { method: 'DELETE' });
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>
    );
  }

  if (!data) return null;

  const payment = data.payment;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <button onClick={handleLogout} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <div className="card p-6 text-center">
          <h1 className="text-xl font-bold text-white">{data.user.name}</h1>
          <p className="text-slate-400">{data.user.rollNo}</p>

          {!payment && (
            <div className="mt-6">
              <p className="mb-4 text-slate-400">You haven&apos;t submitted your registration yet.</p>
              <Link href="/register/complete" className="btn-primary">
                Complete Registration
              </Link>
            </div>
          )}

          {payment?.status === 'pending' && (
            <div className="mt-6 rounded-lg bg-amber-500/10 p-4">
              <Clock className="mx-auto mb-2 h-10 w-10 text-amber-300" />
              <p className="font-medium text-amber-300">Payment Under Review</p>
              <p className="mt-1 text-sm text-amber-200">{payment.sla.remaining}</p>
              <p className="mt-3 text-xs text-slate-500">Log in anytime to check your status.</p>
            </div>
          )}

          {payment?.status === 'flagged' && (
            <div className="mt-6 rounded-lg bg-orange-500/10 p-4">
              <AlertTriangle className="mx-auto mb-2 h-10 w-10 text-orange-300" />
              <p className="font-medium text-orange-300">Additional Review Required</p>
              {payment.flaggedReason && <p className="mt-1 text-sm text-orange-200">{payment.flaggedReason}</p>}
            </div>
          )}

          {payment?.status === 'rejected' && (
            <div className="mt-6 rounded-lg bg-red-500/10 p-4">
              <XCircle className="mx-auto mb-2 h-10 w-10 text-red-300" />
              <p className="font-medium text-red-300">Payment Rejected</p>
              <p className="mt-1 text-sm text-red-200">{payment.rejectionReason}</p>
              <Link href="/register/complete" className="btn-primary mt-4 inline-block text-sm">
                Resubmit Registration
              </Link>
            </div>
          )}

          {payment?.status === 'approved' && ticketData && (
            <div className="mt-6">
              <CheckCircle className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
              <p className="mb-2 font-medium text-emerald-300">Your ticket is ready!</p>
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Please bring this ticket (on your phone or printed) to the event venue on the day. Entry will not be allowed without it.
              </div>
              <EventTicket {...ticketData} paymentId={payment.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

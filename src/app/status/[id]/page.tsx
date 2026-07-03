'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import EventTicket from '@/components/EventTicket';

interface TicketData {
  name: string;
  rollNo: string;
  ticketUid: string;
  entryCode: string;
  accommodationType: string;
  qrDataUrl: string;
  downloadUrl: string;
}

interface StatusData {
  id: string;
  status: string;
  rejectionReason?: string;
  flaggedReason?: string;
  amount: number;
  transactionId: string;
  createdAt: string;
  reviewedAt?: string;
  sla: { dueAt: string; status: string; label: string; remaining: string };
  user: { name: string; rollNo: string; email: string; accommodationType: string };
  ticket?: { id: string; ticketUid: string; status: string; issuedAt: string };
}

export default function StatusPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<StatusData | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/status/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          if (d.status === 'approved' && d.ticket) {
            fetch(`/api/tickets/by-payment/${id}`)
              .then((r) => r.json())
              .then((t) => {
                if (!t.error) setTicketData({ ...t.user, ticketUid: t.ticket.ticketUid, entryCode: t.ticket.entryCode, qrDataUrl: t.qrDataUrl, downloadUrl: t.downloadUrl });
              });
          }
        }
      })
      .catch(() => setError('Failed to load status'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-400">Loading status...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Not found'}</p>
        <Link href="/" className="btn-secondary">Go Home</Link>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-300', badge: 'badge-pending', label: 'Pending Review' },
    approved: { icon: CheckCircle, color: 'text-emerald-300', badge: 'badge-approved', label: 'Approved' },
    rejected: { icon: XCircle, color: 'text-red-300', badge: 'badge-rejected', label: 'Rejected' },
    flagged: { icon: AlertTriangle, color: 'text-orange-300', badge: 'badge-flagged', label: 'Under Review' },
  }[data.status] || { icon: Clock, color: 'text-slate-300', badge: 'badge-pending', label: data.status };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen py-8">
      <div className={`mx-auto px-4 py-8 ${data.status === 'approved' && ticketData ? 'max-w-md' : 'max-w-xl'}`}>
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="card p-8 text-center">
          <StatusIcon className={`mx-auto mb-4 h-16 w-16 ${statusConfig.color}`} />
          <span className={statusConfig.badge}>{statusConfig.label}</span>
          <h1 className="mt-4 text-2xl font-bold text-white">{data.user.name}</h1>
          <p className="text-slate-400">{data.user.rollNo}</p>

          {data.status === 'pending' && (
            <div className="mt-6 rounded-lg bg-amber-500/10 p-4">
              <p className="text-sm text-amber-200">
                Your payment is being reviewed. Expected within 24 hours.
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-300">{data.sla.remaining}</p>
            </div>
          )}

          {data.status === 'flagged' && data.flaggedReason && (
            <div className="mt-6 rounded-lg bg-orange-500/10 p-4 text-left text-sm text-orange-200">
              <p className="font-medium">Additional verification required</p>
              <p className="mt-1">{data.flaggedReason}</p>
            </div>
          )}

          {data.status === 'rejected' && (
            <div className="mt-6 rounded-lg bg-red-500/10 p-4 text-left">
              <p className="font-medium text-red-300">Rejection Reason</p>
              <p className="mt-1 text-sm text-red-200">{data.rejectionReason}</p>
              <Link href="/register" className="btn-primary mt-4 inline-block text-sm">
                Resubmit Registration
              </Link>
            </div>
          )}

          {data.status === 'approved' && ticketData && (
            <div className="mt-6">
              <p className="mb-4 font-medium text-emerald-300">Your ticket is ready!</p>
              <EventTicket
                name={ticketData.name}
                rollNo={ticketData.rollNo}
                ticketUid={ticketData.ticketUid}
                entryCode={ticketData.entryCode}
                accommodationType={ticketData.accommodationType}
                qrDataUrl={ticketData.qrDataUrl}
                downloadUrl={ticketData.downloadUrl}
                paymentId={id}
              />
            </div>
          )}

          <div className="mt-8 space-y-2 text-left text-sm">
            <Row label="Tracking ID" value={data.id} mono />
            <Row label="Transaction ID" value={data.transactionId} mono />
            <Row label="Amount" value={`PKR ${data.amount}`} />
            <Row label="Submitted" value={new Date(data.createdAt).toLocaleString()} />
            {data.reviewedAt && (
              <Row label="Reviewed" value={new Date(data.reviewedAt).toLocaleString()} />
            )}
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Bookmark this page to check your status anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-slate-700/50 py-2">
      <span className="text-slate-500">{label}</span>
      <span className={mono ? 'font-mono text-slate-300' : 'text-slate-300'}>{value}</span>
    </div>
  );
}

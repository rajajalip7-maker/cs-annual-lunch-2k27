'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Flag } from 'lucide-react';
import EventTicket from '@/components/EventTicket';

interface PaymentDetail {
  id: string;
  status: string;
  amount: number;
  transactionId: string;
  fileName: string;
  rejectionReason?: string;
  flaggedReason?: string;
  createdAt: string;
  reviewedAt?: string;
  sla: { status: string; label: string; remaining?: string };
  user: {
    name: string;
    rollNo: string;
    email: string;
    mobile: string;
    affiliation: string;
    gender: string;
    accommodationType: string;
    hostelName?: string;
  };
  ticket?: { id: string; ticketUid: string; status: string };
}

interface AuditEntry {
  id: string;
  action: string;
  reason?: string;
  createdAt: string;
  admin?: { name: string };
}

export default function ReviewPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [ticketView, setTicketView] = useState<{
    name: string;
    rollNo: string;
    ticketUid: string;
    entryCode: string;
    accommodationType: string;
    qrDataUrl: string;
    downloadUrl: string;
  } | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/payments/${id}`);
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    const data = await res.json();
    setPayment(data.payment);
    setAuditLogs(data.auditLogs);

    if (data.payment.ticket) {
      const qrRes = await fetch(`/api/tickets/${data.payment.ticket.id}/qr`);
      const qrData = await qrRes.json();
      setTicketView({
        name: data.payment.user.name,
        rollNo: data.payment.user.rollNo,
        ticketUid: data.payment.ticket.ticketUid,
        entryCode: data.payment.ticket.entryCode ?? qrData.ticket?.entryCode ?? '',
        accommodationType: data.payment.user.accommodationType,
        qrDataUrl: qrData.qrDataUrl,
        downloadUrl: `/api/tickets/${data.payment.ticket.id}/qr?format=png`,
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAction(action: 'approve' | 'reject' | 'unflag') {
    setActionLoading(true);
    const body: Record<string, string> = { action };
    if (action === 'reject') body.reason = rejectReason;

    const res = await fetch(`/api/admin/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowReject(false);
      load();
    }
    setActionLoading(false);
  }

  if (loading || !payment) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-6">
      <div className="mx-auto max-w-6xl px-4">
        <Link
          href="/admin/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Applicant Details</h2>
            <dl className="space-y-3 text-sm">
              <Detail label="Name" value={payment.user.name} />
              <Detail label="Roll No" value={payment.user.rollNo} />
              <Detail label="Email" value={payment.user.email} />
              <Detail label="Mobile" value={payment.user.mobile} />
              <Detail label="Department" value={payment.user.affiliation} />
              <Detail label="Gender" value={payment.user.gender} />
              <Detail label="Type" value={payment.user.accommodationType.replace('_', ' ')} />
              {payment.user.hostelName && (
                <Detail label="Hostel" value={payment.user.hostelName} />
              )}
              <Detail label="Amount" value={`PKR ${payment.amount}`} />
              <Detail label="Transaction ID" value={payment.transactionId} mono />
              <Detail label="Status" value={payment.status} />
              <Detail label="SLA" value={payment.sla.label} />
              {payment.flaggedReason && (
                <Detail label="Flag Reason" value={payment.flaggedReason} />
              )}
            </dl>

            {(payment.status === 'pending' || payment.status === 'flagged') && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="btn-success"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
                <button onClick={() => setShowReject(true)} className="btn-danger">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
                {payment.status === 'flagged' && (
                  <button onClick={() => handleAction('unflag')} className="btn-secondary">
                    <Flag className="h-4 w-4" /> Clear Flag
                  </button>
                )}
              </div>
            )}

            {showReject && (
              <div className="mt-4 space-y-3">
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Rejection reason (min 10 characters)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <button
                  onClick={() => handleAction('reject')}
                  disabled={rejectReason.length < 10 || actionLoading}
                  className="btn-danger"
                >
                  Confirm Rejection
                </button>
              </div>
            )}

            {payment.ticket && ticketView && (
              <div className="mt-6">
                <h3 className="mb-4 text-center font-medium text-white">Generated Ticket</h3>
                <EventTicket {...ticketView} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Payment Proof</h2>
              <div className="overflow-hidden rounded-lg border border-slate-600">
                {payment.fileName.endsWith('.pdf') ? (
                  <iframe
                    src={`/api/admin/proof/${payment.fileName}`}
                    className="h-[500px] w-full bg-white"
                    title="Payment proof"
                  />
                ) : (
                  <img
                    src={`/api/admin/proof/${payment.fileName}`}
                    alt="Payment proof"
                    className="w-full"
                  />
                )}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Audit Trail</h2>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No audit entries yet</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-indigo-500/50 pl-3 text-sm">
                      <div className="font-medium text-slate-300">{log.action.replace(/_/g, ' ')}</div>
                      {log.admin && <div className="text-slate-500">by {log.admin.name}</div>}
                      {log.reason && <div className="text-slate-400">{log.reason}</div>}
                      <div className="text-xs text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

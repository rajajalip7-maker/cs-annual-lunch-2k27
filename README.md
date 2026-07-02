# COMPTECH Event Ticketing System

A full-stack event registration, manual payment verification, and ticketing system built from the revised technical proposal.

## Features

- **Registration** — Form with Hostellite/Day Scholar pricing, honeypot anti-bot, client + server validation
- **Payment proof upload** — JPG/PNG/PDF, 5MB limit, SHA-256 hashing, private admin-only access
- **Fraud detection** — Duplicate transaction lock (DB transaction), duplicate file hash, cross-attribute matching
- **Rate limiting** — Per phone + IP submission limits
- **Admin portal** — Pending/Approved/Rejected/Flagged queues, split-view review, bulk actions, audit trail
- **SLA tracking** — 24-hour review window with overdue indicators
- **Signed QR tickets** — HMAC-JWT signed payloads (not raw UUIDs)
- **Gate scanner** — Offline cache, online sync, manual override with audit logging
- **Data retention** — Cron endpoint for purging old payment screenshots

## Quick Start

```bash
cd event-ticketing-system
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Credentials

| Role       | Username | Password  |
|------------|----------|-----------|
| Admin      | admin    | admin123  |
| Gate Staff | gate1    | gate123   |

Change these in `.env` before production.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/register` | Student registration + payment upload |
| `/status/[id]` | Track registration status |
| `/admin/login` | Staff login |
| `/admin/dashboard` | Payment review queue |
| `/admin/review/[id]` | Split-view verification |
| `/gate` | Gate QR scanner (offline-capable) |

## Environment Variables

Copy `.env.example` to `.env` and update secrets for production.

## Architecture

- **Next.js 15** — App Router, API routes, React frontend
- **Prisma + SQLite** — Database (swap to PostgreSQL for production)
- **jose** — JWT/HMAC for QR signatures and sessions
- **bcryptjs** — Password hashing

## Production Checklist

1. Switch `DATABASE_URL` to PostgreSQL
2. Set strong `JWT_SECRET`, `QR_HMAC_SECRET`, `SESSION_SECRET`
3. Use cloud storage (S3/GCS) for payment proofs instead of local `uploads/`
4. Configure email/SMS for ticket delivery
5. Schedule `/api/cron/sla` for retention and SLA monitoring
6. Enable HTTPS and secure cookies

## Improvements Over Proposal

- Modern dark UI with responsive design
- Real-time admin dashboard with auto-refresh
- Bookmarkable status tracking page for applicants
- Gate scanner with localStorage offline cache
- Type-safe validation with Zod
- Single-repo deployable stack (Next.js)

# Deploy Guide — CS Annual Lunch Ticketing

This app uses **SQLite** and **local file uploads**, so deploy on **Railway** (recommended) or **Render** — not Vercel (serverless has no persistent disk).

## Step 1 — Push to GitHub

### Install Git (if needed)
Download from https://git-scm.com/download/win

### Create repo on GitHub
1. Go to https://github.com/new
2. Name: `event-ticketing-system` (or any name)
3. **Do not** add README/license (we already have code)
4. Click **Create repository**

### Push from your PC
```powershell
cd "C:\Users\HS TRADER\event-ticketing-system"
git init
git add .
git commit -m "Initial commit: CS Annual Lunch ticketing system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/event-ticketing-system.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Deploy on Railway (free trial / hobby)

1. Go to https://railway.app and sign in with **GitHub**
2. **New Project** → **Deploy from GitHub repo** → select `event-ticketing-system`
3. Railway will detect the `Dockerfile` and build automatically
4. Open the service → **Settings** → **Networking** → **Generate Domain**
5. You get a link like: `https://event-ticketing-system-production.up.railway.app`

### Add persistent storage (important)
Without volumes, database and uploads reset on redeploy.

1. In Railway project → your service → **Volumes**
2. Add volume mount:
   - Mount path: `/app/prisma` (for database)
   - Mount path: `/app/uploads` (for payment screenshots)

### Environment variables (Railway → Variables)
```
JWT_SECRET=your-long-random-secret-here
QR_HMAC_SECRET=your-qr-secret-here
SESSION_SECRET=your-session-secret-here
ADMIN_DEFAULT_PASSWORD=change-me
GATE_DEFAULT_PASSWORD=change-me
DATABASE_URL=file:./prisma/prod.db
```

Generate secrets (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Links to share after deploy

| Audience | URL |
|----------|-----|
| Students (register) | `https://YOUR-DOMAIN/register` |
| Admin | `https://YOUR-DOMAIN/admin/login` |
| Gate scanner | `https://YOUR-DOMAIN/gate` |

Default logins (change via env vars before going live):
- Admin: `admin` / `admin123`
- Gate: `gate1` / `gate123`

---

## Updating after deploy

1. Edit code locally (e.g. `src/lib/event.ts` for date/venue)
2. Commit and push:
   ```powershell
   git add .
   git commit -m "Update event date and venue"
   git push
   ```
3. Railway redeploys automatically — **same URL**, new content

---

## Custom domain (optional)

In Railway → Networking → add your own domain (e.g. `cslunch.university.edu.pk`).

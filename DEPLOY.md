# Deploy Guide — CS Annual Lunch 2k27

This app uses **SQLite** and **local file uploads**, so deploy on **Railway** (recommended) or **Render** — not Vercel (serverless has no persistent disk).

## Your public link (goal)

After deploy, share:

**`https://cs-annual-lunch-2k27.up.railway.app/register`**

(Railway may add `-production` in the middle — you can rename the service to get a cleaner URL.)

---

## Step 1 — Push to GitHub

### Create repo on GitHub
1. Go to https://github.com/new
2. Name: **`cs-annual-lunch-2k27`**
3. **Do not** add README/license (we already have code)
4. Click **Create repository**

### Push from your PC
```powershell
cd "C:\Users\HS TRADER\event-ticketing-system"
gh auth login
gh repo create cs-annual-lunch-2k27 --public --source=. --remote=origin --push
```

Or manually:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/cs-annual-lunch-2k27.git
git push -u origin main
```

---

## Step 2 — Deploy on Railway

1. Go to https://railway.app and sign in with **GitHub**
2. **New Project** → **Deploy from GitHub repo** → select **`cs-annual-lunch-2k27`**
3. Click the service → **Settings** → rename service to **`cs-annual-lunch-2k27`**
4. **Networking** → **Generate Domain** → you get something like:
   `https://cs-annual-lunch-2k27-production.up.railway.app`
5. Optional: **Custom Domain** → add e.g. `cslunch2k27.youruniversity.edu.pk` if your IT provides one

### Add persistent storage (REQUIRED — or all data is lost on every redeploy)

**Without volumes, every code update wipes registrations, users, and payments.**

1. In Railway project → your service → **Volumes**
2. Click **Add Volume** → Mount path: **`/app/prisma`**
3. Click **Add Volume** again → Mount path: **`/app/uploads`**

### Environment variables (Railway → Variables)

**`DATABASE_URL` must be exactly:**
```
file:./prisma/prod.db
```

Do **not** use `file:./dev.db` on Railway — that stores data outside the volume and it will be deleted.

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
| Students (register) | `https://cs-annual-lunch-2k27.up.railway.app/register` |
| Admin | `https://cs-annual-lunch-2k27.up.railway.app/admin/login` |
| Gate scanner | `https://cs-annual-lunch-2k27.up.railway.app/gate` |

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

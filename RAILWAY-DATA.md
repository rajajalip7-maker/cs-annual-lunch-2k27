# Save your data on Railway (registrations not disappearing)

Railway **does not show Volumes in Settings**. Use the steps below.

## How to add a volume (step by step)

1. Open **https://railway.app** and click your project.
2. You should see the **canvas** (dark area with your `cs-annual-lunch-2k27` box).
3. Press **`Ctrl + K`** on your keyboard (Command Palette).
4. Type **`volume`** and choose **"Create Volume"** or **"Add Volume"**.
5. Select your service: **`cs-annual-lunch-2k27`**.
6. For **Mount path**, enter exactly:

```
/app/data
```

7. Click **Create** / **Add**.

**Other way:** Right-click empty space on the project canvas → look for **Volume** option.

---

## Variables (Railway → service → Variables tab)

You can set (optional — app auto-detects volume):

```
DATABASE_URL=file:/app/data/prod.db
```

Remove `file:./dev.db` if you have it.

---

## Only ONE volume needed

Mount **one** volume at `/app/data`. It stores:

- Database (`prod.db`) — registrations, users, payments  
- Uploads — payment screenshots  

---

## After adding the volume

1. Railway will redeploy automatically.
2. Register users again (old data before volume cannot be recovered).
3. New data should **stay** after redeploys.

Check logs: **Deployments → View logs** — look for:

```
Persist root: /app/data
Records — admins: 2, users: 3, payments: 3
```

---

## Still cannot find Volume?

- Make sure you clicked **inside the project** (not the dashboard home).
- Try **right-click** on the canvas background.
- Trial/Free plans support volumes (0.5 GB) — you should still see the option.
- If Volume never appears, upgrade to **Hobby ($5/mo)** or use Railway **Postgres** (ask for help to switch).

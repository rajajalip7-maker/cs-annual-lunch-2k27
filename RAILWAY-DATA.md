# Railway — keep your data (registrations, users, payments)

If registrations disappear after a redeploy or code update, **the database is not on a persistent volume**.

## Fix in 3 steps

### 1. Variables (Railway → service → Variables)

Set **only this** for the database (delete `file:./dev.db` if present):

```
DATABASE_URL=file:/app/prisma/prod.db
```

Use the **absolute** path above on Railway.

### 2. Volumes (Railway → service → Settings → Volumes)

Add **two** volumes:

| Mount path |
|------------|
| `/app/prisma` |
| `/app/uploads` |

Without `/app/prisma`, every deploy starts with an **empty** database.

### 3. Redeploy once

After saving variables and volumes, redeploy the service.

---

## Check it worked

Railway → service → **Deployments** → latest deploy → **View logs**

On startup you should see lines like:

```
DATABASE_URL (production): file:/app/prisma/prod.db
Database file exists (120 KB): /app/prisma/prod.db
Records in DB — admins: 2, users: 5, payments: 5
```

If you see `Database file will be created` every time you deploy, **the volume is not mounted correctly**.

---

## What is NOT lost on refresh

- **Browser refresh** — does not delete data (you may need to log in again)
- **Downloading a ticket** — does not delete registrations

## What WAS lost

- Data entered **before** volumes were added cannot be recovered — register again once volumes are set up.

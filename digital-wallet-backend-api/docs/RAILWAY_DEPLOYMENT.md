# Railway Deployment & Local Database Management Guide

This document provides a comprehensive step-by-step guide on how to deploy the **Digital Wallet Backend API** to [Railway](https://railway.app) and manage the production PostgreSQL database from your local development machine.

---

## 📋 Project Structure Note

This repository is structured as a **monorepo**:
* **Repository**: `https://github.com/kxunsithu/digital-wallet-management-system.git`
* **Backend Subfolder**: `digital-wallet-backend-api`

---

## 🚀 Step 1: Deploy to Railway (GitHub Integration)

### 1. Push Latest Changes
Ensure all your backend changes are committed and pushed to GitHub:
```bash
git add .
git commit -m "Prepare backend for deployment"
git push origin main
```

### 2. Create Project & Provision PostgreSQL
1. Log in to [Railway Dashboard](https://railway.app).
2. Click **+ New Project** $\rightarrow$ **Provision PostgreSQL**.
3. Railway will generate a PostgreSQL instance card on your canvas.

### 3. Add GitHub Repository Service
1. On your Railway project canvas, click **+ New** $\rightarrow$ **GitHub Repo**.
2. Select repository: `kxunsithu/digital-wallet-management-system`.
3. **Configure Monorepo Root Directory**:
   * Click on your newly created web service card.
   * Go to **Settings** $\rightarrow$ **Source**.
   * Edit **Root Directory** and set it to: `digital-wallet-backend-api`.
   * Click **Save**.

### 4. Link PostgreSQL Database
1. Open your **Backend Service** card $\rightarrow$ **Variables** tab.
2. Click **+ New Variable** $\rightarrow$ **Add Reference**.
3. Add:
   * **Key**: `DATABASE_URL`
   * **Value**: `${{Postgres.DATABASE_URL}}` (select your Postgres service from the dropdown).

> **Note**: The backend `Dockerfile` automatically parses `DATABASE_URL` into standard Laravel PostgreSQL environment variables (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_CONNECTION=pgsql`) and runs `php artisan migrate --force` on container startup.

---

## ⚙️ Step 2: Environment Variables Setup

In your Backend Service **Variables** tab, click **Raw Editor** (top right) and paste the following configuration:

```env
APP_NAME="Digital Wallet API"
APP_ENV=production
APP_KEY=base64:SJ18kMSpB72OOa1U20hYRqCfKyqg6Ispb8QvIBde9TM=
APP_DEBUG=false
APP_TIMEZONE=Asia/Yangon

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false

CACHE_STORE=database
QUEUE_CONNECTION=database

LOG_CHANNEL=stderr
LOG_LEVEL=error

INFINIREACH_API_KEY=smsrelay_8e86b45094383d27cb69304a6e3d21f1979dc13a5312bc6b2d8a862518c3ebd7
INFINIREACH_SENDER_NUMBER=+959944074981
INFINIREACH_BASE_URL=https://api.infinireach.io/api/v1
INFINIREACH_TEST_MODE=false

AUTH_ADMIN_PHONE=+959944074981
ADMIN_INITIAL_WALLET_BALANCE=1000000

MAIL_MAILER=log
MAIL_FROM_ADDRESS="digital-wallet@railway.app"
MAIL_FROM_NAME="Digital Wallet API"

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
BCRYPT_ROUNDS=12
```

---

## 🌐 Step 3: Generate Domain & Update `APP_URL`

1. Go to your Backend Service $\rightarrow$ **Settings** tab $\rightarrow$ **Networking**.
2. Click **Generate Domain** under *Public Networking* (e.g., `digital-wallet-backend-api-production.up.railway.app`).
3. Return to the **Variables** tab and set `APP_URL`:
   ```env
   APP_URL=https://digital-wallet-backend-api-production.up.railway.app
   ```

---

## 💻 Step 4: Connecting to Database from Local Machine

You can manage the Railway PostgreSQL database directly from your local machine using database clients or Artisan CLI commands.

### Database Credentials
Retrieve public TCP credentials from your Railway Postgres Service $\rightarrow$ **Networking** $\rightarrow$ **Public Networking**:

* **Host**: `yamanote.proxy.rlwy.net` *(or your generated proxy host)*
* **Port**: `59994` *(or your generated proxy port)*
* **Database**: `railway`
* **User**: `postgres`
* **SSL Mode**: `require`

### GUI Clients (TablePlus / DBeaver / pgAdmin)
Use the URI option to connect:
```text
postgresql://postgres:<PASSWORD>@yamanote.proxy.rlwy.net:59994/railway
```

### Local `.env` Configuration
To run `php artisan` commands locally against your Railway database, set your local `.env`:

```env
DATABASE_URL=postgresql://postgres:<PASSWORD>@yamanote.proxy.rlwy.net:59994/railway

DB_CONNECTION=pgsql
DB_HOST=yamanote.proxy.rlwy.net
DB_PORT=59994
DB_DATABASE=railway
DB_USERNAME=postgres
DB_PASSWORD=<PASSWORD>
DB_SSLMODE=require
```

---

## 🛠️ Step 5: Useful Local Artisan Commands

```bash
# Clear config cache after modifying .env
php artisan config:clear

# Check active database connection details & tables
php artisan db:show

# Run pending database migrations
php artisan migrate

# Seed database (roles, initial admin wallet, users)
php artisan db:seed

# Interactive PHP shell with database connection
php artisan tinker
```

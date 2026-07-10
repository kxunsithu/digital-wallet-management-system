# Digital Wallet Management System (Laravel API)

A production‑ready, API‑only Laravel application that provides a digital wallet with role‑based access (admin, agent, customer), QR payments, configurable level‑based limits, and asynchronous SMS OTP handling.

---

## Features
- **Roles & Permissions** – Admin, Agent, Customer (via `role:` middleware).
- **Level / Tier System** – Configurable daily/monthly transaction limits, fees, and commissions stored in `customer_level_configs` and `agent_level_configs` tables.
- **Authentication** – Phone‑OTP login using Laravel Sanctum tokens.
- **PIN Management** – Secure 4‑6 digit PIN with lockout after failed attempts.
- **Wallet & Transfers** – Balance checks, atomic DB transactions, limit enforcement.
- **QR Payments** – Generate static/dynamic QR codes, scan & pay in‑app.
- **Agent Operations** – Cash‑in / cash‑out for agents with commission handling.
- **Admin Dashboard** – Manage users, approve agents, edit level configs, view audit logs.
- **Event‑Driven** – `TransactionCompletedEvent` & `KycApprovedEvent` with listeners for logging and level upgrades.
- **Queue** – SMS OTP dispatched via a queued job (`SendOtpSmsJob`).
- **Docker** – Ready‑to‑run container stack (PHP‑FPM, Nginx, PostgreSQL, Redis).   

---

## Getting Started

### Prerequisites
- Docker & Docker Compose (recommended) **or** a local PHP 8.3+ environment.
- PostgreSQL (if not using Docker).

### Installation (Docker)
```bash
# Clone the repository
git clone <repo-url>
cd smart-wallet-api

# Copy the example environment file and adjust if needed
cp .env.docker.example .env

# Build and start containers
docker compose up --build -d

# Run migrations and seeders
docker exec -it smart-wallet-api php artisan migrate --seed
```
The API will be available at `http://localhost/api`.

### Local Development (without Docker)
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

---

## Environment Variables
Key variables (see `.env.docker.example`):
- `APP_KEY`, `APP_ENV`, `APP_DEBUG`
- `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `SANCTUM_STATEFUL_DOMAINS` – hosts allowed for Sanctum.
- `INFINIREACH_API_KEY`, `INFINIREACH_SENDER_NUMBER` – SMS provider credentials.
- `QUEUE_CONNECTION=redis` (Docker includes Redis).

---

## API Overview
All responses follow a unified JSON structure:
```json
{ "success": true, "message": "Action completed", "data": { ... } }
```
### Auth (public)
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/create-pin`
- `POST /api/auth/verify-pin`
- `POST /api/auth/forgot-pin`
- `POST /api/auth/reset-pin`
- `POST /api/auth/logout` (requires Sanctum)

### Wallet (customer)
- `GET /api/wallet` – wallet balance, limits.
- `POST /api/wallet/transfer` – PIN‑verified transfer.
- `GET /api/wallet/transactions` – paginated history.

### QR (authenticated users)
- `POST /api/qr/generate`
- `POST /api/qr/scan`
- `POST /api/qr/pay`

### Agent (agent role)
- `POST /api/agent/cash-in`
- `POST /api/agent/cash-out`
- `GET /api/agent/transactions`
- `GET /api/agent/profile`

### Admin (admin role)
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/status`
- `PATCH /api/admin/agents/{id}/approve`
- `GET /api/admin/customer-level-configs`
- `PATCH /api/admin/customer-level-configs/{id}`
- `GET /api/admin/agent-level-configs`
- `PATCH /api/admin/agent-level-configs/{id}`
- `GET /api/admin/audit-logs`

---

## Queues & Scheduler
The Docker setup runs a Redis container and a Laravel queue worker. To process queued jobs manually:
```bash
docker exec -it smart-wallet-api php artisan queue:work
```
The Laravel scheduler is enabled via the `cron` service in the compose file.

---

## Testing
You can run the test suite (if added) with:
```bash
php artisan test
```
Feel free to add PHPUnit tests for controllers, services, and policies.

---

## Contribution
Contributions are welcome! Fork the repo, create a feature branch, and submit a pull request. Follow the coding standards defined in the project and run `phpcs` before submitting.

---

## License
MIT – feel free to adapt and deploy.

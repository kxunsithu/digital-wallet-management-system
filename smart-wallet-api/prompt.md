# Project Prompt: Digital Wallet Management System (Laravel API)

## Project Overview
Build a Digital Wallet Management System using **Laravel (API only)** — no frontend, REST API endpoints only. There are three roles: **admin, agent, customer**. Both agents and customers have a level/tier system, and level-based limits/permissions are driven by dedicated config tables (not hardcoded, not duplicated per user).

## Tech Stack
- **Framework**: Laravel (latest LTS), API-only mode (`laravel new project --api` or `php artisan install:api`)
- **Database**: PostgreSQL
- **Auth**: Laravel Sanctum (token-based API auth)
- **Validation**: Use Form Request classes
- **Response format**: Consistent JSON response structure (defined below)
- **Architecture**: Controller → Service → Repository pattern (keep business logic out of controllers; put it in Service classes)
- **Queue**: SMS sending must be dispatched via a queue job (`ShouldQueue`) — never send synchronously
- **Containerization**: Full Docker setup (defined below)

---

## Database Schema (PostgreSQL)

Create migrations for the following tables:

### `roles`
- id, name (admin/agent/customer), description, timestamps

### `users`
- id, phone_number (unique), role_id (FK), full_name, email (nullable), nrc_number (nullable), status (enum: active/suspended/pending/blocked, default: pending), is_phone_verified (boolean, default false), is_pin_created (boolean, default false), profile_image (nullable), last_login_at, timestamps

### `otp_verifications`
- id, user_id (FK, nullable), phone_number, otp_code (**hashed**, use `Hash::make()`), purpose (enum: login/register/reset_pin/transaction), status (enum: pending/verified/expired/failed), attempt_count (default 0), expires_at, verified_at (nullable), timestamps

### `pins`
- id, user_id (FK, unique), pin_hash (bcrypt), failed_attempts (default 0), is_locked (boolean default false), locked_until (nullable), last_changed_at, timestamps

### `customer_level_configs` (level-based defaults — single source of truth)
| Column | Type | Note |
|---|---|---|
| id | PK | |
| level | ENUM (basic/silver/gold/platinum), unique | |
| daily_transfer_limit | DECIMAL(18,2) | |
| monthly_transfer_limit | DECIMAL(18,2) | |
| max_wallet_balance | DECIMAL(18,2) | |
| daily_cash_out_limit | DECIMAL(18,2) | |
| max_transaction_count_daily | INT | |
| can_use_qr_payment | BOOLEAN | |
| can_receive_from_agent | BOOLEAN | |
| requires_kyc | BOOLEAN | |
| is_active | BOOLEAN | |
| timestamps | | |

### `agent_level_configs` (level-based defaults — single source of truth)
| Column | Type | Note |
|---|---|---|
| id | PK | |
| level | ENUM (level_1/level_2/level_3/master), unique | |
| daily_cash_limit | DECIMAL(18,2) | |
| default_commission_rate | DECIMAL(5,2) | |
| min_float_required | DECIMAL(18,2) | |
| can_recruit_sub_agent | BOOLEAN | |
| is_active | BOOLEAN | |
| timestamps | | |

### `customer_profiles`
- id, user_id (FK, unique), level (enum: basic/silver/gold/platinum, default basic — FK reference to `customer_level_configs.level`), custom_limit_override (nullable DECIMAL — per-user override, use only when set), kyc_status (enum: not_submitted/pending/approved/rejected), referral_code, referred_by (FK users, nullable), timestamps

### `agent_profiles`
- id, user_id (FK, unique), agent_code (unique), level (enum: level_1/level_2/level_3/master — FK reference to `agent_level_configs.level`), custom_commission_override (nullable DECIMAL), shop_name, shop_address, township, float_balance, parent_agent_id (FK agent_profiles, nullable — hierarchy), total_volume_monthly, approved_by (FK users, nullable), status (enum: active/inactive/suspended), timestamps

### `wallets`
- id, user_id (FK, unique), wallet_number (unique), balance (decimal 18,2, default 0), currency (default MMK), status (enum: active/frozen/closed), timestamps

### `qr_codes`
- id, user_id (FK), wallet_id (FK), qr_type (enum: static/dynamic), qr_code_value (unique), amount (nullable), is_active (boolean), expires_at (nullable), timestamps

### `transactions`
- id, transaction_ref (unique), sender_wallet_id (FK, nullable), receiver_wallet_id (FK, nullable), transaction_type (enum: transfer/cash_in/cash_out/qr_payment/bill_payment/top_up), amount, fee, qr_id (FK, nullable), agent_id (FK, nullable), status (enum: pending/success/failed/reversed), pin_verified (boolean), description (nullable), timestamps

### `user_devices` (login sessions/devices)
- id, user_id (FK), device_id, device_name, ip_address, login_at, logout_at (nullable), is_active, timestamps

### `audit_logs`
- id, user_id (FK, nullable), action, target_table, target_id, details (text, nullable), timestamps

**Note**: Define all Eloquent model relationships (hasOne, belongsTo, hasMany) based on the FKs above. Seed `roles`, `customer_level_configs`, and `agent_level_configs` with default rows via seeders.

### Effective Limit Resolution Logic
Whenever a limit or commission rate is needed, resolve it like this (implement as an accessor or service method, not inline in controllers):
```
effective_limit = custom_limit_override ?? level_config.<matching_field>
```
This means: if the user has a personal override set, use it; otherwise fall back to the level's config default. This allows level-wide changes to apply instantly to all users of that level (via config table edit), while still supporting individual VIP/negotiated exceptions.

---

## Authentication Flow (Most Important Part)

### Case 1: New User (first-time login)
1. `POST /api/auth/request-otp` — client sends phone_number; check that this phone_number does not yet exist in `users`
2. Create a new `otp_verifications` row (purpose = `register`), generate a random 6-digit OTP → **hash it** before storing → send it via the SMS Integration service (queue job)
3. `POST /api/auth/verify-otp` — compare the submitted OTP against the hashed value → on success, create a new `users` row (status = pending), set `is_phone_verified = true`, and set `otp_verifications.status = verified`
4. `POST /api/auth/create-pin` — client sends user_id + pin (4 or 6 digits) → hash and store in `pins` → set `users.is_pin_created = true` → auto-create a `wallets` row (balance 0) → issue a Sanctum token → return login success response

### Case 2: Existing User, OTP Verified but PIN Not Yet Created
1. `POST /api/auth/request-otp` — if the phone_number already exists but `is_pin_created = false`, send OTP again (purpose = register, continuing the flow)
2. After OTP verification, direct the user to the PIN creation step (same as Case 1, Step 4)

### Case 3: Existing User, PIN Already Created (Returning User — Login)
1. `POST /api/auth/request-otp` — if the phone_number exists and `is_pin_created = true`, send OTP with purpose = `login`
2. `POST /api/auth/verify-otp` — on successful OTP verification, **require the user to enter their PIN next**
3. `POST /api/auth/verify-pin` — client sends user_id + pin → compare against `pins.pin_hash` → on success, issue a Sanctum token → update `users.last_login_at` → create/update a `user_devices` row

> **Confirmed business rule**: Every login **always requires both OTP and PIN**, in sequence — OTP verification first, then PIN verification, with no exceptions (no PIN-only login, no OTP-skip for known devices). Reuse PIN verification for confirming money transfers as well (`POST /api/wallet/transfer` must require the pin in the request).

### OTP Security Rules
- OTP expiry: 5 minutes (`expires_at`)
- Max verification attempts: 5 — after that, set `status = failed` and require a new `request-otp` call
- Resend OTP: apply rate limiting (throttle middleware, e.g. 1 request / 60 seconds)
- PIN lock: after 5 failed attempts, set `is_locked = true` and `locked_until` (e.g. 15 minutes)

---

## SMS Integration

Build an `InfinireachSmsService` class (`app/Services/Sms/InfinireachSmsService.php`) for sending SMS:

**Endpoint**: `POST https://api.infinireach.io/api/v1/messages`

**Headers**:
```
Content-Type: application/json
X-API-Key: <config value from .env — INFINIREACH_API_KEY>
```

**Payload**:
```json
{
  "channel": "sms",
  "to": "+959XXXXXXXX",
  "from": "+959944074981",
  "message": "Your OTP code is: 123456"
}
```

- Use Laravel's `Http` facade (Guzzle-based)
- Add `INFINIREACH_API_KEY`, `INFINIREACH_SENDER_NUMBER`, and `INFINIREACH_BASE_URL` to `.env` config
- Dispatch SMS sending as a queue job (`SendOtpSmsJob implements ShouldQueue`) — add retry logic on failure (3 attempts, exponential backoff)
- Log failures from the SMS API response (Laravel log channel); optionally track delivery status on `otp_verifications` via an additional `delivery_status` column
- Add a helper function to auto-convert local phone number format (09xxxxxxxxx) to international format (+959xxxxxxxxx)

---

## API Response Standard

Build a helper class or trait (`app/Http/Responses/ApiResponse.php`) to keep all responses consistent, using this format:

**Success**:
```json
{
  "success": true,
  "message": "OTP sent successfully.",
  "data": {
    "phone_number": "+959XXXXXXXX",
    "expires_in": 300
  }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Invalid OTP code.",
  "errors": {
    "otp_code": ["The OTP code is invalid or expired."]
  }
}
```

- Customize the exception handler (`app/Exceptions/Handler.php`, or `bootstrap/app.php` `withExceptions()` in Laravel 11+) so validation errors, 404, 401, and 500 responses all follow this format
- Use correct HTTP status codes throughout (200, 201, 401, 403, 404, 422, 429, 500)

---

## Level & Limit Enforcement

- Never hardcode level limits in controllers or services (no `if ($level === 'gold')` logic for numeric limits)
- All limit checks must resolve through `customer_level_configs` / `agent_level_configs`, respecting `custom_limit_override` when present (see "Effective Limit Resolution Logic" above)
- Build a `LimitCheckService` that: (1) fetches the user's effective daily/monthly limit, (2) sums today's/this-month's successful transactions from the `transactions` table, (3) rejects the request with a `422` + custom exception (`TransactionLimitExceededException`) if the new transaction would exceed the limit
- Boolean feature flags (`can_use_qr_payment`, `can_receive_from_agent`, `can_recruit_sub_agent`, etc.) must be checked via a policy/middleware before allowing the relevant action — throw a `FeatureNotAvailableException` (422/403) if disabled for that level
- `GET /api/wallet` and `GET /api/agent/profile` responses should include the effective limits and remaining balance for that period, e.g.:
```json
{
  "level": "silver",
  "daily_limit": 500000,
  "daily_used": 120000,
  "daily_remaining": 380000
}
```
- KYC-driven level upgrades: when a KYC document is approved, fire an event (e.g. `KycApprovedEvent`) that updates `customer_profiles.level` — do not require manual level editing per user

---

## Required API Endpoints (Minimum Scope)

### Auth
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/create-pin`
- `POST /api/auth/verify-pin`
- `POST /api/auth/logout`
- `POST /api/auth/resend-otp`
- `POST /api/auth/forgot-pin` (OTP re-verification → reset pin)

### Wallet
- `GET /api/wallet` — balance + effective limit info
- `POST /api/wallet/transfer` (pin required)
- `GET /api/wallet/transactions` (paginated, filterable)

### QR
- `POST /api/qr/generate` (static/dynamic)
- `POST /api/qr/scan` — resolve wallet from qr_code_value
- `POST /api/qr/pay` (pin required)

### Agent (role: agent only — middleware protected)
- `POST /api/agent/cash-in`
- `POST /api/agent/cash-out`
- `GET /api/agent/transactions`
- `GET /api/agent/profile` — level, commission rate, float balance

### Admin (role: admin only)
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/status`
- `PATCH /api/admin/agents/{id}/approve`
- `GET/PATCH /api/admin/customer-level-configs` — manage level defaults
- `GET/PATCH /api/admin/agent-level-configs` — manage level defaults
- `GET /api/admin/audit-logs`

---

## Middleware & Authorization
- `auth:sanctum` middleware on all protected routes
- Build custom role middleware (`role:admin`, `role:agent`, `role:customer`) and group routes accordingly
- Implement fine-grained authorization with Policy classes (e.g. `TransactionPolicy`, `WalletPolicy`, `LevelFeaturePolicy`)
- Rate limiting: apply `throttle` middleware specifically on OTP request routes (abuse prevention)

## Additional Requirements
- Use `DB::transaction()` for wallet balance updates + transaction record creation to keep money transfer operations atomic (critical for correctness)
- Build a Form Request validation class for each endpoint
- Use API Resource classes (`JsonResource`) to control response data shape
- Add SMS config and DB config placeholders to `.env.example`
- Generate a Postman collection or OpenAPI/Swagger documentation (optional but preferred)

---

## Docker Setup (Required)

Provide a complete Docker setup so the project can be run with a single command (`docker-compose up`). Include:

### `Dockerfile`
- Base image: `php:8.3-fpm` (or latest stable PHP-FPM matching the Laravel version)
- Install required PHP extensions: `pdo_pgsql`, `pgsql`, `mbstring`, `bcmath`, `exif`, `pcntl`, `gd`, `zip`
- Install Composer (multi-stage copy from `composer:latest` image)
- Set working directory `/var/www`, copy project files, run `composer install --no-dev --optimize-autoloader` for production build
- Set correct file permissions for `storage` and `bootstrap/cache`

### `docker-compose.yml`
Define these services:
- **app** — the Laravel PHP-FPM container (built from the Dockerfile)
- **nginx** — web server, expose port 8000 (or as needed), mount an `nginx.conf`
- **postgres** — PostgreSQL container (e.g. `postgres:16`), with named volume for data persistence, env vars for DB name/user/password
- **redis** — for cache/session/queue driver
- **queue** — a separate container running `php artisan queue:work` (same image as app) for processing the SMS-sending queue jobs
- **scheduler** (optional) — container running `php artisan schedule:work` for expiring old OTPs, etc.

### Also include
- `docker/nginx/default.conf` — nginx config pointing to `public/index.php`
- `.dockerignore` — exclude `vendor`, `node_modules`, `.git`, `.env`
- A `.env.docker.example` with DB host set to `postgres` (the service name) and Redis host set to `redis`
- Document the setup steps in a `README.md`: `docker-compose up -d`, then `docker-compose exec app php artisan migrate --seed`, then `docker-compose exec app php artisan key:generate`

---

## Confirmed Business Rules
1. Every login **always requires both OTP and PIN**, in sequence — OTP first, then PIN. No exceptions.
2. Customer and agent level limits/permissions are driven entirely by `customer_level_configs` / `agent_level_configs` tables, with optional per-user override fields — never hardcoded per level in application code.

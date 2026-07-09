You are an expert enterprise Java backend developer and software architect. Generate a complete, production-ready **Digital Wallet Management System** backend using **Java Spring Boot 3.x** adhering strictly to **Object-Oriented Programming (OOP) principles**, Clean Architecture, and domain-driven design.

### 1. Technology Stack Requirements
- **Framework:** Java Spring Boot 3.x, Spring Security (JWT-based auth), Spring Data JPA.
- **Database:** PostgreSQL (with transactional integrity, ACID compliance, and proper locking mechanisms).
- **API Documentation:** Springdoc OpenAPI 3.0 (`/swagger-ui.html` and `/v3/api-docs`).
- **Containerization:** Production-ready `Dockerfile` and a `docker-compose.yml` file orchestration.
- **SMS Integration:** Infinireach SMS Gateway API for OTP delivery.

---

### 2. Core Business Rule: One Account, One Device Enforcement
- The system must enforce that a user can only be logged into **one device at a time**.
- When a user logs in from a new device, any existing token/session for that `user_id` must be invalidated or updated in `user_device_tokens`.
- This is enforced at the database level via a **Unique Constraint on `user_id`** in the `user_device_tokens` table.

---

### 3. API Documentation & Swagger UI Configuration (`/swagger-ui.html`)
Configure **Springdoc OpenAPI** to generate detailed, interactive API documentation.
- **Global Configuration:** Include a global OpenAPI bean setting up Metadata (Title, Version, Description) and a global **Security Scheme for JWT Bearer Authentication**.
- **Swagger UI Path Customization:** Map the interactive UI explicitly so it is accessible via `/swagger-ui.html`.
- **Spring Security Rules:** Ensure Swagger UI public asset paths (e.g., `/swagger-ui/**`, `/v3/api-docs/**`, `/swagger-ui.html`) are explicitly permitted in your `SecurityFilterChain` without requiring authentication.
- **Controller Enrichment:** Decorate all REST Controller methods with standard annotations (`@Operation`, `@ApiResponse`, `@Parameter`, `@Tag`) to document exact request payloads, responses, validation errors ($400$), authentication failures ($401$), and success states ($200$/$201$).

---

### 4. Database Schema (PostgreSQL DDL Specifications)
Design and implement the following database tables. Use exact column definitions, types, indexes, and constraints as specified:

#### Table: `users`
- `id` (BIGSERIAL, PRIMARY KEY)
- `phone_number` (VARCHAR, UNIQUE, INDEX)
- `password_hash` (VARCHAR, NOT NULL)
- `role` (ENUM: 'CUSTOMER', 'AGENT', 'ADMIN')
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### Table: `user_device_tokens`
- `id` (BIGSERIAL, PRIMARY KEY)
- `user_id` (BIGINT, FOREIGN KEY to users, UNIQUE, INDEX) -- *Enforces one device per account*
- `device_token` (TEXT, UNIQUE, NOT NULL)
- `device_type` (VARCHAR)
- `updated_at` (TIMESTAMP)

#### Table: `customer_profiles`
- `id` (BIGSERIAL, PRIMARY KEY)
- `user_id` (BIGINT, FOREIGN KEY to users, UNIQUE, NOT NULL)
- `full_name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, UNIQUE)
- `nric_number` (VARCHAR)
- `qr_code_string` (VARCHAR, UNIQUE, NOT NULL)
- `created_at` (TIMESTAMP)

#### Table: `agent_profiles`
- `id` (BIGSERIAL, PRIMARY KEY)
- `user_id` (BIGINT, FOREIGN KEY to users, UNIQUE, NOT NULL)
- `business_name` (VARCHAR, NOT NULL)
- `license_number` (VARCHAR, NOT NULL)
- `address` (TEXT)
- `created_at` (TIMESTAMP)

#### Table: `wallets`
- `id` (BIGSERIAL, PRIMARY KEY)
- `user_id` (BIGINT, FOREIGN KEY to users, UNIQUE, NOT NULL)
- `balance` (DECIMAL(15,2), NOT NULL, CHECK (balance >= 0))
- `currency` (VARCHAR, DEFAULT 'MMK')
- `version` (BIGINT, NOT NULL) -- *Used for Optimistic Locking version control*

#### Table: `transactions`
- `id` (BIGSERIAL, PRIMARY KEY)
- `transaction_no` (VARCHAR, UNIQUE, INDEX)
- `sender_wallet_id` (BIGINT, FOREIGN KEY to wallets, NULLABLE)
- `receiver_wallet_id` (BIGINT, FOREIGN KEY to wallets, NULLABLE)
- `amount` (DECIMAL(15,2), NOT NULL)
- `transaction_type` (ENUM: 'TRANSFER', 'QR_TRANSFER', 'CASH_IN', 'CASH_OUT', 'ADMIN_TOP_UP', 'ADMIN_BONUS')
- `status` (ENUM: 'PENDING', 'SUCCESS', 'FAILED')
- `idempotency_key` (VARCHAR, UNIQUE, NOT NULL) -- *Prevents duplicate transaction processing*
- `description` (TEXT)
- `created_at` (TIMESTAMP)

#### Table: `otp_verifications`
- `id` (BIGSERIAL, PRIMARY KEY)
- `phone_number` (VARCHAR, NOT NULL)
- `otp_code` (VARCHAR, NOT NULL)
- `purpose` (VARCHAR, NOT NULL) -- *e.g., REGISTRATION, TRANSFER*
- `is_verified` (BOOLEAN, DEFAULT FALSE)
- `expired_at` (TIMESTAMP, NOT NULL)
- `created_at` (TIMESTAMP)

---

### 5. Core Business Logic & Money Flows (Service Layer)
Implement the following flows using Spring's `@Transactional` system. Ensure data mutation uses JPA Optimistic Locking (`@Version` on `wallets.version`) to prevent lost updates or double-spending under high concurrency.

#### A. Auth & Device Management
- **Device Registration Flow:** On successful authentication, upsert the `user_device_tokens` table. If the `user_id` already exists, overwrite the old `device_token` with the new one. This implicitly logs out/invalidates the previous device session.

#### B. Financial Money Flows
- **P2P & QR Transfer:** Debit sender wallet, Credit receiver wallet. Verify that `sender_wallet.balance >= amount`. 
- **Agent Cash In:** Deduct Agent Wallet -> Credit Customer Wallet. Requires Agent to have sufficient balance.
- **Customer Cash Out:** Deduct Customer Wallet -> Credit Agent Wallet.
- **Admin System Control:** Provide endpoints for `ADMIN_TOP_UP` (targeting Agents) and `ADMIN_BONUS` (targeting Customers).
- **Idempotency Check:** Every transaction request must supply an `idempotency_key`. If the key already exists in the `transactions` table, reject or return the existing transaction payload without reprocessing the money flow.

---

### 6. Third-Party SMS Integration (Infinireach Gateway)
Implement an outbound SMS notification service using Spring Boot's `WebClient` to trigger verification OTP codes.

- **Endpoint:** `POST https://api.infinireach.io/api/v1/messages`
- **Headers:**
  - `Content-Type: application/json`
  - `X-API-Key: <YOUR_API_KEY>`
- **Payload Format:**
```json
{
  "channel": "sms",
  "to": "+959XXXXXXXX",
  "from": "+959944074981",
  "message": "Your OTP code is: 123456"
}
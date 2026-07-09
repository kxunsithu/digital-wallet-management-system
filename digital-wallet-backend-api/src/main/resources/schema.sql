CREATE TYPE user_role AS ENUM ('CUSTOMER', 'AGENT', 'ADMIN');
CREATE TYPE transaction_type AS ENUM ('TRANSFER', 'QR_TRANSFER', 'CASH_IN', 'CASH_OUT', 'ADMIN_TOP_UP', 'ADMIN_BONUS');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_phone_number ON users(phone_number);

CREATE TABLE user_device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    device_token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(255),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_device_tokens_user FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX idx_user_device_tokens_user_id ON user_device_tokens(user_id);

CREATE TABLE customer_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    nric_number VARCHAR(255),
    qr_code_string VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_customer_profiles_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE agent_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_agent_profiles_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL CHECK (balance >= 0),
    currency VARCHAR(16) NOT NULL DEFAULT 'MMK',
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_wallets_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_no VARCHAR(255) NOT NULL UNIQUE,
    sender_wallet_id BIGINT,
    receiver_wallet_id BIGINT,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type transaction_type NOT NULL,
    status transaction_status NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_transactions_sender_wallet FOREIGN KEY(sender_wallet_id) REFERENCES wallets(id),
    CONSTRAINT fk_transactions_receiver_wallet FOREIGN KEY(receiver_wallet_id) REFERENCES wallets(id)
);
CREATE INDEX idx_transactions_transaction_no ON transactions(transaction_no);

CREATE TABLE otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(255) NOT NULL,
    otp_code VARCHAR(16) NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expired_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

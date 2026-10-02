# Digital Wallet Management System ERD

This document reflects the exact database schema currently implemented in the Laravel migrations and is formatted in standard **DBML (Database Markup Language)**, fully compatible with **[dbdiagram.io](https://dbdiagram.io)** and **DrawSQL**.

---

## 🏗️ Architecture & Modules Overview

The Digital Wallet Backend API is organized into four core functional domains:

1. **Authentication & Identity**: User accounts, roles, security PINs, OTP verification, sessions, and Sanctum tokens.
2. **Profiles & KYC**: Role-specific profile extensions (`customer_profiles`, `agent_profiles`, `agent_manager_profiles`), NRC verification workflow, and document image uploads.
3. **Wallet & Financial Ledger**: Wallets, real-time balance tracking, QR code payment generation, transaction ledgers, and global transfer configuration settings.
4. **External Integrations**: Third-party merchant system configurations (`external_systems`) and checkout payment sessions (`external_payments`).

---

## 📊 Complete DBML Schema (dbdiagram.io & DrawSQL Format)

```dbml
// ==========================================
// DBML Database Schema Definition
// Web Visualizer: https://dbdiagram.io
// ==========================================

TableGroup authentication {
  roles
  users
  pins
  otp_verifications
  personal_access_tokens
  sessions
}

TableGroup profiles_and_kyc {
  customer_profiles
  agent_profiles
  agent_manager_profiles
  nrc_verifications
  images
}

TableGroup wallet_and_finance {
  wallets
  qr_codes
  transactions
  transfer_settings
}

TableGroup external_integrations {
  external_systems
  external_payments
}

// ------------------------------------------
// AUTHENTICATION & IDENTITY
// ------------------------------------------

Table roles {
  id bigint [pk, increment]
  name varchar [not null]
  description varchar [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'User access control roles (e.g., Customer, Agent, Agent Manager, Admin)'
}

Table users {
  id bigint [pk, increment]
  phone_number varchar [unique, null]
  role_id bigint [ref: > roles.id, null]
  full_name varchar [null]
  nrc_number varchar [unique, null]
  state_region varchar [null, note: 'Derived from NRC']
  township varchar [null, note: 'Derived from NRC']
  status varchar [default: 'active']
  is_phone_verified boolean [default: false]
  is_pin_created boolean [default: false]
  last_login_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Core platform user identity account'
}

Table pins {
  id bigint [pk, increment]
  user_id bigint [unique, ref: > users.id]
  pin_hash varchar [not null]
  failed_attempts int [default: 0]
  is_locked boolean [default: false]
  locked_until timestamp [null]
  last_changed_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Transaction security PIN record per user'
}

Table otp_verifications {
  id bigint [pk, increment]
  user_id bigint [ref: > users.id]
  phone_number varchar [not null]
  otp_code varchar [not null]
  purpose varchar [not null]
  status varchar [default: 'pending']
  attempt_count int [default: 0]
  expires_at timestamp [null]
  verified_at timestamp [null]
  delivery_status varchar [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'One-time passcode delivery and verification logs'
}

Table personal_access_tokens {
  id bigint [pk, increment]
  tokenable_type varchar [not null]
  tokenable_id bigint [not null]
  name text [not null]
  token varchar(64) [unique, not null]
  abilities text [null]
  last_used_at timestamp [null]
  expires_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Laravel Sanctum API access tokens'
}

Table sessions {
  id varchar [pk]
  user_id bigint [ref: > users.id, null]
  ip_address varchar(45) [null]
  user_agent text [null]
  payload text [not null]
  last_activity int [not null]

  Note: 'Web HTTP user session store'
}

// ------------------------------------------
// PROFILES & KYC
// ------------------------------------------

Table customer_profiles {
  id bigint [pk, increment]
  user_id bigint [unique, ref: > users.id]
  custom_limit_override "decimal(15,2)" [null]
  kyc_status varchar [default: 'pending']
  referral_code varchar [unique, null]
  referred_by bigint [ref: > users.id, null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Customer limits, KYC approval state, and referral linkages'
}

Table agent_profiles {
  id bigint [pk, increment]
  user_id bigint [unique, ref: > users.id]
  agent_code varchar [unique, not null]
  shop_name varchar [null]
  shop_address varchar [null]
  parent_agent_id bigint [ref: > agent_profiles.id, null]
  created_by_manager_id bigint [ref: > users.id, null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Agent profile metadata, agent code, and manager hierarchy'
}

Table agent_manager_profiles {
  id bigint [pk, increment]
  user_id bigint [unique, ref: > users.id]
  manager_code varchar [unique, not null]
  parent_manager_id bigint [ref: > agent_manager_profiles.id, null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Agent manager profile and hierarchy structure'
}

Table nrc_verifications {
  id bigint [pk, increment]
  user_id bigint [ref: > users.id]
  status varchar [default: 'pending']
  rejection_reason text [null]
  verified_by bigint [ref: > users.id, null]
  verified_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'KYC NRC submission and admin approval logs'
}

Table images {
  id bigint [pk, increment]
  user_id bigint [ref: > users.id, null]
  image_type varchar [not null]
  image_path varchar [not null]
  original_name varchar [null]
  image_size int [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Uploaded document attachments (NRC front/back, user photos)'
}

// ------------------------------------------
// WALLETS & FINANCIAL LEDGER
// ------------------------------------------

Table wallets {
  id bigint [pk, increment]
  user_id bigint [unique, ref: > users.id]
  wallet_number varchar [unique, not null]
  balance "decimal(15,2)" [default: 0]
  status varchar [default: 'active']
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'User digital wallet account and balance ledger'
}

Table qr_codes {
  id bigint [pk, increment]
  user_id bigint [ref: > users.id]
  wallet_id bigint [ref: > wallets.id]
  qr_type varchar [null]
  qr_code_value varchar [unique, not null]
  amount "decimal(15,2)" [null]
  is_active boolean [default: true]
  expires_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'QR codes for peer-to-peer transfers or agent cash-out'
}

Table transactions {
  id bigint [pk, increment]
  transaction_number varchar [unique, not null]
  sender_wallet_id bigint [ref: > wallets.id, null]
  receiver_wallet_id bigint [ref: > wallets.id, null]
  receiver_phone varchar(32) [null]
  transaction_type varchar [not null]
  amount "decimal(15,2)" [not null]
  fee "decimal(15,2)" [default: 0]
  qr_id bigint [ref: > qr_codes.id, null]
  external_payment_id bigint [ref: > external_payments.id, null]
  agent_id bigint [ref: > users.id, null]
  status varchar [default: 'pending']
  pin_verified boolean [default: false]
  description varchar [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Comprehensive financial transactions history log'
}

Table transfer_settings {
  id bigint [pk, increment]
  unverified_customer_transfer_limit "decimal(15,2)" [null]
  customer_transfer_fee_percent "decimal(5,2)" [default: 0]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Global transfer fee percentages and unverified user limits'
}

// ------------------------------------------
// EXTERNAL SYSTEM INTEGRATIONS
// ------------------------------------------

Table external_systems {
  id bigint [pk, increment]
  name varchar [not null]
  user_id bigint [ref: > users.id, null]
  system_link varchar [null]
  system_logo varchar [null]
  api_key_hash varchar [null]
  api_key_prefix varchar(12) [null]
  status varchar [default: 'active']
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Registered third-party external merchant software systems'
}

Table external_payments {
  id bigint [pk, increment]
  reference varchar [unique, not null]
  external_system_id bigint [ref: > external_systems.id, null]
  customer_user_id bigint [ref: > users.id]
  agent_user_id bigint [ref: > users.id]
  amount "decimal(15,2)" [not null]
  fee "decimal(15,2)" [default: 0]
  order_reference varchar [null]
  description varchar [null]
  redirect_url varchar [null]
  status varchar [default: 'pending']
  expires_at timestamp [null]
  completed_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]

  Note: 'Payment requests initiated by external merchant systems'
}
```

---

## 🔗 Key Relationships Summary

- **Users & Roles**: `users.role_id > roles.id` (Many users belong to one role).
- **Users & Wallets**: `wallets.user_id - users.id` (One-to-one relationship).
- **Users & Profiles**: `customer_profiles`, `agent_profiles`, `agent_manager_profiles` each have a `1:1` link with `users.id`.
- **Agent Hierarchy**: `agent_profiles.parent_agent_id > agent_profiles.id` (Self-referencing hierarchy).
- **Manager Hierarchy**: `agent_manager_profiles.parent_manager_id > agent_manager_profiles.id` (Self-referencing hierarchy).
- **Wallets & Transactions**: `transactions.sender_wallet_id > wallets.id` and `transactions.receiver_wallet_id > wallets.id`.
- **External Integration Flow**: `external_payments` link external systems (`external_systems.id`) to customers (`customer_user_id`) and agents (`agent_user_id`), which produce corresponding `transactions.external_payment_id`.


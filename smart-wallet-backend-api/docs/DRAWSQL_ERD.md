# Digital Wallet Management System ERD

This document describes the database design for the digital wallet management system and includes DrawSQL-compatible table definitions.

## Overview
The system supports:
- User roles such as admin, agent_manager, agent, and customer
- Wallet management
- QR code payments
- Transactions and money flow
- Customer, agent, and agent-manager profiles
- Agent manager-led agent onboarding flow
- OTP verification and PIN security
- Audit, NRC verification, and image storage tracking

## Core Entities

### 1. roles
Stores user role definitions.

### 2. users
Stores account information for each user.

### 3. otp_verifications
Tracks OTP requests used for login, register, reset PIN, or transaction verification.

### 4. pins
Stores hashed PIN information and lock status for users.

### 5. customer_level_configs
Defines the limits and permissions for customer wallet levels.

### 6. agent_level_configs
Defines commission and operational rules for agent levels.

### 7. customer_profiles
Stores customer-specific profile information and KYC status.

### 8. agent_profiles
Stores agent-specific profile information such as shop details, commission rules, and the agent manager who created the agent.

### 9. agent_manager_profiles
Stores agent-manager-specific profile information such as region, township, approval limits, and manager hierarchy.

### 10. wallets
Represents each user's wallet account.

### 11. qr_codes
Stores static and dynamic QR code data associated with wallets.

### 12. transactions
Records money transfer and payment activities.

### 13. user_devices
Tracks user login devices and session history.

### 14. audit_logs
Stores administrative and system action logs.

### 15. nrc_verifications
Tracks NRC verification submission and approval or rejection status.

### 16. images
Stores uploaded user-related images such as profile and verification documents.

## Relationships
- A role has many users.
- A user has one wallet.
- A user may have one customer profile, one agent profile, or one agent manager profile.
- An admin creates one or many agent manager accounts.
- An agent manager creates one or many agent accounts.
- An agent profile is linked to the agent manager who created it through the created_by_manager_id field.
- An agent manager profile may belong to a parent manager and have many sub-managers.
- A wallet has many QR codes and many transactions.
- A transaction may involve sender and receiver wallets.
- A QR code may be used in many transactions.
- A user may have many OTP verifications, devices, audit logs, NRC verification records, and images.

## DrawSQL Format

```sql
Table roles {
  id bigint [pk]
  name varchar
  description varchar
  created_at timestamp
  updated_at timestamp
}

Table users {
  id bigint [pk]
  phone_number varchar [unique]
  role_id bigint [ref: > roles.id]
  full_name varchar
  email varchar
  nrc_number varchar [unique]
  status varchar
  is_phone_verified boolean
  is_pin_created boolean
  last_login_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table otp_verifications {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  phone_number varchar
  otp_code varchar
  purpose varchar
  status varchar
  attempt_count int
  expires_at timestamp
  verified_at timestamp
  delivery_status varchar
  created_at timestamp
  updated_at timestamp
}

Table pins {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  pin_hash varchar
  failed_attempts int
  is_locked boolean
  locked_until timestamp
  last_changed_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table customer_level_configs {
  id bigint [pk]
  level varchar [unique]
  daily_transfer_limit decimal
  monthly_transfer_limit decimal
  max_wallet_balance decimal
  daily_cash_out_limit decimal
  max_transaction_count_daily int
  can_use_qr_payment boolean
  can_receive_from_agent boolean
  requires_kyc boolean
  is_active boolean
  created_at timestamp
  updated_at timestamp
}

Table agent_level_configs {
  id bigint [pk]
  level varchar [unique]
  daily_cash_limit decimal
  default_commission_rate decimal
  min_float_required decimal
  can_recruit_sub_agent boolean
  is_active boolean
  created_at timestamp
  updated_at timestamp
}

Table customer_profiles {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  level varchar
  custom_limit_override decimal
  kyc_status varchar
  referral_code varchar [unique]
  referred_by bigint [ref: > users.id]
  created_at timestamp
  updated_at timestamp
}

Table agent_profiles {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  agent_code varchar [unique]
  level varchar
  custom_commission_override decimal
  shop_name varchar
  shop_address varchar
  township varchar
  float_balance decimal
  parent_agent_id bigint [ref: > agent_profiles.id]
  total_volume_monthly decimal
  created_by_manager_id bigint [ref: > users.id]
  approved_by bigint [ref: > users.id]
  status varchar
  created_at timestamp
  updated_at timestamp
}

Table agent_manager_profiles {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  manager_code varchar [unique]
  region varchar
  township varchar
  status varchar
  approval_limit decimal
  parent_manager_id bigint [ref: > agent_manager_profiles.id]
  approved_by bigint [ref: > users.id]
  created_at timestamp
  updated_at timestamp
}

Table wallets {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  wallet_number varchar [unique]
  balance decimal
  currency varchar
  status varchar
  created_at timestamp
  updated_at timestamp
}

Table qr_codes {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  wallet_id bigint [ref: > wallets.id]
  qr_type varchar
  qr_code_value varchar [unique]
  amount decimal
  is_active boolean
  expires_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table transactions {
  id bigint [pk]
  transaction_ref varchar [unique]
  sender_wallet_id bigint [ref: > wallets.id]
  receiver_wallet_id bigint [ref: > wallets.id]
  transaction_type varchar
  amount decimal
  fee decimal
  qr_id bigint [ref: > qr_codes.id]
  agent_id bigint [ref: > users.id]
  status varchar
  pin_verified boolean
  description varchar
  created_at timestamp
  updated_at timestamp
}

Table user_devices {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  device_id varchar
  device_name varchar
  ip_address varchar
  login_at timestamp
  logout_at timestamp
  is_active boolean
  created_at timestamp
  updated_at timestamp
}

Table audit_logs {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  action varchar
  target_table varchar
  target_id bigint
  details text
  created_at timestamp
  updated_at timestamp
}

Table nrc_verifications {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  status varchar
  rejection_reason text
  verified_by bigint [ref: > users.id]
  verified_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table images {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  image_type varchar
  image_path varchar
  original_name varchar
  image_size int
  created_at timestamp
  updated_at timestamp
}
```

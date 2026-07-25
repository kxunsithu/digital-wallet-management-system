# Digital Wallet Management System ERD

This document reflects the database schema currently implemented in the Laravel migrations and is written in DrawSQL-compatible table syntax.

## Overview
The current backend supports:
- Role-based user accounts
- State and township reference data
- Customer, agent, and agent-manager profile records
- Wallet creation and balance tracking
- QR code generation and payment references
- Transaction records with sender/receiver wallet flow
- OTP verification and PIN protection
- NRC verification and image attachments

## Core Entities

### 1. roles
Stores role definitions for the platform.

### 2. state_regions
Stores Myanmar state/region reference data.

### 3. townships
Stores township reference data linked to a state region.

### 4. users
Stores the main user account information.

### 5. otp_verifications
Tracks OTP requests used for verification flows.

### 6. pins
Stores the user PIN hash and lock state.

### 7. customer_profiles
Stores customer-specific profile data and referral/KYC details.

### 8. agent_profiles
Stores agent profile information, hierarchy, and links to the creating manager.

### 9. agent_manager_profiles
Stores agent-manager profile information and manager hierarchy.

### 10. wallets
Represents each user's wallet account.

### 11. qr_codes
Stores QR code payloads linked to a wallet.

### 12. transactions
Records transfer/payment activity between wallets and optional QR usage.

### 13. nrc_verifications
Tracks NRC verification submissions and approval outcomes.

### 14. images
Stores uploaded image metadata for user-related documents.

## Relationships
- A role has many users.
- A state region has many townships.
- A township belongs to one state region.
- A user belongs to one role.
- A user has one wallet, one PIN record, and may have many OTP verifications, QR codes, NRC verifications, and images.
- A customer profile belongs to one user and may reference a referrer user, plus a state region and township.
- An agent profile belongs to one user and may reference a parent agent and the manager who created the agent.
- An agent manager profile belongs to one user and may reference a parent manager.
- A wallet is owned by one user and can have many QR codes and many transactions as sender or receiver.
- A transaction references a sender wallet, a receiver wallet, an optional QR code, and an optional agent user.

## DrawSQL Format

```sql
Table roles {
  id bigint [pk]
  name varchar
  description varchar [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table state_regions {
  id bigint [pk]
  name varchar [unique]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table townships {
  id bigint [pk]
  state_region_id bigint [ref: > state_regions.id]
  name varchar
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table users {
  id bigint [pk]
  phone_number varchar [unique, null]
  role_id bigint [ref: > roles.id, null]
  full_name varchar [null]
  nrc_number varchar [unique, null]
  status varchar [default: 'active']
  is_phone_verified boolean [default: false]
  is_pin_created boolean [default: false]
  last_login_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table otp_verifications {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  phone_number varchar
  otp_code varchar
  purpose varchar
  status varchar [default: 'pending']
  attempt_count int [default: 0]
  expires_at timestamp [null]
  verified_at timestamp [null]
  delivery_status varchar [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table pins {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  pin_hash varchar
  failed_attempts int [default: 0]
  is_locked boolean [default: false]
  locked_until timestamp [null]
  last_changed_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table customer_profiles {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  custom_limit_override decimal(15,2) [null]
  kyc_status varchar [default: 'pending']
  referral_code varchar [unique, null]
  referred_by bigint [ref: > users.id, null]
  state_region_id bigint [ref: > state_regions.id, null]
  township_id bigint [ref: > townships.id, null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table agent_profiles {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  agent_code varchar [unique]
  shop_name varchar [null]
  shop_address varchar [null]
  state_region_id bigint [ref: > state_regions.id, null]
  township_id bigint [ref: > townships.id, null]
  parent_agent_id bigint [ref: > agent_profiles.id, null]
  created_by_manager_id bigint [ref: > users.id, null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table agent_manager_profiles {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  manager_code varchar [unique]
  state_region_id bigint [ref: > state_regions.id, null]
  township_id bigint [ref: > townships.id, null]
  parent_manager_id bigint [ref: > agent_manager_profiles.id, null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table wallets {
  id bigint [pk]
  user_id bigint [unique, ref: > users.id]
  wallet_number varchar [unique]
  balance decimal(15,2) [default: 0]
  status varchar [default: 'active']
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table qr_codes {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  wallet_id bigint [ref: > wallets.id]
  qr_type varchar [null]
  qr_code_value varchar [unique]
  amount decimal(15,2) [null]
  is_active boolean [default: true]
  expires_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table transactions {
  id bigint [pk]
  transaction_number varchar [unique]
  sender_wallet_id bigint [ref: > wallets.id, null]
  receiver_wallet_id bigint [ref: > wallets.id, null]
  transaction_type varchar
  amount decimal(15,2)
  fee decimal(15,2) [default: 0]
  qr_id bigint [ref: > qr_codes.id, null]
  agent_id bigint [ref: > users.id, null]
  status varchar [default: 'pending']
  pin_verified boolean [default: false]
  description varchar [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table nrc_verifications {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  status varchar [default: 'pending']
  rejection_reason text [null]
  verified_by bigint [ref: > users.id, null]
  verified_at timestamp [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}

Table images {
  id bigint [pk]
  user_id bigint [ref: > users.id, null]
  image_type varchar
  image_path varchar
  original_name varchar [null]
  image_size int [null]
  created_at timestamp [null]
  updated_at timestamp [null]
}
```

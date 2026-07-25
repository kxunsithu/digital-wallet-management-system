# Digital Wallet Management System Specification & Architecture

## Executive Summary

This document describes the Digital Wallet Management System architecture, workflows, user roles, security rules, and business policies. It is intended for developers, QA testers, product managers, and system administrators.

# 1. Overall System Architecture

The Digital Wallet Management System uses a hierarchical wallet architecture with four primary roles.

![Overall System Architecture](overall-system-architecture.png)

```text
Admin
   │
   ▼
Agent Manager
   │
   ▼
Agent
   │
   ▼
Customer
```

Float is distributed from higher roles to lower roles, while float returns flow from lower roles back upward. Customers can also perform peer-to-peer transfers among themselves.

# 2. Core Workflows

## Authentication

- Users authenticate with phone number and OTP.
- After OTP verification, users set a secure 4-digit PIN.
- Successful authentication issues a Laravel Sanctum bearer token.

## Float Distribution

Admin → Agent Manager → Agent

## Customer Services

Agents provide the following customer services:

- Cash In
- Cash Out
- QR Payment

## Customer Transfers

Customers can transfer money using:

- Phone number
- Wallet number
- QR code

## KYC Verification

Customers can submit NRC front and back images for verification.

The verification process moves through:

- Pending
- Verified
- Rejected

Admin reviews and updates customer KYC status.

# 3. User Roles

## Admin

### Features

- Create, update, and delete Agent Manager accounts.
- Manage Agent accounts and view their wallet status.
- Approve or reject customer KYC/NRC verification requests.
- Manage State Region and Township reference data.
- Review system-wide transaction history and wallet data.
- Send float to Agent Managers within the hierarchical flow.
- Access administrative APIs with OTP and PIN security.

## Agent Manager

### Features

- Create new Agent accounts and assign unique agent codes.
- Update agent details, including shop name, address, region, and NRC documents.
- Manage agents they created and monitor agent wallet data.
- Search and filter agents by status, region, township, phone, name, or code.
- Distribute float to Agents and receive float returns.
- Transfer float back to Admin when required.
- Use authenticated agent manager APIs with OTP and PIN verification.

## Agent

### Features

- Provide customer-facing services: Cash In, Cash Out, and QR Payment.
- Transfer money to Customers and Agent Managers.
- Receive payments via QR code, phone number, or wallet number.
- Maintain wallet balance and transaction history.
- Upload or update NRC documents and manage verification status.
- Use secure PIN verification for all transactions.

## Customer

### Features

- Register and authenticate with phone number and OTP.
- Create, verify, reset, and change a secure 4-digit PIN.
- Submit NRC front and back images for KYC verification.
- Update profile information and upload a profile picture.
- Access a personal QR code for receiving payments.
- Send money to other Customers and Agents using phone, wallet number, or QR code.
- Receive money from customers or agents.
- View transaction receipts, transaction history, and wallet details.
- Use authenticated customer APIs with PIN-secured transfers.

# 4. Money Transfer Rules


| Sender        | Receiver      | Allowed |
| ------------- | ------------- | ------- |
| Admin         | Agent Manager | ✅      |
| Agent Manager | Agent         | ✅      |
| Agent Manager | Admin         | ✅      |
| Agent         | Customer      | ✅      |
| Agent         | Agent Manager | ✅      |
| Customer      | Customer      | ✅      |
| Customer      | Agent         | ✅      |

## Disallowed Transfers

- Admin ↔ Customer
- Admin ↔ Agent
- Agent Manager ↔ Customer

# 5. Security Rules

- Both sender and receiver accounts must be active.
- Wallets must be active to process transfers.
- All transactions require PIN verification.
- PINs are stored securely using bcrypt hashing.
- NRC number and user role cannot be changed after account creation.
- Profile and NRC images must be uploaded as multipart/form-data.

# 6. Notifications

When money is received, the system provides:

- Notification records
- Badge count updates
- Sound alerts
- Real-time toast messages

# 7. Transaction Receipt

Each transaction automatically generates:

- A unique transaction number
- A receipt
- A history record

# 8. Summary

The system is built around:

- Hierarchical wallet architecture
- Secure authentication
- Float management
- Customer wallet services
- QR payments
- Cash In / Cash Out operations
- KYC verification
- Transaction receipts and history
- Real-time notifications

This design prioritizes role separation, security, and usability.

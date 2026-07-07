Digital Wallet Management System

Role & Money Flow Explanation Note

1. System Overview

The Digital Wallet Management System is a system that allows users to perform money transfers, cash-ins, cash-outs, and manage wallet balances among themselves.

The system consists of three main roles:

1. Customer
2. Agent
3. Administrator

---

2. Customer Role

A Customer is a user of the Digital Wallet.

Main Features

Account Management

- Registration
- Login / Logout
- Account Verification with OTP
- Profile Update

Wallet Management

- View Wallet Balance
- View Wallet Information

Money Transfer

A Customer can transfer money to another Customer.

Example:

Customer A → Customer B

Flow:

1. Customer A selects the Receiver.
2. Enters the Transfer Amount.
3. Confirms with PIN/OTP.
4. The System checks the Balance.
5. Transfers money and saves the Transaction Record.

QR Transfer

Customers can transfer money using QR Code.

Flow:

Customer A Generates QR
→
Customer B Scans QR
→
Enters Amount
→
Confirms
→
Transfer Complete

---

3. Agent Role

An Agent provides Cash In and Cash Out services for Customers.

Cash In Flow

Agent → Customer Wallet

Example:
A Customer gives cash to an Agent to deposit money into their Wallet.

Flow:

Cash given by Customer
→
Agent performs Cash In in the System
→
Customer Wallet Balance increases

---

Cash Out Flow

Customer → Agent

Example:
A Customer withdraws money from their Wallet.

Flow:

Customer Cash Out Request
→
Agent Verifies
→
System reduces Customer Balance
→
Agent gives Cash to Customer

---

4. Administrator Role

An Administrator manages the entire System.

Main Features

User Management

- Manage Customer Accounts
- Manage Agent Accounts
- Control User Status

Transaction Monitoring

- View all Transactions
- Check Transaction History

Agent Wallet Top-up

Admin can top up the Agent Wallet Balance.

Flow:

Admin
→
Agent Wallet Top-up
→
Agent Balance increases
→
Agent can provide Cash In / Cash Out Service

---

5. Admin Bonus / Adjustment

Admin can give Bonus or Adjustment to Customers as a Special Transaction.

Example:

- Welcome Bonus
- Promotion Reward
- Compensation

Flow:

Admin
→
Enters Bonus Amount
→
Customer Wallet Balance increases

---

6. Overall Money Flow Summary

1. Customer to Customer Transfer

Customer A
→
Customer B

Usage:

- Personal Transfer
- QR Transfer

2. Agent Cash In

Agent
→
Customer Wallet

Usage:

- Deposit money into Wallet

3. Customer Cash Out

Customer Wallet
→
Agent

Usage:

- Withdraw money from Wallet

4. Admin Agent Top-up

Administrator
→
Agent Wallet

Usage:

- Top up Agent Service Balance

5. Admin Customer Bonus

Administrator
→
Customer Wallet

Usage:

- Give Reward / Adjustment

---

System Design Principle

- A Customer is a money user.
- An Agent is a Cash Service Provider.
- An Administrator is a System Controller.
- Each transaction must be recorded in the Database.
- Every balance change must be tracked with Transaction History.

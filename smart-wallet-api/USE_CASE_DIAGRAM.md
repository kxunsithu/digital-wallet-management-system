# Digital Wallet Management System - Use Case Diagram

This file contains a Mermaid-based use case diagram for the digital wallet management system.

## Actors
- Customer
- Agent
- Admin
- SMS Gateway

## Main Use Cases
- Register account
- Verify phone with OTP
- Create PIN
- Create wallet
- Submit KYC
- View balance
- Transfer money
- Receive money
- Generate/scan QR payment
- Cash in / cash out
- View transaction history
- Approve agent/customer requests
- Manage users and accounts
- Send OTP SMS

## Mermaid Diagram

```mermaid
flowchart LR
    Customer([Customer])
    Agent([Agent])
    Admin([Admin])
    SMS([SMS Gateway])

    subgraph System["Digital Wallet Management System"]
        UC1["Register Account"]
        UC2["Verify Phone via OTP"]
        UC3["Create PIN"]
        UC4["Create Wallet"]
        UC5["Submit KYC"]
        UC6["View Balance"]
        UC7["Transfer Money"]
        UC8["Receive Money"]
        UC9["Generate / Scan QR"]
        UC10["Cash In / Cash Out"]
        UC11["View Transaction History"]
        UC12["Approve Agent / Customer"]
        UC13["Manage User Accounts"]
        UC14["Send OTP SMS"]
        UC15["Monitor Transactions"]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9
    Customer --> UC10
    Customer --> UC11

    Agent --> UC9
    Agent --> UC10
    Agent --> UC11
    Agent --> UC12

    Admin --> UC12
    Admin --> UC13
    Admin --> UC15

    SMS --> UC14
    UC2 --> UC14
```

## Notes
This diagram is suitable for documentation, presentations, and Draw.io/Mermaid-based viewers.

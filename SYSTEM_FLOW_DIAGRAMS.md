# System & Role Flowcharts (with Inputs & Conditionals)

This document presents clear, standard **Flowcharts** for each role in the **Digital Wallet Management System (DWMS)**, including explicit user inputs `[/Input/]` and decision points `{Conditional?}`.

---

## 1. Overall Money & Float Flow

```mermaid
flowchart TD
    Admin["Admin (System Treasury)"]
    Manager["Agent Manager"]
    Agent["Agent"]
    Customer["Customer"]

    %% Distribution
    Admin -->|"1. Distribute Float"| Manager
    Manager -->|"2. Distribute Float"| Agent
    Agent -->|"3. Cash In"| Customer

    %% Return
    Agent -.->"4. Return Float"| Manager
    Manager -.->"5. Return Float"| Admin

    %% Transfers
    Customer <-->|"P2P Money Transfer"| Customer
    Customer ==>|"QR Payment"| Agent
```

---

## 2. Admin Flowchart

```mermaid
flowchart TD
    Start([Start]) --> InputLogin[/Input Phone & OTP/]
    InputLogin --> PINCheck{Valid PIN?}
    PINCheck -- No --> InputLogin
    PINCheck -- Yes --> Dashboard[Admin Dashboard]

    %% Branch 1: Manage Managers
    Dashboard --> A1[Manage Agent Managers]
    A1 --> InputMgr[/Input Manager Details/] --> EndAdmin([End])

    %% Branch 2: Review KYC
    Dashboard --> A2[Review KYC Documents]
    A2 --> KYCVal{Approve or Reject?}
    KYCVal -- Approve --> PassKYC[Set Status = Verified] --> EndAdmin
    KYCVal -- Reject --> FailKYC[Set Status = Rejected] --> EndAdmin

    %% Branch 3: Transfer Float
    Dashboard --> A3[Transfer Float]
    A3 --> InputFloat[/Input Amount & Security PIN/]
    InputFloat --> BalCheck1{Sufficient Balance & Valid PIN?}
    BalCheck1 -- No --> Err1[Display Error] --> Dashboard
    BalCheck1 -- Yes --> Exec1[Credit Agent Manager Wallet] --> EndAdmin

    %% Branch 4: Reports
    Dashboard --> A4[View System Reports] --> EndAdmin
```

---

## 3. Agent Manager Flowchart

```mermaid
flowchart TD
    Start([Start]) --> InputLogin[/Input Phone & OTP/]
    InputLogin --> PINCheck{Valid PIN?}
    PINCheck -- No --> InputLogin
    PINCheck -- Yes --> Dashboard[Manager Dashboard]

    %% Branch 1: Create Agent
    Dashboard --> M1[Create Agent]
    M1 --> InputAgent[/Input Agent Details & Code/] --> EndMgr([End])

    %% Branch 2: Distribute Float
    Dashboard --> M2[Distribute Float to Agent]
    M2 --> InputFloat1[/Input Agent, Amount & Security PIN/]
    InputFloat1 --> BalCheck1{Sufficient Balance & Valid PIN?}
    BalCheck1 -- No --> Err1[Display Error] --> Dashboard
    BalCheck1 -- Yes --> Exec1[Credit Agent Wallet] --> EndMgr

    %% Branch 3: Return Float to Admin
    Dashboard --> M3[Return Float to Admin]
    M3 --> InputFloat2[/Input Amount & Security PIN/]
    InputFloat2 --> BalCheck2{Sufficient Balance & Valid PIN?}
    BalCheck2 -- No --> Err2[Display Error] --> Dashboard
    BalCheck2 -- Yes --> Exec2[Credit Admin Wallet] --> EndMgr
```

---

## 4. Agent Flowchart

```mermaid
flowchart TD
    Start([Start]) --> InputLogin[/Input Phone & OTP/]
    InputLogin --> PINCheck{Valid PIN?}
    PINCheck -- No --> InputLogin
    PINCheck -- Yes --> Dashboard[Agent Dashboard]

    %% Branch 1: Cash In
    Dashboard --> Ag1[Cash In to Customer]
    Ag1 --> InputCashIn[/Input Customer Phone/Wallet & Amount/]
    InputCashIn --> PIN1[/Input Security PIN/]
    PIN1 --> Check1{Sufficient Balance & Valid PIN?}
    Check1 -- No --> Err1[Display Error] --> Dashboard
    Check1 -- Yes --> Exec1[Credit Customer Wallet] --> Receipt1[Generate Receipt] --> EndAgent([End])

    %% Branch 2: Accept Payment
    Dashboard --> Ag2[Accept QR Payment]
    Ag2 --> ShowQR[Display Agent QR Code]
    ShowQR --> PayCheck{Payment Received?}
    PayCheck -- Yes --> Receipt2[Generate Receipt] --> EndAgent

    %% Branch 3: Return Float
    Dashboard --> Ag3[Return Float to Manager]
    Ag3 --> InputFloat[/Input Amount & Security PIN/]
    InputFloat --> Check2{Sufficient Balance & Valid PIN?}
    Check2 -- No --> Err2[Display Error] --> Dashboard
    Check2 -- Yes --> Exec2[Credit Manager Wallet] --> EndAgent

    %% Branch 4: NRC Upload
    Dashboard --> Ag4[Upload NRC Documents]
    Ag4 --> InputNRC[/Upload NRC Front & Back Photos/] --> EndAgent
```

---

## 5. Customer Flowchart

```mermaid
flowchart TD
    Start([Start]) --> InputLogin[/Input Phone & OTP/]
    LoginPIN{Valid PIN?}
    InputLogin --> LoginPIN
    LoginPIN -- No --> InputLogin
    LoginPIN -- Yes --> Dashboard[Customer Dashboard]

    %% Branch 1: Send Money
    Dashboard --> C1[Send Money]
    C1 --> InputTransfer[/Input Phone/Wallet/QR & Amount/]
    InputTransfer --> InputPIN[/Input 4-Digit Security PIN/]
    InputPIN --> TransCheck{Sufficient Balance & Valid PIN?}
    TransCheck -- No --> ErrTrans[Display Error] --> Dashboard
    TransCheck -- Yes --> ExecTrans[Credit Receiver Wallet] --> Receipt[View & Share Receipt] --> EndCust([End])

    %% Branch 2: Receive Money
    Dashboard --> C2[Receive Money]
    C2 --> ShowQR[Display Personal QR Code] --> EndCust

    %% Branch 3: Submit KYC
    Dashboard --> C3[Submit KYC]
    C3 --> InputKYC[/Upload Front & Back NRC Photos/] --> EndCust
```

# Simplified System Use Case Diagrams (with Includes & Extends)

This document presents concise, high-level **Use Case Diagrams** for each role in the **Digital Wallet Management System (DWMS)**, highlighting key functional relationships using standard UML `<<include>>` and `<<extend>>` dependencies.

---

## 1. Admin Use Case Diagram

```mermaid
flowchart LR
    Admin([System Admin])

    subgraph AdminPortal["Admin Dashboard"]
        UC1[Manage Agent Managers]
        UC1a[Toggle Account Status]

        UC2[Review KYC & NRC]
        UC2a[Verify or Reject Documents]

        UC3[Manage Locations & Regions]

        UC4[Transfer Treasury Float]
        UC4a[Verify Security PIN]

        UC5[Audit Transactions & Wallets]
        UC6[Manage System Settings]
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6

    %% Relationships
    UC2 -. includes .-> UC2a
    UC4 -. includes .-> UC4a
    UC1 -. extends .-> UC1a
```

---

## 2. Agent Manager Use Case Diagram

```mermaid
flowchart LR
    Manager([Agent Manager])

    subgraph ManagerPortal["Agent Manager Workspace"]
        UC1[Create & Manage Agents]
        UC1a[Assign Agent Code]
        UC1b[Toggle Agent Status]

        UC2[Distribute Float to Agents]
        UC2a[Verify Security PIN]

        UC3[Receive Float Returns]

        UC4[Return Float to Admin]
        UC4a[Verify Security PIN]

        UC5[View Agent Wallets & Logs]
    end

    Manager --> UC1
    Manager --> UC2
    Manager --> UC3
    Manager --> UC4
    Manager --> UC5

    %% Relationships
    UC1 -. includes .-> UC1a
    UC1 -. extends .-> UC1b
    UC2 -. includes .-> UC2a
    UC4 -. includes .-> UC4a
```

---

## 3. Agent Use Case Diagram

```mermaid
flowchart LR
    Agent([Agent])

    subgraph AgentApp["Agent Mobile App"]
        UC1[User Authentication]
        UC1a[Verify OTP & PIN]
        UC1b[Reset PIN]

        UC2[Perform Cash In]
        UC2a[Verify Security PIN]
        UC2b[Scan Customer QR Code]

        UC3[Receive QR Payment]

        UC4[Return Float to Manager]
        UC4a[Verify Security PIN]

        UC5[View Balance & Transactions]
        UC6[Submit NRC Documents]
    end

    Agent --> UC1
    Agent --> UC2
    Agent --> UC3
    Agent --> UC4
    Agent --> UC5
    Agent --> UC6

    %% Relationships
    UC1 -. includes .-> UC1a
    UC1 -. extends .-> UC1b
    UC2 -. includes .-> UC2a
    UC2 -. extends .-> UC2b
    UC4 -. includes .-> UC4a
```

---

## 4. Customer Use Case Diagram

```mermaid
flowchart LR
    Customer([Customer])

    subgraph CustomerApp["Customer Mobile App"]
        UC1[User Authentication]
        UC1a[Verify OTP & PIN]
        UC1b[Reset Forgot PIN]

        UC2[Submit KYC Verification]
        UC2a[Resubmit After Rejection]

        UC3[Send Money]
        UC3a[Verify Security PIN]
        UC3b[Scan Recipient QR Code]
        UC3c[Save & Share Receipt]

        UC4[Receive Money via QR]

        UC5[View Wallet & Transactions]
        UC6[Manage Profile & Preferences]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6

    %% Relationships
    UC1 -. includes .-> UC1a
    UC1 -. extends .-> UC1b
    UC2 -. extends .-> UC2a
    UC3 -. includes .-> UC3a
    UC3 -. extends .-> UC3b
    UC3 -. extends .-> UC3c
```

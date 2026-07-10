# Smart Wallet Admin Frontend — Implementation Plan

## Overview

Build a complete Admin-only React + shadcn/UI frontend for the Smart Wallet system. The app will connect to the deployed backend at `https://smart-wallet-api-vm58.onrender.com`. It will support English/Burmese language toggling and cover all admin-facing API features.

---

## Admin Features to Implement

| Feature | API Endpoints |
|---|---|
| Admin Login (OTP + PIN) | `POST /auth/request-otp`, `POST /auth/verify-otp`, `POST /auth/verify-pin` |
| Logout | `POST /auth/logout` |
| User Management | `GET /admin/users`, `PATCH /admin/users/{id}/status` |
| Agent Approval | `PATCH /admin/agents/{id}/approve` |
| Customer Level Configs | `GET /admin/customer-level-configs`, `PATCH /admin/customer-level-configs/{id}` |
| Agent Level Configs | `GET /admin/agent-level-configs`, `PATCH /admin/agent-level-configs/{id}` |
| NRC Verifications | `GET /admin/nrc-verifications`, `PATCH /admin/nrc-verifications/{id}` |
| Audit Logs | `GET /admin/audit-logs` |

---

## Tech Stack

- **Framework**: React (Vite)
- **UI**: shadcn/UI + Radix UI components
- **Routing**: React Router v6
- **State**: Context API + React Query (TanStack Query) for server state
- **HTTP**: Axios with auth interceptors
- **i18n**: react-i18next (EN/MY toggle)
- **Forms**: React Hook Form + Zod validation
- **Icons**: lucide-react

---

## Project Structure

```
smart-wallet-frontend-admin/
├── src/
│   ├── api/           # Axios instance + API service functions
│   ├── components/    # Shared UI components (Layout, Sidebar, etc.)
│   ├── pages/         # Page components per feature
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # Auth context, Language context
│   ├── i18n/          # Translation files (en.json, my.json)
│   └── lib/           # Utilities
```

---

## Pages

1. **Login** — OTP request → OTP verify → PIN verify (3-step flow)
2. **Dashboard** — Summary stats (user counts by role/status)
3. **Users** — Paginated table, filter by role/status/search, update status
4. **Agents** — Filtered agent list, approve pending agents
5. **NRC Verifications** — View pending NRC docs (front/back images), approve/reject
6. **Customer Level Configs** — Edit limits per level
7. **Agent Level Configs** — Edit limits per level
8. **Audit Logs** — Paginated log viewer with filters

---

## Design Principles

- Clean, minimal admin UI (no gradients)
- White/light gray background with neutral accents
- shadcn/UI components throughout (Table, Dialog, Badge, Button, Input, etc.)
- Responsive sidebar navigation
- Language toggle (EN | မြန်မာ) in the header

---

## Verification Plan

- Run dev server and verify login flow works against the real API
- Test each admin feature end-to-end
- Check language toggle switches all visible text

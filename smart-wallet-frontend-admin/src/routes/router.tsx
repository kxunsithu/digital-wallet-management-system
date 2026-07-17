import { createBrowserRouter, Navigate } from "react-router-dom";
import { getCookie } from "@/lib/cookies";
import LoginPage from "../pages/auth/login";
import DashboardPage from "../pages/dashboard";
import ProtectedRoute from "./ProtectedRoute";

import AgentManagersPage from "../pages/agent-managers";
import AdminTransactions from "../pages/transactions/AdminTransactions";
import SystemTransactions from "../pages/transactions/SystemTransactions";
import ManagerTransactions from "../pages/transactions/ManagerTransactions";
import TransactionDetail from "../pages/transactions/TransactionDetail";
import CreateAgentManager from "../pages/agent-managers/CreateAgentManager";
import EditAgentManager from "../pages/agent-managers/EditAgentManager";
import AgentManagerDetail from "../pages/agent-managers/AgentManagerDetail";
import AgentsPage from "../pages/agents";
import AgentDetail from "../pages/agents/AgentDetail";
import CreateAgent from "../pages/agents/CreateAgent";
import EditAgent from "../pages/agents/EditAgent";
import CustomersPage from "../pages/customers";
import CustomerDetail from "../pages/customers/CustomerDetail";
import ManageLocations from "../pages/locations/ManageLocations";
import SystemWalletPage from "../pages/system-wallet";
import WalletsPage from "../pages/wallets";
import ManagerTransferPage from "../pages/agent-manager-wallet";
import ProfilePage from "../pages/profile";

const ADMIN_ONLY = ["admin"];
const ADMIN_AND_MANAGER = ["admin", "agent_manager"];
const MANAGER_ONLY = ["agent_manager"];

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_AND_MANAGER}>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // ─── Agent Manager list & CRUD: admin only ─────────────────────────────────
  {
    path: "/agent-managers",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <AgentManagersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agent-managers/create",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <CreateAgentManager />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agent-managers/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <EditAgentManager />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agent-managers/:id",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <AgentManagerDetail />
      </ProtectedRoute>
    ),
  },

  // ─── Agents: admin + agent_manager ─────────────────────────────────────────
  {
    path: "/agents",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_AND_MANAGER}>
        <AgentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agents/create",
    element: (
      <ProtectedRoute allowedRoles={MANAGER_ONLY}>
        <CreateAgent />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agents/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={MANAGER_ONLY}>
        <EditAgent />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agents/:id",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_AND_MANAGER}>
        <AgentDetail />
      </ProtectedRoute>
    ),
  },

  // ─── Transfer: agent_manager only ──────────────────────────────────────────
  {
    path: "/transfer",
    element: (
      <ProtectedRoute allowedRoles={MANAGER_ONLY}>
        <ManagerTransferPage />
      </ProtectedRoute>
    ),
  },

  // ─── Customers: admin only ─────────────────────────────────────────────────
  {
    path: "/customers",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <CustomersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/customers/:id",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <CustomerDetail />
      </ProtectedRoute>
    ),
  },

  // ─── Locations: admin only ──────────────────────────────────────────────────
  {
    path: "/locations",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <ManageLocations />
      </ProtectedRoute>
    ),
  },

  // ─── System Wallet: admin only ──────────────────────────────────────────────
  {
    path: "/system-wallet",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <SystemWalletPage />
      </ProtectedRoute>
    ),
  },

  // ─── Transactions: admin and manager pages ─────────────────────────────────
  {
    path: "/transactions",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <AdminTransactions />
      </ProtectedRoute>
    ),
  },
  {
    path: "/transactions/system",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <SystemTransactions />
      </ProtectedRoute>
    ),
  },
  {
    path: "/transactions/my",
    element: (
      <ProtectedRoute allowedRoles={MANAGER_ONLY}>
        <ManagerTransactions />
      </ProtectedRoute>
    ),
  },
  {
    path: "/transactions/:id",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_AND_MANAGER}>
        <TransactionDetail />
      </ProtectedRoute>
    ),
  },

  // ─── Wallets: admin only ────────────────────────────────────────────────────
  {
    path: "/wallets",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <WalletsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/wallets/:id",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <WalletsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/",
    element: getCookie("admin_access_token") ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Navigate to="/login" replace />
    ),
  },
]);

export default router;

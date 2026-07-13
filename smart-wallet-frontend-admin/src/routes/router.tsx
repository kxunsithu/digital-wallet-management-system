import { createBrowserRouter, Navigate } from "react-router-dom";
import { getCookie } from "@/lib/cookies";
import LoginPage from "../pages/auth/login";
import DashboardPage from "../pages/dashboard";
import ProtectedRoute from "./ProtectedRoute";

import AgentManagersPage from "../pages/agent-managers";
import CreateAgentManager from "../pages/agent-managers/CreateAgentManager";
import EditAgentManager from "../pages/agent-managers/EditAgentManager";
import AgentManagerDetail from "../pages/agent-managers/AgentManagerDetail";
import AgentsPage from "../pages/agents";
import AgentDetail from "../pages/agents/AgentDetail";
import CustomersPage from "../pages/customers";
import CustomerDetail from "../pages/customers/CustomerDetail";
import ManageLocations from "../pages/locations/ManageLocations";
import SystemWalletPage from "../pages/system-wallet";
import WalletsPage from "../pages/wallets";

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
    path: "/agent-managers",
    element: (
      <ProtectedRoute>
        <AgentManagersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agent-managers/create",
    element: (
      <ProtectedRoute>
        <CreateAgentManager />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agent-managers/:id/edit",
    element: (
      <ProtectedRoute>
        <EditAgentManager />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agent-managers/:id",
    element: (
      <ProtectedRoute>
        <AgentManagerDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agents",
    element: (
      <ProtectedRoute>
        <AgentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agents/:id",
    element: (
      <ProtectedRoute>
        <AgentDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/customers",
    element: (
      <ProtectedRoute>
        <CustomersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/customers/:id",
    element: (
      <ProtectedRoute>
        <CustomerDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/locations",
    element: (
      <ProtectedRoute>
        <ManageLocations />
      </ProtectedRoute>
    ),
  },
  {
    path: "/system-wallet",
    element: (
      <ProtectedRoute>
        <SystemWalletPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/wallets",
    element: (
      <ProtectedRoute>
        <WalletsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/wallets/:id",
    element: (
      <ProtectedRoute>
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

import type { ReactNode, ReactElement } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/layout/AdminLayout'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import UsersPage from '@/pages/Users'
import AgentsPage from '@/pages/Agents'
import NrcVerificationsPage from '@/pages/NrcVerifications'
import CustomerLevelConfigsPage from '@/pages/CustomerLevelConfigs'
import AgentLevelConfigsPage from '@/pages/AgentLevelConfigs'
import AuditLogsPage from '@/pages/AuditLogs'

function RequireAuth({ children }: { children: ReactNode }): ReactElement {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children as ReactElement : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="nrc-verifications" element={<NrcVerificationsPage />} />
          <Route path="customer-level-configs" element={<CustomerLevelConfigsPage />} />
          <Route path="agent-level-configs" element={<AgentLevelConfigsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return <AppRoutes />
}

export default App

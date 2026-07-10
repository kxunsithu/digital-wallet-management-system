import apiClient from './client'

// ── Auth ──
export const authApi = {
  requestOtp: (phone_number: string) =>
    apiClient.post('/auth/request-otp', { phone_number }),

  verifyOtp: (phone_number: string, otp_code: string) =>
    apiClient.post('/auth/verify-otp', { phone_number, otp_code }),

  verifyPin: (user_id: number, pin: string, device_id?: string, device_name?: string) =>
    apiClient.post('/auth/verify-pin', {
      user_id,
      pin,
      device_id: device_id || 'admin-web',
      device_name: device_name || 'Admin Browser',
    }),

  logout: () => apiClient.post('/auth/logout'),
}

// ── Admin ──
export const adminApi = {
  // Users
  getUsers: (params?: {
    role?: string
    status?: string
    search?: string
    per_page?: number
    page?: number
  }) => apiClient.get('/admin/users', { params }),

  updateUserStatus: (id: number, status: string) =>
    apiClient.patch(`/admin/users/${id}/status`, { status }),

  // Agents
  approveAgent: (id: number) =>
    apiClient.patch(`/admin/agents/${id}/approve`),

  // Customer Level Configs
  getCustomerLevelConfigs: () =>
    apiClient.get('/admin/customer-level-configs'),

  updateCustomerLevelConfig: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/customer-level-configs/${id}`, data),

  // Agent Level Configs
  getAgentLevelConfigs: () =>
    apiClient.get('/admin/agent-level-configs'),

  updateAgentLevelConfig: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/agent-level-configs/${id}`, data),

  // Audit Logs
  getAuditLogs: (params?: {
    user_id?: number
    action?: string
    target_table?: string
    date_from?: string
    date_to?: string
    per_page?: number
    page?: number
  }) => apiClient.get('/admin/audit-logs', { params }),

  // NRC Verifications
  getNrcVerifications: (params?: {
    status?: string
    per_page?: number
    page?: number
  }) => apiClient.get('/admin/nrc-verifications', { params }),

  verifyNrc: (id: number, status: 'approved' | 'rejected', rejection_reason?: string) =>
    apiClient.patch(`/admin/nrc-verifications/${id}`, { status, rejection_reason }),
}

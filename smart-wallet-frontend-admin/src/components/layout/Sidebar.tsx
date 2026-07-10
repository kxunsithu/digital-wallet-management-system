import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api/services'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Settings,
  ClipboardList,
  LogOut,
  Wallet,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
  { to: '/users', icon: Users, labelKey: 'sidebar.users' },
  { to: '/agents', icon: UserCheck, labelKey: 'sidebar.agents' },
  { to: '/nrc-verifications', icon: FileText, labelKey: 'sidebar.nrcVerifications' },
  { to: '/customer-level-configs', icon: Settings, labelKey: 'sidebar.customerLevelConfigs' },
  { to: '/agent-level-configs', icon: Shield, labelKey: 'sidebar.agentLevelConfigs' },
  { to: '/audit-logs', icon: ClipboardList, labelKey: 'sidebar.auditLogs' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Smart Wallet</p>
          <p className="text-xs text-slate-500">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 rounded-md bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium text-slate-900">{user?.full_name || user?.phone_number}</p>
          <p className="text-xs text-slate-400">Admin</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('common.logout')}
        </Button>
      </div>
    </div>
  )
}

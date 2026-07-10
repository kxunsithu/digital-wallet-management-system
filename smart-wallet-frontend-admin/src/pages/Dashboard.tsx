import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/api/services'
import { Users, UserCheck, FileCheck, Clock, Loader2 } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalCustomers: number
  totalAgents: number
  pendingNrc: number
  pendingAgents: number
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allUsersRes, customersRes, agentsRes, nrcRes, pendingAgentsRes] = await Promise.all([
          adminApi.getUsers({ per_page: 1 }),
          adminApi.getUsers({ role: 'customer', per_page: 1 }),
          adminApi.getUsers({ role: 'agent', per_page: 1 }),
          adminApi.getNrcVerifications({ status: 'pending', per_page: 1 }),
          adminApi.getUsers({ role: 'agent', status: 'pending', per_page: 1 }),
        ])

        setStats({
          totalUsers: allUsersRes.data?.data?.pagination?.total ?? 0,
          totalCustomers: customersRes.data?.data?.pagination?.total ?? 0,
          totalAgents: agentsRes.data?.data?.pagination?.total ?? 0,
          pendingNrc: nrcRes.data?.data?.pagination?.total ?? 0,
          pendingAgents: pendingAgentsRes.data?.data?.pagination?.total ?? 0,
        })
      } catch {
        setStats({ totalUsers: 0, totalCustomers: 0, totalAgents: 0, pendingNrc: 0, pendingAgents: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      label: t('dashboard.totalUsers'),
      value: stats?.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('dashboard.totalCustomers'),
      value: stats?.totalCustomers,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: t('dashboard.totalAgents'),
      value: stats?.totalAgents,
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('dashboard.pendingNrc'),
      value: stats?.pendingNrc,
      icon: FileCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: t('dashboard.pendingAgents'),
      value: stats?.pendingAgents,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div>
      <Header title={t('dashboard.title')} />
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">{card.label}</CardTitle>
                    <div className={`rounded-lg p-2 ${card.bg}`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{card.value?.toLocaleString() ?? '-'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

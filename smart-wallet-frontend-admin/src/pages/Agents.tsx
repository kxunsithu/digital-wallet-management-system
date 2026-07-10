import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { adminApi } from '@/api/services'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Search, Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

interface AgentUser {
  id: number
  phone_number: string
  full_name: string | null
  status: string
  created_at: string
  wallet?: { balance: string }
  agent_profile?: {
    agent_code: string
    level: string
    shop_name: string
    shop_address: string
    township: string
    float_balance: string
    status: string
    total_volume_monthly: string
  }
}

const agentStatusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  approved: 'success',
  pending: 'warning',
  suspended: 'destructive',
}

export default function AgentsPage() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState<AgentUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  // Approve dialog
  const [selectedAgent, setSelectedAgent] = useState<AgentUser | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { role: 'agent', per_page: 15, page }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await adminApi.getUsers(params)
      setAgents(res.data?.data?.users ?? [])
      setPagination(res.data?.data?.pagination ?? { current_page: 1, last_page: 1, total: 0 })
    } catch {
      setAgents([])
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    const timer = setTimeout(fetchAgents, 300)
    return () => clearTimeout(timer)
  }, [fetchAgents])

  const handleApprove = async () => {
    if (!selectedAgent) return
    setIsApproving(true)
    try {
      await adminApi.approveAgent(selectedAgent.id)
      setSelectedAgent(null)
      fetchAgents()
    } catch {
      //
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div>
      <Header title={t('agents.title')} />
      <div className="p-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('common.search')}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('users.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">{t('common.active')}</SelectItem>
              <SelectItem value="pending">{t('common.pending')}</SelectItem>
              <SelectItem value="suspended">{t('common.suspended')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('agents.agentCode')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('agents.shopName')}</TableHead>
                  <TableHead>{t('agents.township')}</TableHead>
                  <TableHead>{t('agents.level')}</TableHead>
                  <TableHead>{t('agents.floatBalance')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.createdAt')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-slate-400 py-8">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-mono text-xs">
                        {agent.agent_profile?.agent_code || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{agent.full_name || '-'}</TableCell>
                      <TableCell>{agent.phone_number}</TableCell>
                      <TableCell>{agent.agent_profile?.shop_name || '-'}</TableCell>
                      <TableCell>{agent.agent_profile?.township || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{agent.agent_profile?.level || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        {agent.agent_profile?.float_balance
                          ? `${formatCurrency(agent.agent_profile.float_balance)} MMK`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={agentStatusVariant[agent.agent_profile?.status ?? ''] ?? 'secondary'}>
                          {agent.agent_profile?.status || agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(agent.created_at)}</TableCell>
                      <TableCell>
                        {agent.agent_profile?.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('agents.approveAgent')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>{t('common.total')}: {pagination.total.toLocaleString()}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{t('common.page')} {pagination.current_page} {t('common.of')} {pagination.last_page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={page >= pagination.last_page}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Approve Agent Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agents.approveAgent')}</DialogTitle>
            <DialogDescription>{t('agents.approveConfirm')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('common.name')}</span>
              <span className="font-medium">{selectedAgent?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('agents.agentCode')}</span>
              <span className="font-medium font-mono">{selectedAgent?.agent_profile?.agent_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('agents.shopName')}</span>
              <span className="font-medium">{selectedAgent?.agent_profile?.shop_name || '-'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAgent(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleApprove} disabled={isApproving} className="bg-emerald-600 hover:bg-emerald-700">
              {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

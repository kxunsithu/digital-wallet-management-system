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
import { formatDate } from '@/lib/utils'
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface User {
  id: number
  phone_number: string
  full_name: string | null
  email: string | null
  nrc_number: string | null
  status: string
  role: string
  is_phone_verified: boolean
  is_pin_created: boolean
  last_login_at: string | null
  created_at: string
  wallet?: { balance: string }
  customer_profile?: { level: string; kyc_status: string }
  agent_profile?: { agent_code: string; level: string; shop_name: string; status: string }
}

const statusVariantMap: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  active: 'success',
  suspended: 'warning',
  pending: 'secondary',
  blocked: 'destructive',
}

export default function UsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })

  // Update status dialog
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 15, page }
      if (search) params.search = search
      if (roleFilter !== 'all') params.role = roleFilter
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await adminApi.getUsers(params)
      setUsers(res.data?.data?.users ?? [])
      setPagination(res.data?.data?.pagination ?? { current_page: 1, last_page: 1, total: 0, per_page: 15 })
    } catch {
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [search, roleFilter, statusFilter, page])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  const handleUpdateStatus = async () => {
    if (!selectedUser || !newStatus) return
    setIsUpdating(true)
    try {
      await adminApi.updateUserStatus(selectedUser.id, newStatus)
      setSelectedUser(null)
      fetchUsers()
    } catch {
      // handle error
    } finally {
      setIsUpdating(false)
    }
  }

  const openUpdateDialog = (user: User) => {
    setSelectedUser(user)
    setNewStatus(user.status)
  }

  return (
    <div>
      <Header title={t('users.title')} />
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
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('users.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="customer">{t('users.customer')}</SelectItem>
              <SelectItem value="agent">{t('users.agent')}</SelectItem>
              <SelectItem value="admin">{t('users.admin')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('users.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">{t('common.active')}</SelectItem>
              <SelectItem value="suspended">{t('common.suspended')}</SelectItem>
              <SelectItem value="pending">{t('common.pending')}</SelectItem>
              <SelectItem value="blocked">{t('common.blocked')}</SelectItem>
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
                  <TableHead>{t('users.id')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('common.role')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('users.kycStatus')}</TableHead>
                  <TableHead>{t('users.walletBalance')}</TableHead>
                  <TableHead>{t('users.lastLogin')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-400 py-8">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs text-slate-500">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                      <TableCell>{user.phone_number}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'agent' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[user.status] ?? 'secondary'}>
                          {t(`common.${user.status}`) || user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.customer_profile?.kyc_status ? (
                          <Badge variant={user.customer_profile.kyc_status === 'approved' ? 'success' : 'secondary'}>
                            {user.customer_profile.kyc_status}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {user.wallet ? `${parseFloat(user.wallet.balance).toLocaleString()} MMK` : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(user.last_login_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateDialog(user)}
                        >
                          {t('users.updateStatus')}
                        </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{t('common.page')} {pagination.current_page} {t('common.of')} {pagination.last_page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
              disabled={page >= pagination.last_page}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.updateStatusTitle')}</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name || selectedUser?.phone_number}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('common.active')}</SelectItem>
                <SelectItem value="suspended">{t('common.suspended')}</SelectItem>
                <SelectItem value="pending">{t('common.pending')}</SelectItem>
                <SelectItem value="blocked">{t('common.blocked')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

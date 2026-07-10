import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/api/services'
import { formatDate } from '@/lib/utils'
import { Loader2, Search } from 'lucide-react'

interface AuditLogItem {
  id: number
  action: string
  target_table: string
  target_id: number
  details: string
  user: { id: number; full_name: string | null; phone_number: string }
  created_at: string
}

export default function AuditLogsPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const res = await adminApi.getAuditLogs({ page, per_page: 15, action: search || undefined, target_table: search || undefined })
        setLogs(res.data?.data?.audit_logs ?? [])
        setPagination(res.data?.data?.pagination ?? { current_page: 1, last_page: 1, total: 0 })
      } catch {
        setLogs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
  }, [page, search])

  return (
    <div>
      <Header title={t('auditLogs.title')} />
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('common.search')}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">{t('auditLogs.action')}</th>
                  <th className="px-4 py-3">{t('auditLogs.targetTable')}</th>
                  <th className="px-4 py-3">{t('auditLogs.targetId')}</th>
                  <th className="px-4 py-3">{t('auditLogs.user')}</th>
                  <th className="px-4 py-3">{t('auditLogs.timestamp')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">{t('common.noData')}</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.id}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td className="px-4 py-3">{log.target_table}</td>
                      <td className="px-4 py-3">{log.target_id}</td>
                      <td className="px-4 py-3">{log.user.full_name || log.user.phone_number}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(log.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{t('common.total')}: {pagination.total.toLocaleString()}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
            <span>{page} / {pagination.last_page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} disabled={page >= pagination.last_page}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

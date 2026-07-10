import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { adminApi } from '@/api/services'
import { formatDate } from '@/lib/utils'
import { ImageIcon, Loader2, CheckCircle, XCircle, FileCheck } from 'lucide-react'
import { API_BASE_URL } from '@/api/client'

interface NrcVerification {
  id: number
  user: {
    id: number
    full_name: string | null
    phone_number: string
  }
  nrc_front_image: string | null
  nrc_back_image: string | null
  status: string
  rejection_reason: string | null
  verified_by_user: { full_name: string | null; phone_number: string } | null
  verified_at: string | null
  created_at: string
}

const normalizeImageUrl = (path?: string | null) => {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace(/\/api$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
}

export default function NrcVerificationsPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<NrcVerification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [selected, setSelected] = useState<NrcVerification | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const res = await adminApi.getNrcVerifications({ status: filterStatus, page, per_page: 15 })
        setItems(res.data?.data?.nrc_verifications ?? [])
        setPagination(res.data?.data?.pagination ?? { current_page: 1, last_page: 1, total: 0 })
      } catch {
        setItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
  }, [filterStatus, page])

  const handleVerify = async (status: 'approved' | 'rejected') => {
    if (!selected) return
    setIsSubmitting(true)
    try {
      await adminApi.verifyNrc(selected.id, status, status === 'rejected' ? rejectionReason : undefined)
      setSelected(null)
      setRejectionReason('')
      const res = await adminApi.getNrcVerifications({ status: filterStatus, page, per_page: 15 })
      setItems(res.data?.data?.nrc_verifications ?? [])
      setPagination(res.data?.data?.pagination ?? pagination)
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Header title={t('nrc.title')} />
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">{t('nrc.title')}</p>
            <p className="text-sm text-slate-500">{t('nrc.viewImages')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterStatus}
              onChange={(event) => { setFilterStatus(event.target.value); setPage(1) }}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="pending">{t('common.pending')}</option>
              <option value="approved">{t('common.approved')}</option>
              <option value="rejected">{t('common.rejected')}</option>
            </select>
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
                  <th className="px-4 py-3">{t('common.name')}</th>
                  <th className="px-4 py-3">{t('common.phone')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('nrc.createdAt')}</th>
                  <th className="px-4 py-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.id}</td>
                      <td className="px-4 py-3">{item.user.full_name || '-'}</td>
                      <td className="px-4 py-3">{item.user.phone_number}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === 'approved' ? 'bg-green-100 text-green-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {t(`common.${item.status}`) ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(item)}
                        >
                          <FileCheck className="h-4 w-4" />
                          {t('common.actions')}
                        </Button>
                      </td>
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
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <span>{page} / {pagination.last_page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} disabled={page >= pagination.last_page}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('nrc.title')}</DialogTitle>
            <DialogDescription>{selected?.user.full_name || selected?.user.phone_number}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="mb-2 text-sm text-slate-600">{t('nrc.frontImage')}</p>
              {selected?.nrc_front_image ? (
                <img
                  src={normalizeImageUrl(selected.nrc_front_image)}
                  alt="Front NRC"
                  className="mx-auto max-h-60 object-contain"
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="mb-2 text-sm text-slate-600">{t('nrc.backImage')}</p>
              {selected?.nrc_back_image ? (
                <img
                  src={normalizeImageUrl(selected.nrc_back_image)}
                  alt="Back NRC"
                  className="mx-auto max-h-60 object-contain"
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">{t('nrc.verifiedBy')}: {selected?.verified_by_user?.full_name || selected?.verified_by_user?.phone_number || '-'}</p>
            <p className="text-sm text-slate-500">{t('nrc.verifiedAt')}: {formatDate(selected?.verified_at ?? null)}</p>
            {selected?.status === 'rejected' && (
              <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                {t('nrc.rejectionReason')}: {selected.rejection_reason || '-'}
              </div>
            )}
          </div>

          {selected?.status === 'pending' && (
            <div className="space-y-2">
              <Textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder={t('nrc.rejectionReasonPlaceholder')}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>{t('common.cancel')}</Button>
            {selected?.status === 'pending' ? (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => handleVerify('rejected')} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  {t('common.reject')}
                </Button>
                <Button onClick={() => handleVerify('approved')} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {t('common.approve')}
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/api/services'
import { Loader2, Pencil } from 'lucide-react'

interface CustomerLevelConfig {
  id: number
  level: string
  daily_transfer_limit: string
  monthly_transfer_limit: string
  max_wallet_balance: string
  daily_cash_out_limit: string
  max_transaction_count_daily: number
  can_use_qr_payment: boolean
  can_receive_from_agent: boolean
  requires_kyc: boolean
  is_active: boolean
}

export default function CustomerLevelConfigsPage() {
  const { t } = useTranslation()
  const [configs, setConfigs] = useState<CustomerLevelConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formState, setFormState] = useState<Partial<CustomerLevelConfig>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const res = await adminApi.getCustomerLevelConfigs()
        setConfigs(res.data?.data ?? [])
      } catch {
        setConfigs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
  }, [])

  const startEdit = (config: CustomerLevelConfig) => {
    setEditingId(config.id)
    setFormState({ ...config })
  }

  const saveConfig = async () => {
    if (!editingId || !formState) return
    setIsSaving(true)
    try {
      await adminApi.updateCustomerLevelConfig(editingId, {
        daily_transfer_limit: formState.daily_transfer_limit,
        monthly_transfer_limit: formState.monthly_transfer_limit,
        max_wallet_balance: formState.max_wallet_balance,
        daily_cash_out_limit: formState.daily_cash_out_limit,
        max_transaction_count_daily: formState.max_transaction_count_daily,
        can_use_qr_payment: formState.can_use_qr_payment,
        can_receive_from_agent: formState.can_receive_from_agent,
        requires_kyc: formState.requires_kyc,
        is_active: formState.is_active,
      })
      const res = await adminApi.getCustomerLevelConfigs()
      setConfigs(res.data?.data ?? [])
      setEditingId(null)
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <Header title={t('customerLevelConfigs.title')} />
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex h-52 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {configs.map((config) => {
              const isEditing = editingId === config.id
              return (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{t('customerLevelConfigs.level')} {config.level}</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => startEdit(config)}>
                        <Pencil className="h-4 w-4" />
                        {t('customerLevelConfigs.editConfig')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('customerLevelConfigs.dailyTransferLimit')}</label>
                        <Input
                          value={isEditing ? formState.daily_transfer_limit ?? '' : config.daily_transfer_limit}
                          onChange={(e) => setFormState((state) => ({ ...state, daily_transfer_limit: e.target.value }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('customerLevelConfigs.monthlyTransferLimit')}</label>
                        <Input
                          value={isEditing ? formState.monthly_transfer_limit ?? '' : config.monthly_transfer_limit}
                          onChange={(e) => setFormState((state) => ({ ...state, monthly_transfer_limit: e.target.value }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('customerLevelConfigs.maxWalletBalance')}</label>
                        <Input
                          value={isEditing ? formState.max_wallet_balance ?? '' : config.max_wallet_balance}
                          onChange={(e) => setFormState((state) => ({ ...state, max_wallet_balance: e.target.value }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('customerLevelConfigs.dailyCashOutLimit')}</label>
                        <Input
                          value={isEditing ? formState.daily_cash_out_limit ?? '' : config.daily_cash_out_limit}
                          onChange={(e) => setFormState((state) => ({ ...state, daily_cash_out_limit: e.target.value }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('customerLevelConfigs.maxDailyTransactions')}</label>
                        <Input
                          value={isEditing ? formState.max_transaction_count_daily?.toString() ?? '' : config.max_transaction_count_daily.toString()}
                          onChange={(e) => setFormState((state) => ({ ...state, max_transaction_count_daily: Number(e.target.value) }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('customerLevelConfigs.requiresKyc')}</label>
                        <select
                          value={isEditing ? String(formState.requires_kyc) : String(config.requires_kyc)}
                          onChange={(e) => setFormState((state) => ({ ...state, requires_kyc: e.target.value === 'true' }))}
                          disabled={!isEditing}
                          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        >
                          <option value="true">{t('common.yes')}</option>
                          <option value="false">{t('common.no')}</option>
                        </select>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={saveConfig} disabled={isSaving}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/api/services'
import { Loader2, Pencil } from 'lucide-react'

interface AgentLevelConfig {
  id: number
  level: string
  daily_cash_limit: string
  default_commission_rate: string
  min_float_required: string
  can_recruit_sub_agent: boolean
  is_active: boolean
}

export default function AgentLevelConfigsPage() {
  const { t } = useTranslation()
  const [configs, setConfigs] = useState<AgentLevelConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formState, setFormState] = useState<Partial<AgentLevelConfig>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const res = await adminApi.getAgentLevelConfigs()
        setConfigs(res.data?.data ?? [])
      } catch {
        setConfigs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
  }, [])

  const startEdit = (config: AgentLevelConfig) => {
    setEditingId(config.id)
    setFormState({ ...config })
  }

  const saveConfig = async () => {
    if (!editingId || !formState) return
    setIsSaving(true)
    try {
      await adminApi.updateAgentLevelConfig(editingId, {
        daily_cash_limit: formState.daily_cash_limit,
        default_commission_rate: formState.default_commission_rate,
        min_float_required: formState.min_float_required,
        can_recruit_sub_agent: formState.can_recruit_sub_agent,
        is_active: formState.is_active,
      })
      const res = await adminApi.getAgentLevelConfigs()
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
      <Header title={t('agentLevelConfigs.title')} />
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
                      <CardTitle>{t('agentLevelConfigs.level')} {config.level}</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => startEdit(config)}>
                        <Pencil className="h-4 w-4" />
                        {t('agentLevelConfigs.editConfig')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('agentLevelConfigs.dailyCashLimit')}</label>
                        <Input
                          value={isEditing ? formState.daily_cash_limit ?? '' : config.daily_cash_limit}
                          onChange={(e) => setFormState((state) => ({ ...state, daily_cash_limit: e.target.value }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('agentLevelConfigs.defaultCommissionRate')}</label>
                        <Input
                          value={isEditing ? formState.default_commission_rate ?? '' : config.default_commission_rate}
                          onChange={(e) => setFormState((state) => ({ ...state, default_commission_rate: e.target.value }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('agentLevelConfigs.minFloatRequired')}</label>
                        <Input
                          value={isEditing ? formState.min_float_required ?? '' : config.min_float_required}
                          onChange={(e) => setFormState((state) => ({ ...state, min_float_required: e.target.value }))}
                          disabled={!isEditing}
                          type="number"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">{t('agentLevelConfigs.canRecruitSubAgent')}</label>
                        <select
                          value={isEditing ? String(formState.can_recruit_sub_agent) : String(config.can_recruit_sub_agent)}
                          onChange={(e) => setFormState((state) => ({ ...state, can_recruit_sub_agent: e.target.value === 'true' }))}
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

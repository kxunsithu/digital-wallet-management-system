import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Wallet, Globe, ArrowLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

type Step = 'phone' | 'otp' | 'create-pin' | 'verify-pin'

const phoneSchema = z.object({ 
  phone_number: z
    .string()
    .min(1, 'Phone number is required.')
    .min(9, 'Invalid phone number')
})
const otpSchema = z.object({ otp_code: z.string().length(6, 'OTP must be 6 digits') })
const pinSchema = z.object({ pin: z.string().min(4, 'PIN must be at least 4 digits') })
const createPinSchema = z.object({
  full_name: z.string().optional(),
  nrc_number: z.string().optional(),
  pin: z.string().min(4, 'PIN must be 4-6 digits').max(6),
  pin_confirmation: z.string().min(4, 'PIN confirmation required'),
}).refine((data) => data.pin === data.pin_confirmation, {
  message: 'PIN confirmation does not match.',
  path: ['pin_confirmation'],
})

type PhoneForm = z.infer<typeof phoneSchema>
type OtpForm = z.infer<typeof otpSchema>
type PinForm = z.infer<typeof pinSchema>
type CreatePinForm = z.infer<typeof createPinSchema>

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStepState] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumberState] = useState('')
  const [userId, setUserIdState] = useState<number | null>(null)
  const [isAdminPhone, setIsAdminPhoneState] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Wrapper functions to save state to localStorage
  const setStep = (newStep: Step) => {
    setStepState(newStep)
    localStorage.setItem('authStep', newStep)
  }

  const setPhoneNumber = (phone: string) => {
    setPhoneNumberState(phone)
    localStorage.setItem('authPhoneNumber', phone)
  }

  const setUserId = (id: number | null) => {
    setUserIdState(id)
    if (id) {
      localStorage.setItem('authUserId', id.toString())
    } else {
      localStorage.removeItem('authUserId')
    }
  }

  const setIsAdminPhone = (isAdmin: boolean) => {
    setIsAdminPhoneState(isAdmin)
    localStorage.setItem('authIsAdminPhone', isAdmin.toString())
  }

  // Clear auth state
  const clearAuthState = () => {
    setStepState('phone')
    setPhoneNumberState('')
    setUserIdState(null)
    setIsAdminPhoneState(false)
    localStorage.removeItem('authStep')
    localStorage.removeItem('authPhoneNumber')
    localStorage.removeItem('authUserId')
    localStorage.removeItem('authIsAdminPhone')
  }

  // Load persisted auth state on mount
  useEffect(() => {
    const savedStep = localStorage.getItem('authStep') as Step | null
    const savedPhoneNumber = localStorage.getItem('authPhoneNumber')
    const savedUserId = localStorage.getItem('authUserId')
    const savedIsAdminPhone = localStorage.getItem('authIsAdminPhone')

    if (savedStep && savedStep !== 'phone') {
      // Only restore if we have valid data for the saved step
      if (savedStep === 'otp' && savedPhoneNumber) {
        setStepState(savedStep)
        setPhoneNumberState(savedPhoneNumber)
        if (savedIsAdminPhone) setIsAdminPhoneState(savedIsAdminPhone === 'true')
      } else if ((savedStep === 'create-pin' || savedStep === 'verify-pin') && savedUserId && savedPhoneNumber) {
        setStepState(savedStep)
        setPhoneNumberState(savedPhoneNumber)
        setUserIdState(parseInt(savedUserId))
        if (savedIsAdminPhone) setIsAdminPhoneState(savedIsAdminPhone === 'true')
      }
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'my' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const phoneForm = useForm<PhoneForm>({ 
    resolver: zodResolver(phoneSchema),
    mode: 'onSubmit'
  })
  const otpForm = useForm<OtpForm>({ 
    resolver: zodResolver(otpSchema),
    mode: 'onSubmit'
  })
  const createPinForm = useForm<CreatePinForm>({
    resolver: zodResolver(createPinSchema),
    mode: 'onSubmit'
  })
  const pinForm = useForm<PinForm>({ 
    resolver: zodResolver(pinSchema),
    mode: 'onSubmit'
  })

  const handlePhoneSubmit = async (data: PhoneForm) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await authApi.requestOtp(data.phone_number, 'admin')
      setPhoneNumber(data.phone_number)
      setIsAdminPhone(true)
      setStep('otp')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (data: OtpForm) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await authApi.verifyOtp(phoneNumber, data.otp_code)
      const resData = res.data?.data
      setUserId(resData?.user_id || resData?.user?.id)
      
      // Check if PIN needs to be created or verified
      if (resData?.requires_pin_creation) {
        setStep('create-pin')
      } else {
        setStep('verify-pin')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePinSubmit = async (data: CreatePinForm) => {
    if (!userId) return
    setIsLoading(true)
    setError('')
    try {
      // For admin users, auto-set full_name to "System Admin" and leave nrc_number empty
      const fullName = isAdminPhone ? 'System Admin' : data.full_name
      const nrcNumber = isAdminPhone ? '' : data.nrc_number
      await authApi.createPin(userId, data.pin, fullName, nrcNumber)
      // After creating PIN, move to verification
      setStep('verify-pin')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to create PIN')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyPinSubmit = async (data: PinForm) => {
    if (!userId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await authApi.verifyPin(userId, data.pin)
      const resData = res.data?.data
      const token = resData?.token
      const user = resData?.user
      if (token && user?.role === 'admin') {
        login(token, user)
        navigate('/dashboard')
      } else if (user?.role !== 'admin') {
        setError('Access denied. Admin only.')
      } else {
        setError('Login failed')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Invalid PIN')
    } finally {
      setIsLoading(false)
    }
  }

  const steps: Step[] = ['phone', 'otp', 'create-pin', 'verify-pin']
  const stepLabels = [t('login.step1'), t('login.step2'), t('login.step3'), t('login.step4')]

  // Determine current step index for progress indicator
  const getStepIndex = () => {
    switch (step) {
      case 'phone': return 0
      case 'otp': return 1
      case 'create-pin': return 2
      case 'verify-pin': return 3
      default: return 0
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <Globe className="h-4 w-4" />
        {i18n.language === 'en' ? 'မြန်မာ' : 'English'}
      </button>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-600">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {steps.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    getStepIndex() >= i ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
                {i < 2 && (
                  <div className={`h-px w-8 transition-colors ${getStepIndex() > i ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{stepLabels[getStepIndex()]}</p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t('login.adminPhoneLabel')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('login.adminPhonePlaceholder')}
                  {...phoneForm.register('phone_number')}
                />
                {phoneForm.formState.errors.phone_number && (
                  <p className="text-xs text-red-500">{phoneForm.formState.errors.phone_number.message}</p>
                )}
              </div>
              <p className="text-sm text-slate-500">{t('login.adminLoginHint')}</p>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('login.sendOtp')}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <p className="text-sm text-slate-500">
                OTP sent to <span className="font-medium text-slate-900">{phoneNumber}</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="otp">{t('login.otpLabel')}</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t('login.otpPlaceholder')}
                  {...otpForm.register('otp_code')}
                />
                {otpForm.formState.errors.otp_code && (
                  <p className="text-xs text-red-500">{otpForm.formState.errors.otp_code.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('login.verifyOtp')}
              </Button>
              <button
                type="button"
                onClick={() => clearAuthState()}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-3 w-3" />
                {t('login.backToPhone')}
              </button>
            </form>
          )}

          {/* Step 3: Create PIN (first time) */}
          {step === 'create-pin' && (
            <form onSubmit={createPinForm.handleSubmit(handleCreatePinSubmit)} className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                {isAdminPhone 
                  ? t('login.createPinHintAdmin')
                  : t('login.createPinHint')}
              </p>
              
              {!isAdminPhone && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">{t('login.fullNameLabel')}</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder={t('login.fullNamePlaceholder')}
                      {...createPinForm.register('full_name')}
                    />
                    {createPinForm.formState.errors.full_name && (
                      <p className="text-xs text-red-500">{createPinForm.formState.errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nrc_number">{t('login.nrcNumberLabel')}</Label>
                    <Input
                      id="nrc_number"
                      type="text"
                      placeholder={t('login.nrcNumberPlaceholder')}
                      {...createPinForm.register('nrc_number')}
                    />
                    {createPinForm.formState.errors.nrc_number && (
                      <p className="text-xs text-red-500">{createPinForm.formState.errors.nrc_number.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="pin">{t('login.createPinLabel')}</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t('login.pinPlaceholder')}
                  {...createPinForm.register('pin')}
                />
                {createPinForm.formState.errors.pin && (
                  <p className="text-xs text-red-500">{createPinForm.formState.errors.pin.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pin_confirmation">{t('login.pinConfirmationLabel')}</Label>
                <Input
                  id="pin_confirmation"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t('login.pinConfirmationPlaceholder')}
                  {...createPinForm.register('pin_confirmation')}
                />
                {createPinForm.formState.errors.pin_confirmation && (
                  <p className="text-xs text-red-500">{createPinForm.formState.errors.pin_confirmation.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('login.createPin')}
              </Button>
            </form>
          )}

          {/* Step 4: Verify PIN (existing user) */}
          {step === 'verify-pin' && (
            <form onSubmit={pinForm.handleSubmit(handleVerifyPinSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pin">{t('login.pinLabel')}</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t('login.pinPlaceholder')}
                  {...pinForm.register('pin')}
                />
                {pinForm.formState.errors.pin && (
                  <p className="text-xs text-red-500">{pinForm.formState.errors.pin.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('login.verifyPin')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

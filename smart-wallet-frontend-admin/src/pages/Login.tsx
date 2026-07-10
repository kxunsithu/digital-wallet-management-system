import { useState } from 'react'
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

type Step = 'phone' | 'otp' | 'pin'

const phoneSchema = z.object({ phone_number: z.string().min(9, 'Invalid phone number') })
const otpSchema = z.object({ otp_code: z.string().length(6, 'OTP must be 6 digits') })
const pinSchema = z.object({ pin: z.string().min(4, 'PIN must be at least 4 digits') })

type PhoneForm = z.infer<typeof phoneSchema>
type OtpForm = z.infer<typeof otpSchema>
type PinForm = z.infer<typeof pinSchema>

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'my' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) })
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) })
  const pinForm = useForm<PinForm>({ resolver: zodResolver(pinSchema) })

  const handlePhoneSubmit = async (data: PhoneForm) => {
    setIsLoading(true)
    setError('')
    try {
      await authApi.requestOtp(data.phone_number)
      setPhoneNumber(data.phone_number)
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
      setUserId(resData?.user?.id || resData?.user_id)
      setStep('pin')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSubmit = async (data: PinForm) => {
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

  const steps: Step[] = ['phone', 'otp', 'pin']
  const stepLabels = [t('login.step1'), t('login.step2'), t('login.step3')]

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
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    steps.indexOf(step) >= i ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
                {i < steps.length - 1 && (
                  <div className={`h-px w-8 transition-colors ${steps.indexOf(step) > i ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{stepLabels[steps.indexOf(step)]}</p>
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
                <Label htmlFor="phone">{t('login.phoneLabel')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('login.phonePlaceholder')}
                  {...phoneForm.register('phone_number')}
                />
                {phoneForm.formState.errors.phone_number && (
                  <p className="text-xs text-red-500">{phoneForm.formState.errors.phone_number.message}</p>
                )}
              </div>
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
                onClick={() => setStep('phone')}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-3 w-3" />
                {t('login.backToPhone')}
              </button>
            </form>
          )}

          {/* Step 3: PIN */}
          {step === 'pin' && (
            <form onSubmit={pinForm.handleSubmit(handlePinSubmit)} className="space-y-4">
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
              <button
                type="button"
                onClick={() => setStep('otp')}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-3 w-3" />
                {t('login.backToPhone')}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

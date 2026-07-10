import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'my' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLanguage}
        className="gap-2"
      >
        <Globe className="h-4 w-4" />
        {i18n.language === 'en' ? 'မြန်မာ' : 'English'}
      </Button>
    </div>
  )
}

import { Button } from './ui/button'
import { useState, useEffect } from 'react'

export default function LanguageSwitch() {
  const [currentLang, setCurrentLang] = useState<'en' | 'zh'>('en')
  
  // Read the current locale from cookie
  useEffect(() => {
    const cookies = document.cookie.split(';')
    const lingoCookie = cookies.find(c => c.trim().startsWith('lingo-locale='))
    if (lingoCookie) {
      const locale = lingoCookie.split('=')[1] as 'en' | 'zh'
      setCurrentLang(locale)
    }
  }, [])
  
  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'zh' : 'en'
    setCurrentLang(newLang)
    // Set the locale in localStorage for components
    localStorage.setItem('locale', newLang)
    // Set the lingo-locale cookie
    document.cookie = `lingo-locale=${newLang}; path=/; max-age=31536000`
    // Reload to apply the new locale
    window.location.reload()
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50"
      title="Switch language"
    >
      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      {currentLang === 'en' ? 'EN' : '中文'}
    </Button>
  )
}
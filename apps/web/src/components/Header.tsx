import { Button } from './ui/button'
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePrivyAuth } from '../hooks/usePrivyAuth'
import { WalletDropdown } from './WalletDropdown'

export default function Header() {
  const location = useLocation()
  const { 
    isPrivyAuthenticated, 
    walletAddress, 
    triggerSignIn, 
    signOut,
    checkAuthStatus 
  } = usePrivyAuth()
  const [currentLang, setCurrentLang] = useState<'en' | 'zh'>('en')
  const [hasAuthToken, setHasAuthToken] = useState(false)
  
  // Read the current locale from cookie and check auth token
  useEffect(() => {
    const cookies = document.cookie.split(';')
    const lingoCookie = cookies.find(c => c.trim().startsWith('lingo-locale='))
    if (lingoCookie) {
      const locale = lingoCookie.split('=')[1] as 'en' | 'zh'
      setCurrentLang(locale)
    }
    
    // Check if user has auth token
    const token = localStorage.getItem('auth_token')
    setHasAuthToken(!!token)
  }, [])
  
  // Listen for auth token changes
  useEffect(() => {
    setHasAuthToken(checkAuthStatus())
  }, [checkAuthStatus, isPrivyAuthenticated])
  
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
    <div className="fixed top-4 right-4 z-50">
      {/* Wallet Connection/Dropdown */}
      {isPrivyAuthenticated && walletAddress ? (
        <WalletDropdown
          address={walletAddress}
          onSignOut={signOut}
        />
      ) : (
        <Button
          onClick={triggerSignIn}
          variant="outline"
          className="bg-background border-border hover:bg-accent/10"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  )
}


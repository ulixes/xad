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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
              zkad
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/blog" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname.startsWith('/blog') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Blog
              </Link>
              {isPrivyAuthenticated && hasAuthToken && (
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
          
          {/* Right side buttons */}
          <div className="flex items-center gap-4">
            {/* Language Switcher - Commented out for now */}
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              title="Switch language"
              className="text-foreground hover:text-primary"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {currentLang === 'en' ? 'EN' : '中文'}
            </Button> */}

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
        </div>
      </div>
    </header>
  )
}


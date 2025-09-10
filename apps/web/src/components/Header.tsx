import { Button } from './ui/button'
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

export default function Header() {
  const location = useLocation()
  const { isConnected, address } = useAccount()
  const { open } = useAppKit()
  const [currentLang, setCurrentLang] = useState<'en' | 'zh'>('en')
  const [hasAuthToken, setHasAuthToken] = useState(false)
  
  // Debug logging
  useEffect(() => {
    console.log('Header state:', { isConnected, address, hasAuthToken })
    console.log('AppKit open function:', open)
  }, [isConnected, address, hasAuthToken, open])
  
  // Debug AppKit initialization
  useEffect(() => {
    console.log('Header mounted, checking AppKit...')
    console.log('useAppKit hook result:', { open })
    console.log('Wagmi account state:', { isConnected, address })
  }, [])
  
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
    const checkAuthToken = () => {
      const token = localStorage.getItem('auth_token')
      setHasAuthToken(!!token)
    }
    
    // Check on mount and when storage changes
    checkAuthToken()
    window.addEventListener('storage', checkAuthToken)
    
    return () => {
      window.removeEventListener('storage', checkAuthToken)
    }
  }, [isConnected])
  
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
      <div className="container mx-auto px-4">
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
              {isConnected && hasAuthToken && (
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
            {/* Language Switcher */}
            <Button
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
            </Button>
            
            {/* Wallet Connect Button */}
            <div className="border border-red-500 p-1">
              {console.log('Rendering button area - isConnected:', isConnected, 'address:', address, 'open:', open)}
              {isConnected ? (
                <div className="flex items-center gap-2">
                  {console.log('Rendering connected state')}
                  <span className="text-sm text-muted-foreground">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Connected wallet button clicked, calling open()', open)
                      open()
                    }}
                    className="text-foreground hover:text-primary"
                  >
                    Wallet
                  </Button>
                </div>
              ) : (
                <div>
                  {console.log('Rendering disconnected state')}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Connect Wallet clicked, open function:', open)
                      console.log('Trying to call open()')
                      try {
                        open()
                        console.log('open() called successfully')
                      } catch (error) {
                        console.error('Error calling open():', error)
                      }
                    }}
                    className="text-foreground hover:text-primary bg-blue-500"
                  >
                    Connect Wallet
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// TypeScript declaration for AppKit web components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': any
    }
  }
}
import { Button } from './ui/button'
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()
  const [currentLang, setCurrentLang] = useState<'en' | 'zh'>('en')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  
  // Read the current locale from cookie
  useEffect(() => {
    const cookies = document.cookie.split(';')
    const lingoCookie = cookies.find(c => c.trim().startsWith('lingo-locale='))
    if (lingoCookie) {
      const locale = lingoCookie.split('=')[1] as 'en' | 'zh'
      setCurrentLang(locale)
    }
    
    // Check if wallet is already connected
    checkWalletConnection()
  }, [])
  
  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setIsWalletConnected(true)
          setWalletAddress(accounts[0])
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }
  
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        if (accounts.length > 0) {
          setIsWalletConnected(true)
          setWalletAddress(accounts[0])
        }
      } catch (error) {
        console.error('Error connecting wallet:', error)
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet')
    }
  }
  
  const disconnectWallet = () => {
    setIsWalletConnected(false)
    setWalletAddress(null)
  }
  
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
  
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
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
            {!isWalletConnected ? (
              <Button
                variant="default"
                size="sm"
                onClick={connectWallet}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8"/>
                  <path d="M3 12h18"/>
                  <path d="M12 5v7"/>
                  <circle cx="18" cy="18" r="3"/>
                  <line x1="18" y1="15" x2="18" y2="21"/>
                  <line x1="21" y1="18" x2="15" y2="18"/>
                </svg>
                Connect Wallet
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
                title={walletAddress || 'Connected'}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8"/>
                  <circle cx="18" cy="18" r="3" fill="currentColor"/>
                  <path d="M12 5v7"/>
                </svg>
                {formatAddress(walletAddress!)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on?: (eventName: string, callback: (...args: any[]) => void) => void
      removeListener?: (eventName: string, callback: (...args: any[]) => void) => void
    }
  }
}
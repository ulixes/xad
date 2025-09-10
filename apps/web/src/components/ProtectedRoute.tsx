import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isConnected, address } = useAccount()
  const location = useLocation()
  const [hasAuthToken, setHasAuthToken] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // List of routes that require authentication
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => 
    location.pathname.startsWith(route)
  )

  useEffect(() => {
    const checkAuth = async () => {
      if (!isProtectedRoute) {
        setIsChecking(false)
        return
      }

      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setHasAuthToken(false)
        setIsChecking(false)
        return
      }

      try {
        // Validate token with backend
        const response = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          setHasAuthToken(true)
        } else {
          localStorage.removeItem('auth_token')
          setHasAuthToken(false)
        }
      } catch {
        localStorage.removeItem('auth_token')
        setHasAuthToken(false)
      }
      
      setIsChecking(false)
    }

    checkAuth()
  }, [isProtectedRoute, isConnected, address])

  // For non-protected routes, just render children
  if (!isProtectedRoute) {
    return <>{children}</>
  }

  // For protected routes, show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // For protected routes, check wallet connection and authentication
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access this page</p>
          <appkit-button />
        </div>
      </div>
    )
  }

  if (!hasAuthToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign the message with your wallet to continue</p>
          <appkit-button />
          <p className="text-sm text-gray-500 mt-4">
            After connecting, you'll be prompted to sign a message to verify your identity
          </p>
        </div>
      </div>
    )
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

// TypeScript declaration for AppKit web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': any
    }
  }
}
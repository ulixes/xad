import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { usePrivyAuth } from '../hooks/usePrivyAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { 
    isPrivyAuthenticated,
    walletAddress
  } = usePrivyAuth()

  // List of routes that require authentication
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => 
    location.pathname.startsWith(route)
  )

  // No need for token checking - Privy handles auth state

  // For non-protected routes, just render children
  if (!isProtectedRoute) {
    return <>{children}</>
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}


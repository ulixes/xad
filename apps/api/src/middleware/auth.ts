// Authentication middleware for protected routes
import type { Context, Next } from 'hono'
import { AuthService, type AuthSession } from '../services/auth'
import { ConfigManager } from '../config'
import type { Env } from '../types'

// Extend Hono context to include auth session
declare module 'hono' {
  interface ContextVariableMap {
    authSession: AuthSession
  }
}

/**
 * Authentication middleware - verifies JWT token and sets session in context
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const config = ConfigManager.fromContext(c)
    const authHeader = c.req.header('Authorization')
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401)
    }

    const session = await AuthService.verifyToken(token, config)
    
    if (!session) {
      return c.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, 401)
    }

    // Add session to context for use in protected routes
    c.set('authSession', session)
    
    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, 401)
  }
}

/**
 * Optional authentication middleware - doesn't block if no auth provided
 */
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const config = ConfigManager.fromContext(c)
    const authHeader = c.req.header('Authorization')
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (token) {
      const session = await AuthService.verifyToken(token, config)
      if (session) {
        c.set('authSession', session)
      }
    }
    
    await next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    // Continue without auth if there's an error
    await next()
  }
}

/**
 * Wallet ownership middleware - ensures authenticated user owns the specified wallet
 */
export function requireWalletOwnership(walletParam: string = 'walletAddress') {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const session = c.get('authSession')
    const walletAddress = c.req.param(walletParam)

    if (!session) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401)
    }

    if (session.address.toLowerCase() !== walletAddress.toLowerCase()) {
      return c.json({ 
        success: false, 
        error: 'Access denied: wallet ownership required' 
      }, 403)
    }

    await next()
  }
}
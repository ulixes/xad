import type { Context, Next } from 'hono'
import { PrivyAuthService, type PrivyAuthSession } from '../services/privyAuth'
import { ConfigManager } from '../config'
import type { Env } from '../types'

// Extend Hono context to include Privy auth session
declare module 'hono' {
  interface ContextVariableMap {
    privySession: PrivyAuthSession
  }
}

/**
 * Privy authentication middleware - verifies Privy access tokens
 */
export async function privyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const config = ConfigManager.fromContext(c)
    const db = c.get('db')
    const authHeader = c.req.header('Authorization')
    const token = PrivyAuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401)
    }

    // Verify Privy token
    const claims = await PrivyAuthService.verifyPrivyToken(token, config)
    
    if (!claims) {
      return c.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, 401)
    }

    // Get or create user session
    const session = await PrivyAuthService.getOrCreateUserFromPrivy(claims, db, config)
    
    // Add session to context for use in protected routes
    c.set('privySession', session)
    
    await next()
  } catch (error) {
    console.error('Privy auth middleware error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, 401)
  }
}

/**
 * Optional Privy authentication middleware - doesn't block if no auth provided
 */
export async function optionalPrivyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const config = ConfigManager.fromContext(c)
    const db = c.get('db')
    const authHeader = c.req.header('Authorization')
    const token = PrivyAuthService.extractTokenFromHeader(authHeader)

    if (token) {
      const claims = await PrivyAuthService.verifyPrivyToken(token, config)
      if (claims) {
        const session = await PrivyAuthService.getOrCreateUserFromPrivy(claims, db, config)
        c.set('privySession', session)
      }
    }
    
    await next()
  } catch (error) {
    console.error('Optional Privy auth middleware error:', error)
    // Continue without auth if there's an error
    await next()
  }
}

/**
 * Backward compatibility middleware - accepts both old JWT and new Privy tokens
 */
export async function dualAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const config = ConfigManager.fromContext(c)
    const db = c.get('db')
    const authHeader = c.req.header('Authorization')
    const token = PrivyAuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401)
    }

    // First try Privy authentication
    const privyClaims = await PrivyAuthService.verifyPrivyToken(token, config)
    
    if (privyClaims) {
      // Valid Privy token
      const session = await PrivyAuthService.getOrCreateUserFromPrivy(privyClaims, db, config)
      c.set('privySession', session)
      
      // Also set old authSession for backward compatibility
      if (session.walletAddress && session.dbUserId) {
        c.set('authSession', {
          address: session.walletAddress,
          chainId: 1, // Default chain ID
          userId: session.dbUserId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      }
    } else {
      // Try old JWT authentication as fallback
      const { AuthService } = await import('../services/auth')
      const jwtSession = await AuthService.verifyToken(token, config)
      
      if (!jwtSession) {
        return c.json({ 
          success: false, 
          error: 'Invalid or expired token' 
        }, 401)
      }
      
      // Set old session
      c.set('authSession', jwtSession)
    }
    
    await next()
  } catch (error) {
    console.error('Dual auth middleware error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, 401)
  }
}
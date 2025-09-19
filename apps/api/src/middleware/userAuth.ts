import type { Context, Next } from 'hono'
import { PrivyAuthService } from '../services/privyAuth'
import { ConfigManager } from '../config'
import type { Env } from '../types'

/**
 * User authentication middleware - for extension users
 * Verifies Privy token for regular users (not brands)
 */
export async function userAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
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
    
    // Users don't need wallet addresses - they can use email or other auth methods
    c.set('privySession', session)
    
    await next()
  } catch (error) {
    console.error('User auth middleware error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, 401)
  }
}

/**
 * Optional user authentication - for endpoints that work with or without auth
 */
export async function optionalUserAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
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
    console.error('Optional user auth middleware error:', error)
    // Continue without auth if there's an error
    await next()
  }
}
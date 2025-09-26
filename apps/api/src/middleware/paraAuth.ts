import type { Context, Next } from 'hono'
import { ParaAuthService, type ParaAuthSession } from '../services/paraAuth'
import { ConfigManager } from '../config'
import type { Env } from '../types'

// Extend Hono context to include Para auth session
declare module 'hono' {
  interface ContextVariableMap {
    paraSession: ParaAuthSession
  }
}

/**
 * Para authentication middleware - verifies Para JWT tokens
 */
export async function paraAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const config = ConfigManager.fromContext(c)
    const db = c.get('db')
    const authHeader = c.req.header('Authorization')
    const token = ParaAuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401)
    }

    // Verify Para JWT token
    const payload = await ParaAuthService.verifyParaToken(token, config)
    
    if (!payload) {
      return c.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, 401)
    }

    // Get or create user session
    const session = await ParaAuthService.getOrCreateUserFromPara(payload, db, config)
    
    // Add session to context for use in protected routes
    c.set('paraSession', session)
    
    await next()
  } catch (error) {
    console.error('Para auth middleware error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, 401)
  }
}

/**
 * Optional Para authentication middleware - doesn't block if no auth provided
 */
export async function optionalParaAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const config = ConfigManager.fromContext(c)
    const db = c.get('db')
    const authHeader = c.req.header('Authorization')
    const token = ParaAuthService.extractTokenFromHeader(authHeader)

    if (token) {
      const payload = await ParaAuthService.verifyParaToken(token, config)
      if (payload) {
        const session = await ParaAuthService.getOrCreateUserFromPara(payload, db, config)
        c.set('paraSession', session)
      }
    }
    
    await next()
  } catch (error) {
    console.error('Optional Para auth middleware error:', error)
    // Continue without auth if there's an error
    await next()
  }
}
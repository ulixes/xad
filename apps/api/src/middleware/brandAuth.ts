import type { Context, Next } from 'hono'
import { PrivyAuthService } from '../services/privyAuth'
import { ConfigManager } from '../config'
import type { Env } from '../types'
import { brands } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Brand authentication middleware - for web app dashboard
 * Verifies Privy token AND checks if user has a brand account
 */
export async function brandAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
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

    // Get user session from Privy
    console.log('[brandAuth] Processing token for userId:', claims.userId)
    const session = await PrivyAuthService.getOrCreateUserFromPrivy(claims, db, config)
    console.log('[brandAuth] Session wallet:', session.walletAddress)

    // Check if this user (by ownerId) has a brand account
    const [brand] = await db.select().from(brands)
      .where(eq(brands.ownerId, claims.userId)) // Use auth provider ID, not wallet
      .limit(1)

    if (!brand) {
      // Create brand account if it doesn't exist
      console.log('[brandAuth] Creating new brand for owner:', claims.userId)
      // With 'users-without-wallets' config, user should have exactly 1 wallet
      const walletAddresses = session.walletAddresses
      
      if (walletAddresses.length === 0) {
        console.warn('[brandAuth] WARNING: User has no wallets. This should not happen.')
      } else if (walletAddresses.length > 1) {
        console.warn('[brandAuth] WARNING: User has', walletAddresses.length, 'wallets. Expected exactly 1.')
      }
      
      const [newBrand] = await db.insert(brands).values({
        ownerId: claims.userId, // Auth provider user ID stays constant
        walletAddresses: walletAddresses // Store wallet address(es)
      }).returning()
      console.log('[brandAuth] Created brand ID:', newBrand.id, 'with wallet:', walletAddresses[0])
      
      c.set('brand', newBrand)
    } else {
      // Check if wallet needs to be updated (shouldn't happen often with single wallet)
      const currentWallets = (brand.walletAddresses as string[]) || []
      const sessionWallet = session.walletAddresses[0] // Should only be 1
      
      // Only update if the wallet is different (user switched wallets)
      if (sessionWallet && !currentWallets.includes(sessionWallet)) {
        console.log('[brandAuth] User wallet changed from', currentWallets[0], 'to', sessionWallet)
        console.log('[brandAuth] Updating brand', brand.id, 'with new wallet:', sessionWallet)
        
        // Replace the wallet list with the new single wallet
        await db.update(brands)
          .set({ walletAddresses: [sessionWallet] })
          .where(eq(brands.id, brand.id))
        brand.walletAddresses = [sessionWallet]
      }
      
      c.set('brand', brand)
    }
    
    // Set session for backward compatibility
    c.set('authSession', {
      address: session.walletAddress,
      chainId: 84532, // Base Sepolia
      userId: session.dbUserId || '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    })
    
    c.set('privySession', session)
    
    await next()
  } catch (error) {
    console.error('Brand auth middleware error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, 401)
  }
}

/**
 * Verify brand owns the wallet in the route param
 */
export function requireBrandWalletOwnership(walletParam: string = 'walletAddress') {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const session = c.get('privySession')
    const walletAddress = c.req.param(walletParam)

    if (!session?.walletAddress) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401)
    }

    if (session.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return c.json({ 
        success: false, 
        error: 'Access denied: wallet ownership required' 
      }, 403)
    }

    await next()
  }
}
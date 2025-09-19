// Authentication routes for SIWX (Sign In With X)
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { AuthService } from '../services/auth'
import { authMiddleware } from '../middleware/auth'
import { ConfigManager } from '../config'
import { users, brands } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { Env } from '../types'

const authRoutes = new Hono<{ Bindings: Env }>()

// Schema for SIWX verification
const verifySchema = z.object({
  message: z.string(),
  signature: z.string(),
  cacao: z.object({}).optional() // CACAO object (optional for now)
})

/**
 * POST /auth/nonce
 * Generate a unique nonce for wallet authentication
 */
authRoutes.post('/nonce', async (c) => {
  try {
    const nonce = AuthService.generateNonce()
    
    return c.json({
      success: true,
      nonce
    })
  } catch (error) {
    console.error('Nonce generation error:', error)
    return c.json({
      success: false,
      error: 'Failed to generate nonce'
    }, 500)
  }
})

/**
 * POST /auth/verify  
 * Verify SIWX signature and return JWT token
 */
authRoutes.post('/verify', zValidator('json', verifySchema), async (c) => {
  const db = c.get('db')
  const { message, signature } = c.req.valid('json')

  try {
    // Extract wallet address and chain ID from message
    let addressMatch = message.match(/0x[a-fA-F0-9]{40}/)
    let chainMatch = message.match(/Chain ID: (?:eip155:)?(\d+)/)
    
    if (!addressMatch || !chainMatch) {
      return c.json({
        success: false,
        error: 'Invalid message format'
      }, 400)
    }

    const address = addressMatch[0].toLowerCase()
    const chainId = parseInt(chainMatch[1]!)

    // Verify signature
    const verification = await AuthService.verifySignature({
      message,
      signature,
      address,
      chainId
    })

    if (!verification.valid) {
      return c.json({
        success: false,
        error: verification.reason || 'Signature verification failed'
      }, 400)
    }

    // Find or create user
    let user = await db.select().from(users)
      .where(eq(users.walletAddress, address))
      .limit(1)

    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        walletAddress: address,
        status: 'active',
        metadata: {}
      }).returning()
      user = newUser
    }

    // Find or create brand for this wallet
    let [brand] = await db.select().from(brands)
      .where(eq(brands.walletAddress, address))
      .limit(1)

    if (!brand) {
      // Create new brand for this wallet
      [brand] = await db.insert(brands).values({
        walletAddress: address
      }).returning()
    }

    // Create JWT token
    const config = ConfigManager.fromContext(c)
    const token = await AuthService.createToken(address, chainId, user[0]!.id, config)

    return c.json({
      success: true,
      token,
      user: {
        id: user[0]!.id,
        address: user[0]!.walletAddress,
        status: user[0]!.status
      },
      brandId: brand.id
    })
  } catch (error) {
    console.error('SIWX verification error:', error)
    return c.json({
      success: false,
      error: 'Verification failed'
    }, 500)
  }
})

/**
 * GET /auth/session
 * Get current session information
 */
authRoutes.get('/session', authMiddleware, async (c) => {
  const session = c.get('authSession')
  const db = c.get('db')

  try {
    // Get user details
    const user = await db.select().from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (user.length === 0) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404)
    }

    // Get brand for this user
    const [brand] = await db.select().from(brands)
      .where(eq(brands.walletAddress, session.address))
      .limit(1)

    return c.json({
      success: true,
      session: {
        address: session.address,
        chainId: session.chainId,
        userId: session.userId,
        user: {
          id: user[0]!.id,
          address: user[0]!.walletAddress,
          email: user[0]!.email,
          status: user[0]!.status
        }
      },
      brandId: brand?.id || null
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch session'
    }, 500)
  }
})

/**
 * POST /auth/bypass
 * Development bypass for wallet authentication (creates token without signature verification)
 */
authRoutes.post('/bypass', zValidator('json', z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
})), async (c) => {
  const db = c.get('db')
  const { address } = c.req.valid('json')
  
  try {
    const normalizedAddress = address.toLowerCase()
    
    // Find or create user
    let user = await db.select().from(users)
      .where(eq(users.walletAddress, normalizedAddress))
      .limit(1)

    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        walletAddress: normalizedAddress,
        status: 'active',
        metadata: {}
      }).returning()
      user = newUser
    }

    // Create JWT token with bypass chainId
    const config = ConfigManager.fromContext(c)
    const token = await AuthService.createToken(normalizedAddress, 84532, user[0]!.id, config)

    return c.json({
      success: true,
      token,
      user: {
        id: user[0]!.id,
        address: user[0]!.walletAddress,
        status: user[0]!.status
      }
    })
  } catch (error) {
    console.error('Bypass auth error:', error)
    return c.json({
      success: false,
      error: 'Bypass auth failed'
    }, 500)
  }
})

/**
 * POST /auth/signout
 * Sign out user (client should remove token)
 */
authRoutes.post('/signout', authMiddleware, async (c) => {
  // In a stateless JWT system, we just confirm the signout
  // The client will remove the token from storage
  return c.json({
    success: true,
    message: 'Signed out successfully'
  })
})

export default authRoutes
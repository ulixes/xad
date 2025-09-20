import { Hono } from 'hono'
import type { Env } from '../types'
import { brands } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { brandAuthMiddleware } from '../middleware/brandAuth'

const brandRoutes = new Hono<{ Bindings: Env }>()

// Ensure brand exists for authenticated user (idempotent)
brandRoutes.post('/ensure', brandAuthMiddleware, async (c) => {
  const db = c.get('db')
  const brand = c.get('brand')
  const session = c.get('privySession')
  
  if (!brand || !session) {
    return c.json({ 
      success: false, 
      error: 'Authentication required' 
    }, 401)
  }
  
  return c.json({ 
    success: true,
    brand: {
      id: brand.id,
      ownerId: brand.ownerId,
      walletAddresses: brand.walletAddresses,
      createdAt: brand.createdAt
    },
    message: 'Brand account ready'
  })
})

// Get current brand info
brandRoutes.get('/me', brandAuthMiddleware, async (c) => {
  const brand = c.get('brand')
  
  if (!brand) {
    return c.json({ 
      success: false, 
      error: 'Brand not found' 
    }, 404)
  }
  
  return c.json({ 
    success: true,
    brand: {
      id: brand.id,
      ownerId: brand.ownerId,
      walletAddresses: brand.walletAddresses,
      contactEmail: brand.contactEmail,
      totalSpent: brand.totalSpent,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt
    }
  })
})

// Check if a wallet has a brand (for webhook retry logic)
brandRoutes.get('/check-wallet/:walletAddress', async (c) => {
  const db = c.get('db')
  const walletAddress = c.req.param('walletAddress')
  
  try {
    const walletLower = walletAddress.toLowerCase()
    
    const [brand] = await db.select()
      .from(brands)
      .where(sql`${brands.walletAddresses}::jsonb @> ${JSON.stringify([walletLower])}::jsonb`)
      .limit(1)
    
    return c.json({ 
      success: true,
      exists: !!brand,
      brand: brand ? {
        id: brand.id,
        ownerId: brand.ownerId,
        createdAt: brand.createdAt
      } : null
    })
  } catch (error) {
    console.error('[brands/check-wallet] Error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to check wallet' 
    }, 500)
  }
})

export { brandRoutes }
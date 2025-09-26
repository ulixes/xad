import type { Config } from '../config'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { DrizzleClient } from '../db'
import * as jose from 'jose'

export interface ParaJWTPayload {
  data: {
    userId: string
    wallets: Array<{
      id: string
      type: string
      address: string
      publicKey?: string
    }>
    authType: 'email' | 'phone' | 'farcaster' | 'telegram' | 'externalWallet'
    identifier: string
    externalWallet?: {
      address: string
      type: string
      provider: string
    }
    farcasterUsername?: string
  }
  iat: number
  exp: number
  sub: string // userId
}

export interface ParaAuthSession {
  userId: string // Para userId (sub from JWT)
  walletAddress?: string // Primary wallet address (for backward compatibility)
  walletAddresses: string[] // ALL wallet addresses from Para
  email?: string // If user authenticated with email
  phone?: string // If user authenticated with phone
  authType: string
  identifier: string
  dbUserId?: string // Our database user ID
}

export class ParaAuthService {
  private static jwksClient: jose.RemoteJWKSet | null = null
  
  /**
   * Get JWKS client for Para token verification
   */
  static getJWKSClient(config?: Config): jose.RemoteJWKSet {
    if (!this.jwksClient) {
      // Determine environment from config or env
      const environment = config?.para?.environment || process.env.PARA_ENVIRONMENT || 'PROD'
      
      // Select JWKS URL based on environment
      const jwksUrls: Record<string, string> = {
        'SANDBOX': 'https://api.sandbox.getpara.com/.well-known/jwks.json',
        'BETA': 'https://api.beta.getpara.com/.well-known/jwks.json',
        'PROD': 'https://api.getpara.com/.well-known/jwks.json'
      }
      
      const jwksUrl = jwksUrls[environment] || jwksUrls['PROD']
      this.jwksClient = jose.createRemoteJWKSet(new URL(jwksUrl))
    }
    return this.jwksClient
  }

  /**
   * Verify Para JWT token
   */
  static async verifyParaToken(
    token: string,
    config?: Config
  ): Promise<ParaJWTPayload | null> {
    try {
      const jwks = this.getJWKSClient(config)
      
      // Verify the JWT token with JWKS
      const { payload } = await jose.jwtVerify(token, jwks, {
        algorithms: ['RS256']
      })
      
      return payload as unknown as ParaJWTPayload
    } catch (error) {
      console.error('Para token verification error:', error)
      return null
    }
  }

  /**
   * Alternative: Verify token using Para's verification API
   * This is simpler but requires an additional API call
   */
  static async verifyParaTokenViaAPI(
    token: string,
    config?: Config
  ): Promise<{ authType: string; identifier: string } | null> {
    try {
      const environment = config?.para?.environment || process.env.PARA_ENVIRONMENT || 'PROD'
      const secretKey = config?.para?.secretKey || process.env.PARA_SECRET_KEY
      
      if (!secretKey) {
        throw new Error('Para secret key not configured')
      }
      
      // Select verification URL based on environment
      const verifyUrls: Record<string, string> = {
        'SANDBOX': 'https://api.sandbox.getpara.com/sessions/verify',
        'BETA': 'https://api.beta.getpara.com/sessions/verify',
        'PROD': 'https://api.getpara.com/sessions/verify'
      }
      
      const verifyUrl = verifyUrls[environment] || verifyUrls['PROD']
      
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-external-api-key': secretKey
        },
        body: JSON.stringify({ verificationToken: token })
      })
      
      if (response.status === 403) {
        console.error('Para token expired or invalid')
        return null
      }
      
      if (!response.ok) {
        throw new Error(`Para verification failed: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Para API verification error:', error)
      return null
    }
  }

  /**
   * Get or create user from Para JWT
   */
  static async getOrCreateUserFromPara(
    payload: ParaJWTPayload,
    db: DrizzleClient,
    config?: Config
  ): Promise<ParaAuthSession> {
    try {
      // Extract wallet addresses
      const walletAddresses: string[] = []
      let primaryWallet: string | undefined
      
      if (payload.data.wallets && payload.data.wallets.length > 0) {
        for (const wallet of payload.data.wallets) {
          walletAddresses.push(wallet.address.toLowerCase())
        }
        
        // Use first EVM wallet as primary, or just first wallet
        const evmWallet = payload.data.wallets.find(w => w.type === 'EVM')
        primaryWallet = (evmWallet?.address || payload.data.wallets[0].address).toLowerCase()
      }
      
      // Extract email/phone based on authType
      let email: string | undefined
      let phone: string | undefined
      
      if (payload.data.authType === 'email') {
        email = payload.data.identifier
      } else if (payload.data.authType === 'phone') {
        phone = payload.data.identifier
      }
      
      // Find or create user in our database
      let dbUser = null
      
      // First try to find by Para userId
      const existingUsers = await db.select().from(users)
        .where(eq(users.privyDid, payload.sub)) // Using privyDid field for Para userId
        .limit(1)
      
      if (existingUsers.length > 0) {
        dbUser = existingUsers[0]
        
        // Update wallet address if changed
        if (primaryWallet && dbUser.walletAddress !== primaryWallet) {
          await db.update(users)
            .set({ 
              walletAddress: primaryWallet,
              email: email || dbUser.email
            })
            .where(eq(users.id, dbUser.id))
        }
      } else {
        // Try to find by wallet address if available
        if (primaryWallet) {
          const walletUsers = await db.select().from(users)
            .where(eq(users.walletAddress, primaryWallet))
            .limit(1)
          
          if (walletUsers.length > 0) {
            dbUser = walletUsers[0]
            
            // Update Para userId
            await db.update(users)
              .set({ 
                privyDid: payload.sub,
                email: email || dbUser.email
              })
              .where(eq(users.id, dbUser.id))
          }
        }
      }
      
      // Create new user if not found
      if (!dbUser) {
        const newUsers = await db.insert(users).values({
          privyDid: payload.sub, // Store Para userId in privyDid field
          walletAddress: primaryWallet || null,
          email: email || null,
          status: 'active',
          metadata: {}
        }).returning()
        
        dbUser = newUsers[0]
      }
      
      return {
        userId: payload.sub,
        walletAddress: primaryWallet,
        walletAddresses,
        email,
        phone,
        authType: payload.data.authType,
        identifier: payload.data.identifier,
        dbUserId: dbUser?.id
      }
    } catch (error) {
      console.error('Error getting/creating user from Para:', error)
      throw error
    }
  }
  
  /**
   * Extract Bearer token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    return authHeader.slice(7) // Remove 'Bearer ' prefix
  }
}
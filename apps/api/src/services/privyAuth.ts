import { PrivyClient, type AuthTokenClaims } from '@privy-io/server-auth'
import type { Config } from '../config'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { DrizzleClient } from '../db'

export interface PrivyAuthSession {
  userId: string // Privy DID
  appId: string
  sessionId: string
  walletAddress?: string // If user has connected wallet
  email?: string // If user has connected email
  dbUserId?: string // Our database user ID
}

export class PrivyAuthService {
  private static privyClient: PrivyClient | null = null

  /**
   * Initialize Privy client
   */
  static getPrivyClient(config?: Config): PrivyClient {
    if (!this.privyClient) {
      const appId = config?.privy?.appId || process.env.PRIVY_APP_ID || 'cmf6izaj6006mld0brhfx9u7d'
      const appSecret = config?.privy?.appSecret || process.env.PRIVY_APP_SECRET || ''
      
      if (!appId || !appSecret) {
        throw new Error('Privy configuration missing: PRIVY_APP_ID and PRIVY_APP_SECRET required')
      }

      this.privyClient = new PrivyClient(appId, appSecret)
    }
    return this.privyClient
  }

  /**
   * Verify Privy access token and get user session
   */
  static async verifyPrivyToken(
    token: string, 
    config?: Config
  ): Promise<AuthTokenClaims | null> {
    try {
      const privy = this.getPrivyClient(config)
      
      // Get verification key from config or use default
      const verificationKey = config?.privy?.verificationKey || process.env.PRIVY_VERIFICATION_KEY
      
      // Verify the token
      const claims = await privy.verifyAuthToken(token, verificationKey)
      return claims
    } catch (error) {
      console.error('Privy token verification error:', error)
      return null
    }
  }

  /**
   * Get or create user from Privy token
   */
  static async getOrCreateUserFromPrivy(
    claims: AuthTokenClaims,
    db: DrizzleClient,
    config?: Config
  ): Promise<PrivyAuthSession> {
    try {
      const privy = this.getPrivyClient(config)
      
      // Get full user details from Privy
      const privyUser = await privy.getUser(claims.userId)
      
      // Extract wallet address if available
      let walletAddress: string | undefined
      const walletAccount = privyUser.linkedAccounts?.find(
        account => account.type === 'wallet'
      )
      if (walletAccount && 'address' in walletAccount) {
        walletAddress = walletAccount.address.toLowerCase()
      }
      
      // Extract email if available
      let email: string | undefined
      const emailAccount = privyUser.linkedAccounts?.find(
        account => account.type === 'email'
      )
      if (emailAccount && 'address' in emailAccount) {
        email = emailAccount.address
      }

      // Find or create user in our database
      let dbUser = null
      
      // First try to find by wallet address if available
      if (walletAddress) {
        const existingUsers = await db.select().from(users)
          .where(eq(users.walletAddress, walletAddress))
          .limit(1)
        
        if (existingUsers.length > 0) {
          dbUser = existingUsers[0]
          
          // Update Privy DID if not set
          if (!dbUser.privyDid) {
            await db.update(users)
              .set({ privyDid: claims.userId })
              .where(eq(users.id, dbUser.id))
          }
        }
      }
      
      // If not found by wallet, try by Privy DID
      if (!dbUser) {
        const existingUsers = await db.select().from(users)
          .where(eq(users.privyDid, claims.userId))
          .limit(1)
        
        if (existingUsers.length > 0) {
          dbUser = existingUsers[0]
        }
      }
      
      // Create new user if not found
      if (!dbUser) {
        const newUsers = await db.insert(users).values({
          privyDid: claims.userId,
          walletAddress: walletAddress || null,
          email: email || null,
          status: 'active',
          metadata: {}
        }).returning()
        
        dbUser = newUsers[0]
      }

      return {
        userId: claims.userId,
        appId: claims.appId,
        sessionId: claims.sessionId,
        walletAddress,
        email,
        dbUserId: dbUser?.id
      }
    } catch (error) {
      console.error('Error getting/creating user from Privy:', error)
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
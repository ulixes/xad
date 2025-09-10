// Authentication service using SIWX (Sign In With X)
import { SignJWT, jwtVerify } from 'jose'
import { randomBytes } from 'crypto'
import { verifyMessage } from 'viem'
import type { Config } from '../config'

// JWT configuration
const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRY = '24h'

// Get JWT secret from config
function getJWTSecret(config?: Config): Uint8Array {
  const secret = config?.auth?.jwt?.secret || process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
  return new TextEncoder().encode(secret)
}

// Nonce store (in production, use Redis or database)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>()

// Clean expired nonces manually (no setInterval in Workers environment)
function cleanExpiredNonces() {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [key, value] of nonceStore.entries()) {
    if (value.timestamp < cutoff) {
      nonceStore.delete(key)
    }
  }
}

export interface AuthSession {
  address: string
  chainId: number
  userId: string
  iat: number
  exp: number
}

export class AuthService {
  /**
   * Generate a unique nonce for wallet authentication
   */
  static generateNonce(): string {
    // Clean expired nonces periodically
    cleanExpiredNonces()
    
    const nonce = randomBytes(32).toString('hex')
    const timestamp = Date.now()
    
    // Store nonce with timestamp (expires in 10 minutes)
    nonceStore.set(nonce, { nonce, timestamp })
    
    return nonce
  }

  /**
   * Verify SIWX message signature and return user session
   */
  static async verifySignature({
    message,
    signature,
    address,
    chainId
  }: {
    message: string
    signature: string
    address: string
    chainId: number
  }): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Extract nonce from message
      const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/)
      
      if (!nonceMatch) {
        return { valid: false, reason: 'Invalid message format: missing nonce' }
      }

      const nonce = nonceMatch[1]
      
      // Check if nonce exists and is not expired
      const storedNonce = nonceStore.get(nonce)
      
      if (!storedNonce) {
        // In development, be more lenient with nonce validation
        if (process.env.ENVIRONMENT !== 'dev') {
          return { valid: false, reason: 'Invalid or expired nonce' }
        }
      }

      // Remove used nonce (prevent replay attacks) - only if it exists
      if (storedNonce) {
        nonceStore.delete(nonce)
      }

      // Verify the signature
      let isValid = true
      if (process.env.ENVIRONMENT === 'dev') {
        try {
          isValid = await verifyMessage({
            address: address as `0x${string}`,
            message: message!,
            signature: signature as `0x${string}`
          })
        } catch (error) {
          console.error('Signature verification error:', error)
          isValid = true // Allow in dev mode
        }
      } else {
        isValid = await verifyMessage({
          address: address as `0x${string}`,
          message: message!,
          signature: signature as `0x${string}`
        })
      }

      if (!isValid) {
        return { valid: false, reason: 'Invalid signature' }
      }

      // Additional message validation - bypassed in dev mode
      if (process.env.ENVIRONMENT !== 'dev') {
        if (!message.toLowerCase().includes(address.toLowerCase()) || !message.includes('Chain ID: eip155:' + chainId)) {
          return { valid: false, reason: 'Message does not match expected format' }
        }
      }

      return { valid: true }
    } catch (error) {
      console.error('Signature verification error:', error)
      return { valid: false, reason: 'Signature verification failed' }
    }
  }

  /**
   * Create a JWT token for authenticated user
   */
  static async createToken(address: string, chainId: number, userId: string, config?: Config): Promise<string> {
    const token = await new SignJWT({
      address: address.toLowerCase(),
      chainId,
      userId
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(getJWTSecret(config))

    return token
  }

  /**
   * Verify and decode JWT token
   */
  static async verifyToken(token: string, config?: Config): Promise<AuthSession | null> {
    try {
      const { payload } = await jwtVerify(token, getJWTSecret(config))
      
      return {
        address: payload.address as string,
        chainId: payload.chainId as number,
        userId: payload.userId as string,
        iat: payload.iat as number,
        exp: payload.exp as number
      }
    } catch (error) {
      console.error('Token verification error:', error)
      return null
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
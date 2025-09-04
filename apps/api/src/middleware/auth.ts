import { Context, Next } from 'hono';
import { PrivyClient } from '@privy-io/server-auth';
import { logger } from '../utils/logger';

// Initialize PrivyClient if environment variables are available
let privyClient: PrivyClient | null = null;

// Temporarily disable Privy for testing - set to true when you have valid credentials
const DISABLE_PRIVY_FOR_TESTING = false;

console.log("process.env.PRIVY_APP_ID", process.env.PRIVY_APP_ID)
if (process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET && !DISABLE_PRIVY_FOR_TESTING) {
  try {
    privyClient = new PrivyClient({
      appId: process.env.PRIVY_APP_ID,
      appSecret: process.env.PRIVY_APP_SECRET,
    });
    console.log(`[INIT] Privy client initialized | app_id=${process.env.PRIVY_APP_ID}`);
  } catch (error) {
    console.error(`[INIT] Privy initialization failed | error=${error.message}`);
  }
} else {
  console.log('[INIT] Using mock authentication for development');
}

export interface PrivyUser {
  privyId: string;
  email?: string;
  phone?: string;
  wallets: Array<{
    address: string;
    type: string;
    verified: boolean;
  }>;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: PrivyUser;
  }
}

export async function verifyPrivyToken(c: Context, next: Next) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const endpoint = c.req.path;
  const method = c.req.method;
  const userAgent = c.req.header('user-agent');
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  
  try {
    const authHeader = c.req.header('authorization');
    
    // If no authorization header and no privy client, use mock auth
    if ((!authHeader || !authHeader.startsWith('Bearer ')) && !privyClient) {
      c.set('user', {
        privyId: 'did:privy:cm123456789abcdef',
        email: 'dev@example.com',
        phone: undefined,
        wallets: [{ address: '0x742d35Cc6634C0532925a3b8D430a8b5C8E86b7a', type: 'ethereum', verified: true }],
      });
      await next();
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization header', requestId }, 401);
    }

    if (!privyClient) {
      return c.json({ error: 'Privy not configured', requestId }, 500);
    }

    const authToken = authHeader.replace('Bearer ', '');
    
    // Decode token to check app ID mismatch
    try {
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const tokenAppId = payload.aud;
        const serverAppId = process.env.PRIVY_APP_ID;
        
        if (tokenAppId !== serverAppId) {
          logger.error('App ID mismatch detected', {
            requestId,
            endpoint,
            method,
            tokenAudience: tokenAppId,
            serverAppId: serverAppId
          });
        }
      }
    } catch (decodeError) {
      // Token decode failed, let Privy handle validation
    }

    console.log('toke: ', authToken)
    
    const claims = await privyClient.verifyAuthToken(authToken);
    
    // Extract wallet addresses from linked accounts
    const wallets = claims.linkedAccounts
      ?.filter((account: any) => account.type === 'wallet')
      ?.map((wallet: any) => ({
        address: wallet.address,
        type: wallet.walletClientType || wallet.type,
        verified: wallet.verifiedAt != null,
      })) || [];

    // Attach Privy user data to context
    c.set('user', {
      privyId: claims.userId,
      email: claims.email,
      phone: claims.phone,
      wallets,
    });

    const duration = Date.now() - startTime;
    logger.info('Auth success', {
      requestId,
      endpoint,
      method,
      userId: claims.userId,
      duration
    });
    
    await next();
  } catch (error: any) {
    console.log("error: ", error)
    const duration = Date.now() - startTime;
    
    logger.error('Auth failed', {
      requestId,
      endpoint,
      method,
      duration,
    }, error);
    
    if (error.type === 'missing_or_invalid_privy_app_id') {
      return c.json({ error: 'Invalid Privy app configuration', requestId }, 500);
    }
    
    return c.json({ error: 'Authentication failed', requestId }, 401);
  }
}

// Optional middleware - doesn't fail if no token
export async function optionalAuth(c: Context, next: Next) {
  try {
    if (!privyClient) {
      await next();
      return;
    }

    const authHeader = c.req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await next();
      return;
    }

    const authToken = authHeader.replace('Bearer ', '');
    const claims = await privyClient.verifyAuthToken(authToken);

    const wallets = claims.linkedAccounts
      ?.filter((account: any) => account.type === 'wallet')
      ?.map((wallet: any) => ({
        address: wallet.address,
        type: wallet.walletClientType || wallet.type,
        verified: wallet.verifiedAt != null,
      })) || [];

    c.set('user', {
      privyId: claims.userId,
      email: claims.email,
      phone: claims.phone,
      wallets,
    });

    await next();
  } catch (error) {
    // Silently fail for optional auth
    await next();
  }
}
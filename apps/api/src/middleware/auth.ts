import type { Context, Next } from 'hono';
import { PrivyClient } from '@privy-io/server-auth';
import { logger } from '../utils/logger';
import { getConfig } from '../config';
import type { Env } from '../types';

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

// Cache PrivyClient instances per app ID
const privyClientCache = new Map<string, PrivyClient>();

function getPrivyClient(c: Context<{ Bindings: Env }>): PrivyClient | null {
  try {
    const config = getConfig(c);
    const appId = config.auth.privy.appId;
    const appSecret = config.auth.privy.appSecret;

    if (!appId || !appSecret) {
      console.log('[INIT] Privy credentials not configured');
      return null;
    }

    // Check cache first
    if (privyClientCache.has(appId)) {
      return privyClientCache.get(appId)!;
    }

    // Create new client and cache it
    const client = new PrivyClient({
      appId,
      appSecret,
    });

    privyClientCache.set(appId, client);
    console.log(`[INIT] Privy client initialized | app_id=${appId}`);
    
    return client;
  } catch (error: any) {
    console.error(`[INIT] Privy initialization failed | error=${error.message}`);
    return null;
  }
}

export async function verifyPrivyToken(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const endpoint = c.req.path;
  const method = c.req.method;
  const userAgent = c.req.header('user-agent');
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  
  try {
    const authHeader = c.req.header('authorization');
    const privyClient = getPrivyClient(c);
    const config = getConfig(c);
    
    // If in development mode without privy client, use mock auth
    if ((!authHeader || !authHeader.startsWith('Bearer ')) && !privyClient && config.app.environment === 'development') {
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
        const serverAppId = config.auth.privy.appId;
        
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

    console.log('token: ', authToken);
    
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
    console.log("error: ", error);
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
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next): Promise<void> {
  try {
    const privyClient = getPrivyClient(c);
    
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
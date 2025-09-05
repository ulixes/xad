import type { Context, Next } from 'hono';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { logger } from '../utils/logger';
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

export async function verifyPrivyTokenJWKS(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const endpoint = c.req.path;
  const method = c.req.method;

  try {
    const authHeader = c.req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization header', requestId }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get config from context
    const { getConfig } = await import('../config');
    const config = getConfig(c);
    const privyAppId = config.auth.privy.appId;

    console.log(`[AUTH] Verifying token with JWKS | req=${requestId} | ${method} ${endpoint}`);

    const JWKS_URL = config.auth.privy.jwksUrl!;
    const jwks = createRemoteJWKSet(new URL(JWKS_URL));

    // Verify token using JWKS
    const { payload } = await jwtVerify(token, jwks, {
      issuer: 'privy.io',
      audience: privyAppId,
    });

    // Extract user data from JWT payload
    const privyUser: PrivyUser = {
      privyId: payload.sub as string,
      email: payload.email as string,
      phone: payload.phone as string,
      wallets: (payload.linkedAccounts as any[])
        ?.filter((account: any) => account.type === 'wallet')
        ?.map((wallet: any) => ({
          address: wallet.address,
          type: wallet.walletClientType || wallet.type,
          verified: wallet.verifiedAt != null,
        })) || [],
    };

    c.set('user', privyUser);

    const duration = Date.now() - startTime;
    console.log(`[AUTH] JWKS verification success | req=${requestId} | user=${privyUser.privyId} | ${duration}ms`);

    await next();
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('JWKS auth failed', {
      requestId,
      endpoint,
      method,
      duration,
    }, error);

    if (error.code === 'JWTAudienceMismatch') {
      console.error(`[AUTH] App ID mismatch | token_aud=${error.claim} | server_aud=${config.auth.privy.appId}`);
      return c.json({ error: 'Token app ID mismatch', requestId }, 401);
    }

    return c.json({ error: 'Token verification failed', requestId }, 401);
  }
}

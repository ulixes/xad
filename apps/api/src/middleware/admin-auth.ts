import { Context, Next } from 'hono';
import { logger } from '../utils/logger';
import type { Env } from '../types';

export async function verifyAdminToken(c: Context<{ Bindings: Env }>, next: Next) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const endpoint = c.req.path;
  const method = c.req.method;
  
  try {
    const authHeader = c.req.header('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('Admin auth failed - missing token', {
        requestId,
        endpoint,
        method,
      });
      return c.json({ error: 'Missing authorization header', requestId }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const adminToken = c.env.ADMIN_AUTH_TOKEN;

    if (!adminToken) {
      logger.error('Admin auth failed - no admin token configured', {
        requestId,
        endpoint,
        method,
      });
      return c.json({ error: 'Admin authentication not configured', requestId }, 500);
    }

    if (token !== adminToken) {
      logger.error('Admin auth failed - invalid token', {
        requestId,
        endpoint,
        method,
      });
      return c.json({ error: 'Invalid admin token', requestId }, 401);
    }

    const duration = Date.now() - startTime;
    logger.info('Admin auth success', {
      requestId,
      endpoint,
      method,
      duration
    });
    
    await next();
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('Admin auth error', {
      requestId,
      endpoint,
      method,
      duration,
    }, error);
    
    return c.json({ error: 'Authentication failed', requestId }, 401);
  }
}
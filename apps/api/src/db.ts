// This file exports the db from Hono context for compatibility with existing imports
import { Context } from 'hono';

export function getDb(c: Context) {
  return c.get('db');
}
import { Hono } from 'hono';
import { brands } from '../db/schema';
import type { Env } from '../types';
import { eq } from 'drizzle-orm';
import { verifyAdminToken } from '../middleware/admin-auth';

const brandsROutes = new Hono<{ Bindings: Env }>();

// Apply admin auth to all routes
brandsROutes.use('*', verifyAdminToken);

// Create a brand
brandsROutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Brand name is required' }, 400);
    }

    // Check if brand exists
    const db = c.get('db');
    const existingBrand = await db
      .select()
      .from(brands)
      .where(eq(brands.name, name.trim()))
      .limit(1);

    if (existingBrand.length > 0) {
      return c.json({ error: 'Brand already exists' }, 409);
    }

    // Create brand
    const [newBrand] = await db
      .insert(brands)
      .values({ name: name.trim() })
      .returning();

    return c.json({
      brand_id: newBrand!.brandId,
      name: newBrand!.name,
      created_at: newBrand!.createdAt,
    }, 201);
  } catch (error) {
    console.error('Error creating brand:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all brands
brandsROutes.get('/', async (c) => {
  try {
    const db = c.get('db');
    const allBrands = await db.select().from(brands);
    return c.json({ brands: allBrands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});


export default brandsROutes;
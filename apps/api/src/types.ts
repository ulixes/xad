import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

// Define an Env interface for type safety
export interface Env {
  DATABASE_URL: string;
  ADMIN_AUTH_TOKEN: string;
  JWT_SECRET: string;
  ESCROW_ADDRESS?: string;
  ENVIRONMENT: string; // "development" | "production" | "test"
}

// Extend Hono's context to include db
declare module 'hono' {
  interface ContextVariableMap {
    db: NeonHttpDatabase;
  }
}
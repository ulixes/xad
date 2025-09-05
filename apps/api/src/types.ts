import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

// Define an Env interface for type safety
export interface Env {
  DATABASE_URL: string;
  PRIVY_APP_ID: string;
  PRIVY_APP_SECRET: string;
  ADMIN_AUTH_TOKEN: string;
  ENVIRONMENT?: string; // "development" | "production" | "test"
}

// Extend Hono's context to include db
declare module 'hono' {
  interface ContextVariableMap {
    db: NeonHttpDatabase;
  }
}
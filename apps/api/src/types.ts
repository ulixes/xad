import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

// Define an Env interface for type safety
export interface Env {
  DATABASE_URL: string;
  ADMIN_AUTH_TOKEN: string;
  JWT_SECRET: string;
  ESCROW_ADDRESS?: string;
  ENVIRONMENT: string; // "development" | "production" | "test"
  
  // Para configuration
  PARA_ENVIRONMENT?: 'SANDBOX' | 'BETA' | 'PROD';
  PARA_API_KEY?: string;
  PARA_SECRET_KEY?: string;
  
  // Privy configuration (for backward compatibility)
  PRIVY_APP_ID?: string;
  PRIVY_APP_SECRET?: string;
  PRIVY_VERIFICATION_KEY?: string;
}

// Extend Hono's context to include db
declare module 'hono' {
  interface ContextVariableMap {
    db: NeonHttpDatabase;
  }
}
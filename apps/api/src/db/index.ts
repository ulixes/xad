import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Connection cache to reuse database connections (key = databaseUrl)
const connectionCache = new Map<string, ReturnType<typeof createDBInstance>>();

function createDBInstance(databaseUrl: string, serviceName: string, environment: string) {
  console.log("Creating database connection pool...", databaseUrl.substring(0, 30) + '...');
  const sql = neon(databaseUrl);
  const db = drizzle(sql);
  return {
    db,
    serviceName,
    environment,
    version: "1.0.0",
    getCallerInfo() {
      return {
        serviceName,
        environment,
        version: this.version,
      };
    },
  };
}

export function initDB(databaseUrl: string, serviceName: string, environment: string) {
  // Check cache for existing connection
  const cached = connectionCache.get(databaseUrl);
  if (cached) {
    console.log("Reusing cached database connection");
    return cached;
  }
  
  // Create new connection and cache it
  const dbInstance = createDBInstance(databaseUrl, serviceName, environment);
  connectionCache.set(databaseUrl, dbInstance);
  return dbInstance;
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export function initDB(env: Env, serviceName: string, environment: string) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql);
  return {
    db,
    serviceName,
    environment,
    version: "1.0.0", // Hardcode or configure via wrangler.toml
    getCallerInfo() {
      return {
        serviceName,
        environment,
        version: this.version,
      };
    },
  };
}

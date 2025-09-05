import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export function initDB(databaseUrl: string, serviceName: string, environment: string) {
  console.log("Initializing database connection...", databaseUrl);
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

import type { Context } from "hono";
import type { Env } from "../types";

export interface Config {
  database: {
    url: string;
  };
  auth: {
    privy: {
      appId: string;
      appSecret: string;
      jwksUrl?: string;
    };
    admin: {
      token: string;
    };
  };
  app: {
    environment: string;
    serviceName: string;
    version: string;
  };
}

export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: Config | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  initialize(env: Env): Config {
    if (!env.ENVIRONMENT) {
      throw new Error("ENVIRONMENT is required");
    }
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }
    if (!env.PRIVY_APP_ID) {
      throw new Error("PRIVY_APP_ID is required");
    }
    if (!env.PRIVY_APP_SECRET) {
      throw new Error("PRIVY_APP_SECRET is required");
    }
    if (!env.ADMIN_AUTH_TOKEN) {
      throw new Error("ADMIN_AUTH_TOKEN is required");
    }

    this.config = {
      database: {
        url: env.DATABASE_URL,
      },
      auth: {
        privy: {
          appId: env.PRIVY_APP_ID,
          appSecret: env.PRIVY_APP_SECRET,
          jwksUrl: `https://auth.privy.io/api/v1/apps/${env.PRIVY_APP_ID}/jwks.json`,
        },
        admin: {
          token: env.ADMIN_AUTH_TOKEN,
        },
      },
      app: {
        environment: env.ENVIRONMENT,
        serviceName: "xad-api",
        version: "1.0.0",
      },
    };

    return this.config;
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error("Config not initialized. Call initialize() first.");
    }
    return this.config;
  }

  static fromContext(c: Context<{ Bindings: Env }>): Config {
    const instance = ConfigManager.getInstance();
    if (!instance.config) {
      instance.initialize(c.env);
    }
    return instance.getConfig();
  }

  static reset(): void {
    ConfigManager.instance = null;
  }
}

export function getConfig(c: Context<{ Bindings: Env }>): Config {
  return ConfigManager.fromContext(c);
}

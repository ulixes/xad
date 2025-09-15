import type { Context } from "hono";
import type { Env } from "../types";

export interface Config {
  database: {
    url: string;
  };
  auth: {
    admin: {
      token: string;
    };
    jwt: {
      secret: string;
    };
  };
  app: {
    environment: string;
    serviceName: string;
    version: string;
  };
  payment: {
    escrowWalletAddress: string;
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
    if (!env.ADMIN_AUTH_TOKEN) {
      throw new Error("ADMIN_AUTH_TOKEN is required");
    }
    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }
    // Use ESCROW_ADDRESS only
    const escrowAddress = env.ESCROW_ADDRESS || '0x16a5274cCd454f90E99Ea013c89c38381b635f5b';

    this.config = {
      database: {
        url: env.DATABASE_URL,
      },
      auth: {
        admin: {
          token: env.ADMIN_AUTH_TOKEN,
        },
        jwt: {
          secret: env.JWT_SECRET,
        },
      },
      app: {
        environment: env.ENVIRONMENT,
        serviceName: "xad-api",
        version: "1.0.0",
      },
      payment: {
        escrowWalletAddress: escrowAddress,
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
      // Use process.env for local development, c.env for Cloudflare Workers
      const env = (c.env && Object.keys(c.env).length > 0) ? c.env : process.env as any as Env;
      instance.initialize(env);
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

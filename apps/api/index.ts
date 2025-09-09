import { Hono, type ExecutionContext } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import actionRoutes from "./src/routes/tasks";
import { initDB } from "./src/db/index";
import { ConfigManager } from "./src/config";
import type { Env } from "./src/types";

// Define the Hono app with typed bindings
const app = new Hono<{ Bindings: Env }>();

// Initialize config and DB middleware
app.use("*", async (c, next) => {
  const config = ConfigManager.fromContext(c);
  console.log("Config loaded:", config);
  const dbInstance = initDB(config.database.url, config.app.serviceName, config.app.environment);
  c.set("db", dbInstance.db);
  await next();
});

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "";

  // Allow Chrome extension origins (chrome-extension://...) and localhost for development
  const allowedOriginPattern =
    /^(chrome-extension:\/\/|http:\/\/localhost|https:\/\/localhost)/;

  return cors({
    origin: (requestOrigin) => {
      // Allow Chrome extensions, localhost, and specific production domains
      if (!requestOrigin) return null;
      if (allowedOriginPattern.test(requestOrigin)) return requestOrigin;
      // Add your production domains here if needed
      if (requestOrigin === "https://xad.com") return requestOrigin;
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Privy-Token",
    ],
    exposeHeaders: ["X-Request-Id"],
    maxAge: 86400,
    credentials: true,
  })(c, next);
});

app.use("*", logger());

// Health check
app.get("/", (c) => {
  return c.json({
    message: "XAD Task API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route("/api/actions", actionRoutes);

// Error handling
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});

// Export for Cloudflare Workers
export default {
  fetch(request: Request, ctx: ExecutionContext) {
    return app.fetch(request, ctx);
  },
};

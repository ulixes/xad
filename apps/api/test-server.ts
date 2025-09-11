#!/usr/bin/env bun
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import authRoutes from "./src/routes/auth";
import campaignRoutes from "./src/routes/campaigns";
import { initDB } from "./src/db/index";

// Simple test server without Cloudflare Workers complexity
const app = new Hono();

// CORS middleware
app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Simple DB middleware using environment variables
app.use("*", async (c, next) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required");
  }
  
  const dbInstance = initDB(dbUrl, "test-api", "dev");
  c.set("db", dbInstance.db);
  await next();
});

// Health check
app.get("/", (c) => {
  return c.json({
    message: "XAD Test API is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/campaigns", campaignRoutes);

// Error handling
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// Start server
const port = 3003;
console.log(`Test server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
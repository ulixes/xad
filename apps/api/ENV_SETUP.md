# Environment Configuration Guide

## Overview

This API uses Cloudflare Workers with Wrangler for deployment. Environment variables are managed differently for local development vs production deployment.

## Configuration Structure

All environment configuration is centralized in `src/config/index.ts`. The configuration is initialized from environment variables and provides a type-safe interface for accessing config values throughout the application.

## Local Development

For local development, Wrangler can read from `.dev.vars` file:

1. Create a `.dev.vars` file in the root directory:
```bash
DATABASE_URL=your_dev_database_url
PRIVY_APP_ID=your_dev_privy_app_id
PRIVY_APP_SECRET=your_dev_privy_app_secret
ADMIN_AUTH_TOKEN=your_dev_admin_token
```

2. Run the development server:
```bash
bun run dev  # Runs locally with persistence
```

## Production Deployment

### Setting Secrets

For production, sensitive values should be set as Cloudflare secrets:

```bash
# Set secrets for development environment
echo "your_database_url" | bun run secrets:set:dev DATABASE_URL
echo "your_privy_app_id" | bun run secrets:set:dev PRIVY_APP_ID
echo "your_privy_app_secret" | bun run secrets:set:dev PRIVY_APP_SECRET
echo "your_admin_token" | bun run secrets:set:dev ADMIN_AUTH_TOKEN

# Set secrets for production environment
echo "your_database_url" | bun run secrets:set:prod DATABASE_URL
echo "your_privy_app_id" | bun run secrets:set:prod PRIVY_APP_ID
echo "your_privy_app_secret" | bun run secrets:set:prod PRIVY_APP_SECRET
echo "your_admin_token" | bun run secrets:set:prod ADMIN_AUTH_TOKEN
```

### List Current Secrets

```bash
bun run secrets:list
```

### Deploy to Environments

```bash
# Deploy to development
bun run deploy:dev

# Deploy to production
bun run deploy:prod
```

## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string for Neon database | Yes |
| `PRIVY_APP_ID` | Privy application ID for authentication | Yes |
| `PRIVY_APP_SECRET` | Privy application secret for authentication | Yes |
| `ADMIN_AUTH_TOKEN` | Bearer token for admin API endpoints | Yes |
| `ENVIRONMENT` | Environment name (development/production) | Auto-set by wrangler |

## How It Works

1. **Centralized Config**: All environment variables are loaded through `src/config/index.ts`
2. **Type Safety**: TypeScript interfaces ensure all required variables are defined
3. **Context-based Access**: Config is accessed via Hono context (`c.env`)
4. **No process.env**: Cloudflare Workers don't have `process.env`, use `c.env` instead
5. **Validation**: Config manager validates all required variables on initialization

## Important Notes

- Never commit `.dev.vars` or any file containing real secrets
- Use different Privy apps for dev/staging/production
- Database URLs should point to different databases per environment
- Admin tokens should be unique per environment
- The `ENVIRONMENT` variable is automatically set by wrangler based on the deployment target
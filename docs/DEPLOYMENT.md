# Deployment Guide

## GitHub Secrets Setup

### Required Secrets for API (Cloudflare Workers)

Add these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

#### Cloudflare Configuration
- `CF_API_TOKEN` - Your Cloudflare API token (create at https://dash.cloudflare.com/profile/api-tokens)
  - Required permissions: Account:Cloudflare Workers Scripts:Edit
- `CF_ACCOUNT_ID` - Your Cloudflare account ID (find in Cloudflare dashboard)
- `CF_WORKER_NAME` - Name for your worker (default: xad-api)

#### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string for production
- `STAGING_DATABASE_URL` - (Optional) PostgreSQL connection string for staging

#### Authentication
- `ADMIN_AUTH_TOKEN` - Admin authentication token for API
- `STAGING_ADMIN_AUTH_TOKEN` - (Optional) Admin token for staging

#### Privy Configuration
- `PRIVY_APP_ID` - Your Privy application ID
- `PRIVY_APP_SECRET` - Your Privy application secret
- `STAGING_PRIVY_APP_ID` - (Optional) Privy app ID for staging
- `STAGING_PRIVY_APP_SECRET` - (Optional) Privy app secret for staging

### Required Secrets for Chrome Extension

- `VITE_PRIVY_APP_ID` - Privy app ID for the extension
- `VITE_API_URL` - Production API URL (e.g., https://your-worker.workers.dev)

## Deployment Workflows

### API Deployment (Cloudflare Workers)

The API automatically deploys to production when you push to the `master` branch and files in `apps/api/` are changed.

You can also manually deploy to staging:
1. Go to Actions tab in GitHub
2. Select "API Deploy to Cloudflare Workers"
3. Click "Run workflow"
4. Select "staging" environment

### Chrome Extension Release

The extension automatically creates a GitHub release when:
1. You update the version in `apps/extension/package.json`
2. Push changes to `master` branch
3. Files in `apps/extension/` are modified

The release includes a zip file ready for Chrome Web Store submission.

## Environment Configuration

### API Environment Variables

Production environment variables are set in the GitHub Actions workflow and injected into `wrangler.toml` during deployment.

### Extension Environment Variables

Environment variables are embedded at build time using Vite. They cannot be changed after the extension is built.

## Manual Deployment

### API Manual Deployment
```bash
cd apps/api
wrangler deploy --env production
```

### Extension Manual Build
```bash
cd apps/extension
bun run build
bun run package
```

## Troubleshooting

### API Deployment Issues
- Ensure `CF_API_TOKEN` has correct permissions
- Check that `CF_ACCOUNT_ID` matches your Cloudflare account
- Verify database connection string is correct

### Extension Build Issues
- Ensure all environment variables are set in GitHub secrets
- Check that version number is incremented in package.json
- Verify that no release exists for the current version
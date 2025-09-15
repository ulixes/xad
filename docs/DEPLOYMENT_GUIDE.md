# 🚀 Deployment & Release Guide

## Table of Contents
- [Environment Setup](#environment-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Release Workflows](#release-workflows)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)

---

## Environment Setup

### GitHub Environments
We use two GitHub environments for deployment:
- **`production`** - For stable releases (master branch)
- **`development`** - For testing releases (dev branch)

### Creating GitHub Environments
1. Go to your repository on GitHub
2. Navigate to **Settings → Environments**
3. Click **New environment**
4. Create `production` and `development` environments
5. Configure environment-specific secrets (see below)

---

## GitHub Secrets Configuration

### 📋 Complete Secrets List

Navigate to **Settings → Secrets and variables → Actions** and add:

#### 🔧 Cloudflare Secrets (API Deployment)

| Secret Name | Description | Where to Find | Required |
|------------|-------------|---------------|----------|
| `CF_API_TOKEN` | Cloudflare API token for deployment | [Create token](https://dash.cloudflare.com/profile/api-tokens) with "Edit Workers Scripts" permission | ✅ Yes |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard → Right sidebar | ✅ Yes |
| `CF_WORKER_NAME` | Name for your worker | Choose any name (e.g., `xad-api`) | ⚪ Optional (defaults to `xad-api`) |

#### 🗄️ Database Secrets

| Secret Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/dbname?sslmode=require` | ✅ Yes |
| `ADMIN_AUTH_TOKEN` | Admin authentication token | Any secure random string | ✅ Yes |

#### 🔐 Privy Authentication Secrets

| Secret Name | Description | Where to Find | Required |
|------------|-------------|---------------|----------|
| `PRIVY_APP_ID` | Privy application ID | [Privy Dashboard](https://dashboard.privy.io) → Your App → Settings | ✅ Yes |
| `PRIVY_APP_SECRET` | Privy application secret | [Privy Dashboard](https://dashboard.privy.io) → Your App → Settings | ✅ Yes |

#### 🎨 Chrome Extension Secrets

| Secret Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `VITE_PRIVY_APP_ID` | Privy app ID for extension | Same as `PRIVY_APP_ID` or different for frontend | ✅ Yes |
| `VITE_API_URL` | API endpoint URL | Production: `https://your-worker.workers.dev`<br>Dev: `http://localhost:8787` | ✅ Yes |

### 🔄 Environment-Specific Secrets

For different values between environments, add secrets to specific environments:

1. Go to **Settings → Environments → [environment name]**
2. Add environment-specific secrets
3. These override repository-level secrets

Example setup:
```
Production Environment:
- VITE_API_URL = https://api.xad.com
- DATABASE_URL = postgresql://prod-db...

Development Environment:
- VITE_API_URL = https://dev-api.xad.com
- DATABASE_URL = postgresql://dev-db...
```

---

## Release Workflows

### 🎯 Chrome Extension Releases

#### Production Release (Master Branch)
```bash
# 1. Update version in package.json
cd apps/extension
# Edit package.json version (e.g., 0.0.1 → 0.0.2)

# 2. Commit and push to master
git add package.json
git commit -m "Release version 0.0.2"
git push origin master

# 3. GitHub Actions automatically:
# - Builds extension with production secrets
# - Creates GitHub release with tag extension-v0.0.2
# - Uploads zip file for Chrome Web Store
```

#### Development Release (Dev Branch)
```bash
# 1. Switch to dev branch
git checkout dev

# 2. Make your changes
# Edit files...

# 3. Push to dev branch
git add .
git commit -m "Add new feature"
git push origin dev

# 4. GitHub Actions automatically:
# - Builds extension with development secrets
# - Creates pre-release with timestamp (dev-v0.0.2-20240115120000-abc1234)
# - Adds [DEV] badge to extension name
# - Marks as pre-release in GitHub
```

#### Manual Development Release
```bash
# Go to GitHub Actions tab
# Select "Extension Development Release"
# Click "Run workflow"
# Optionally specify custom tag
```

### ⚡ API Deployment (Cloudflare Workers)

#### Automatic Production Deployment
```bash
# Any push to master that changes apps/api/* triggers deployment
cd apps/api
# Make changes...
git add .
git commit -m "Update API endpoint"
git push origin master

# Automatically deploys to Cloudflare Workers production
```

#### Manual Staging Deployment
```bash
# 1. Go to GitHub Actions tab
# 2. Select "API Deploy to Cloudflare Workers"
# 3. Click "Run workflow"
# 4. Select "staging" environment
# 5. Click "Run workflow"
```

---

## Deployment Process

### 🏗️ Initial Setup Checklist

1. **Clone Repository**
   ```bash
   git clone https://github.com/ulixes/xad.git
   cd xad
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Configure GitHub Secrets** (see table above)

4. **Create Branches**
   ```bash
   # Development branch for testing
   git checkout -b dev
   git push -u origin dev
   ```

5. **Set Up Environments in GitHub**
   - Create `production` environment
   - Create `development` environment
   - Add environment-specific secrets

### 📦 Extension Development Workflow

```mermaid
graph LR
    A[Local Development] --> B[Push to dev branch]
    B --> C[Dev Release Created]
    C --> D[Test Extension]
    D --> E{Ready for Production?}
    E -->|Yes| F[Merge to master]
    E -->|No| A
    F --> G[Production Release]
    G --> H[Submit to Chrome Store]
```

### 🌐 API Development Workflow

```mermaid
graph LR
    A[Local Development] --> B[Test with wrangler dev]
    B --> C[Push to master]
    C --> D[Auto Deploy to Production]
    D --> E[Monitor in Cloudflare]
```

---

## Troubleshooting

### ❌ Common Issues

#### Extension Release Fails with 403 Error
**Solution**: Already fixed! Workflow has `contents: write` permission.

#### API Deployment Fails
**Check**:
- `CF_API_TOKEN` has "Edit Workers Scripts" permission
- `CF_ACCOUNT_ID` is correct (find in Cloudflare dashboard)
- Database URL is accessible from Cloudflare

#### Extension Build Missing Environment Variables
**Check**:
- Secrets are set in GitHub
- Using `VITE_` prefix for extension variables
- Secrets are in correct environment (dev vs prod)

#### Development Release Not Triggering
**Check**:
- Pushing to `dev` branch (not master)
- Changes are in `apps/extension/` directory
- Workflow file exists in `.github/workflows/`

### 📝 Manual Deployment Commands

#### Extension Manual Build
```bash
cd apps/extension
bun run build
bun run package
# Output: xad-extension-chrome.zip
```

#### API Manual Deploy
```bash
cd apps/api
wrangler deploy --env production
```

### 🔍 Viewing Deployment Logs

1. **GitHub Actions**: Repository → Actions tab
2. **Cloudflare Workers**: [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
3. **Extension Errors**: Chrome → Extensions → View errors

---

## Quick Reference

### Branch Strategy
- `master` → Production releases
- `dev` → Development/testing releases
- `feature/*` → Feature development (auto-creates dev releases)

### Version Numbering
- Production: `0.0.1`, `0.0.2`, etc.
- Development: `dev-v0.0.2-20240115120000-abc1234`

### Release Locations
- **Extension Releases**: GitHub Releases page
- **API Endpoint**: `https://[CF_WORKER_NAME].workers.dev`
- **Dev API**: Configure in development environment

### Important Files
- `.github/workflows/extension-release.yml` - Production extension workflow
- `.github/workflows/extension-dev-release.yml` - Development extension workflow
- `.github/workflows/api-deploy.yml` - API deployment workflow
- `apps/extension/package.json` - Extension version
- `apps/api/wrangler.toml` - API configuration (auto-generated)

---

## Support

For issues or questions:
1. Check [GitHub Issues](https://github.com/ulixes/xad/issues)
2. Review workflow runs in Actions tab
3. Check environment secrets configuration
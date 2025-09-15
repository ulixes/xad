# 🔑 GitHub Secrets Quick Setup

## Copy-Paste Checklist for GitHub Secrets

Go to your repository's **Settings → Secrets and variables → Actions** and add these secrets:

### ✅ Required Secrets Checklist

```
□ CF_API_TOKEN          (Cloudflare API token)
□ CF_ACCOUNT_ID         (Cloudflare account ID) 
□ CF_WORKER_NAME        (Worker name, e.g., "xad-api")
□ DATABASE_URL          (PostgreSQL connection string)
□ ADMIN_AUTH_TOKEN      (Random secure token)
□ PRIVY_APP_ID          (From Privy Dashboard)
□ PRIVY_APP_SECRET      (From Privy Dashboard)
□ VITE_API_URL          (Your API URL)
□ VITE_PRIVY_APP_ID     (Same as PRIVY_APP_ID)
```

---

## Step-by-Step Setup

### 1️⃣ Cloudflare Setup
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Copy the token → Add as `CF_API_TOKEN`
5. Copy your Account ID from dashboard → Add as `CF_ACCOUNT_ID`
6. Choose a worker name → Add as `CF_WORKER_NAME` (e.g., "xad-api")

### 2️⃣ Database Setup
1. Get your PostgreSQL connection string from your provider (Neon, Supabase, etc.)
2. Format: `postgresql://user:password@host/database?sslmode=require`
3. Add as `DATABASE_URL`

### 3️⃣ Admin Token
1. Generate a secure random token:
   ```bash
   openssl rand -hex 32
   ```
2. Add as `ADMIN_AUTH_TOKEN`

### 4️⃣ Privy Setup
1. Go to https://dashboard.privy.io
2. Select your app (or create one)
3. Go to Settings → API Keys
4. Copy App ID → Add as both `PRIVY_APP_ID` and `VITE_PRIVY_APP_ID`
5. Copy App Secret → Add as `PRIVY_APP_SECRET`

### 5️⃣ API URL Setup
- **Production**: `https://your-worker-name.workers.dev`
- **Development**: `http://localhost:8787` or staging URL
- Add as `VITE_API_URL`

---

## Environment-Specific Values

### Production Environment
```yaml
VITE_API_URL: https://xad-api-production.workers.dev
DATABASE_URL: postgresql://prod_user:prod_pass@prod-host/prod-db
```

### Development Environment
```yaml
VITE_API_URL: https://xad-api-staging.workers.dev
DATABASE_URL: postgresql://dev_user:dev_pass@dev-host/dev-db
```

---

## Quick Test

After adding all secrets, test your setup:

1. **Test Extension Build**:
   ```bash
   # Go to Actions → Extension Development Release → Run workflow
   ```

2. **Test API Deployment**:
   ```bash
   # Go to Actions → API Deploy → Run workflow → Select staging
   ```

---

## Your Current Secrets (Added)

Based on your timestamps, you've already added:
- ✅ `ADMIN_AUTH_TOKEN` (28 min ago)
- ✅ `CF_ACCOUNT_ID` (23 min ago)
- ✅ `CF_API_TOKEN` (24 min ago)
- ✅ `CF_WORKER_NAME` (23 min ago)
- ✅ `DATABASE_URL` (21 min ago)
- ✅ `PRIVY_APP_ID` (29 min ago)
- ✅ `PRIVY_APP_SECRET` (28 min ago)
- ✅ `VITE_API_URL` (32 min ago)
- ✅ `VITE_PRIVY_APP_ID` (30 min ago)

**You're all set! 🎉**

---

## Next Steps

1. **Trigger a development release**:
   ```bash
   git checkout dev
   git push origin dev
   ```

2. **Trigger API deployment**:
   ```bash
   # Push any change to apps/api/ on master branch
   ```

3. **Check the Actions tab** for build status

---

## Common Values Reference

### Example DATABASE_URL formats:
```
# Neon
postgresql://neondb_owner:password@ep-example.region.aws.neon.tech/neondb?sslmode=require

# Supabase
postgresql://postgres:password@db.projectid.supabase.co:5432/postgres

# Local
postgresql://localhost:5432/mydb
```

### Example VITE_API_URL:
```
# Production
https://xad-api.workers.dev

# Staging
https://xad-api-staging.workers.dev

# Local Development
http://localhost:8787
```
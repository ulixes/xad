# 🔧 Database Connection Fix for Production

## Current Issue
The API is deployed but database queries are failing with:
```
Failed query: select "id", "privy_did", "wallet_address"... from "users" where "users"."wallet_address" = $1
```

## Solution

### Update DATABASE_URL in GitHub Secrets

The production database connection string should be:
```
postgresql://neondb_owner:npg_4U5PwkBWZRcf@ep-purple-dawn-adq40ga7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important Changes:**
1. ✅ Using the pooler endpoint (`-pooler` in the hostname)
2. ✅ Removed `channel_binding=require` (not supported by Cloudflare Workers)
3. ✅ Keep `sslmode=require`

### Steps to Fix:

1. **Go to GitHub Secrets**
   - https://github.com/ulixes/xad/settings/secrets/actions
   - Click on `DATABASE_URL`
   - Click "Update"

2. **Replace with this exact value:**
   ```
   postgresql://neondb_owner:npg_4U5PwkBWZRcf@ep-purple-dawn-adq40ga7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

3. **Re-deploy the API**
   - Go to Actions tab
   - Find the last "API Deploy" workflow
   - Click "Re-run all jobs"
   - OR manually trigger: Actions → API Deploy → Run workflow

### Why This Fixes It:

1. **Pooler Connection**: Cloudflare Workers need the pooler connection for serverless environments
2. **No channel_binding**: This parameter isn't supported in serverless/edge environments
3. **SSL Required**: Keeps the connection secure

### Verify Fix After Deployment:

```bash
# Check logs
wrangler tail --env production

# Test the endpoint
curl -X POST https://xad-api-production.xad.workers.dev/api/users/current \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Database Details:
- **Branch**: production-beta (br-lingering-cake-ad9hcf4d)
- **Database**: neondb
- **Tables**: All present and migrated
- **Test User**: 0xdee9966fcdbcfae388944f295e44a7b0e313caca exists in database

The database is working correctly, just needs the proper connection string format for Cloudflare Workers.
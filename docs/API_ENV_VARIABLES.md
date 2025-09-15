# 🔐 API Environment Variables - COMPLETE LIST

## ⚠️ Required GitHub Secrets for API Deployment

Add ALL of these to your GitHub repository secrets (Settings → Secrets and variables → Actions):

### 🔴 CRITICAL - Currently Missing (Add These NOW!)

| Secret Name | Description | Example Value | Required |
|------------|-------------|---------------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | `openssl rand -hex 32` | ✅ YES |
| `ESCROW_WALLET_ADDRESS` | Wallet address for escrow payments | `0x16a5274cCd454f90E99Ea013c89c38381b635f5b` | ✅ YES |
| `ESCROW_CONTRACT_ADDRESS` | Smart contract address for escrow (optional, falls back to wallet) | `0x...` | ⚪ Optional |
| `PRIVY_VERIFICATION_KEY` | Privy webhook verification key | Get from Privy Dashboard → Webhooks | ⚪ Optional |

### ✅ Already Configured (Based on Your Timestamps)

| Secret Name | Description | Added |
|------------|-------------|-------|
| `CF_API_TOKEN` | Cloudflare API token | 24 min ago |
| `CF_ACCOUNT_ID` | Cloudflare account ID | 23 min ago |
| `CF_WORKER_NAME` | Worker name | 23 min ago |
| `DATABASE_URL` | PostgreSQL connection string | 21 min ago |
| `ADMIN_AUTH_TOKEN` | Admin auth token | 28 min ago |
| `PRIVY_APP_ID` | Privy application ID | 29 min ago |
| `PRIVY_APP_SECRET` | Privy application secret | 28 min ago |

---

## 📋 Complete Environment Variables List

### Production Environment Variables
```yaml
ENVIRONMENT: "production"
DATABASE_URL: postgresql://...                    # ✅ Added
ADMIN_AUTH_TOKEN: your-admin-token               # ✅ Added
PRIVY_APP_ID: your-privy-app-id                 # ✅ Added
PRIVY_APP_SECRET: your-privy-secret             # ✅ Added
PRIVY_VERIFICATION_KEY: your-verification-key   # ❌ MISSING (Optional)
JWT_SECRET: your-jwt-secret                     # ❌ MISSING (Required)
ESCROW_WALLET_ADDRESS: 0x...                    # ❌ MISSING (Required)
ESCROW_CONTRACT_ADDRESS: 0x...                  # ❌ MISSING (Optional)
LOG_LEVEL: "info"
```

### Where Each Variable is Used

| Variable | Used In | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `/src/config/index.ts`, `/src/db/migrate.ts` | Database connection |
| `ADMIN_AUTH_TOKEN` | `/src/config/index.ts` | Admin API authentication |
| `JWT_SECRET` | `/src/config/index.ts`, `/src/services/auth.ts` | JWT token signing |
| `PRIVY_APP_ID` | `/src/services/privyAuth.ts` | Privy SDK initialization |
| `PRIVY_APP_SECRET` | `/src/services/privyAuth.ts` | Privy SDK authentication |
| `PRIVY_VERIFICATION_KEY` | `/src/services/privyAuth.ts` | Webhook verification (optional) |
| `ESCROW_WALLET_ADDRESS` | `/src/config/index.ts`, `/src/routes/campaigns.ts` | Payment destination |
| `ESCROW_CONTRACT_ADDRESS` | `/src/routes/campaigns.ts` | Smart contract (optional, falls back to wallet) |
| `ENVIRONMENT` | Multiple files | Environment detection (dev/staging/production) |

---

## 🚀 Quick Setup Commands

### 1. Generate JWT_SECRET
```bash
# Generate a secure JWT secret
openssl rand -hex 32
# Example output: a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5
```

### 2. Add All Missing Secrets to GitHub
```bash
# Go to: https://github.com/ulixes/xad/settings/secrets/actions/new

# Add these secrets:
JWT_SECRET = [generated value from step 1]
ESCROW_WALLET_ADDRESS = 0x16a5274cCd454f90E99Ea013c89c38381b635f5b
ESCROW_CONTRACT_ADDRESS = [optional, leave empty if not using smart contract]
PRIVY_VERIFICATION_KEY = [optional, from Privy Dashboard → Webhooks]
```

### 3. Verify All Secrets Are Set
After adding, you should have these secrets in GitHub:
- ✅ CF_API_TOKEN
- ✅ CF_ACCOUNT_ID  
- ✅ CF_WORKER_NAME
- ✅ DATABASE_URL
- ✅ ADMIN_AUTH_TOKEN
- ✅ PRIVY_APP_ID
- ✅ PRIVY_APP_SECRET
- ✅ JWT_SECRET (NEW)
- ✅ ESCROW_WALLET_ADDRESS (NEW)
- ⚪ ESCROW_CONTRACT_ADDRESS (Optional)
- ⚪ PRIVY_VERIFICATION_KEY (Optional)

---

## 📝 Notes

1. **ESCROW_WALLET_ADDRESS** is REQUIRED - the API checks for this on startup
2. **JWT_SECRET** is REQUIRED - used for authentication
3. **ESCROW_CONTRACT_ADDRESS** is optional - falls back to ESCROW_WALLET_ADDRESS
4. **PRIVY_VERIFICATION_KEY** is optional - only needed for webhook verification

## 🔄 After Adding Secrets

1. Re-run the failed workflow in GitHub Actions
2. Or trigger a new deployment by pushing any change
3. Monitor logs with: `wrangler tail --env production`

---

## ⚠️ Security Best Practices

1. **Never commit these values to code**
2. **Use different values for staging/production**
3. **Rotate secrets regularly**
4. **Use strong, random values for JWT_SECRET**
5. **Verify wallet addresses are correct before deploying**
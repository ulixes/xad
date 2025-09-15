# 🚀 Release Commands Cheatsheet

## Chrome Extension Releases

### 📦 Production Release (to Chrome Web Store)
```bash
# 1. Switch to master branch
git checkout master
git pull origin master

# 2. Update version
cd apps/extension
# Edit package.json: "version": "0.0.X" → "0.0.Y"

# 3. Commit and push (triggers auto-release)
git add package.json
git commit -m "Release extension v0.0.Y"
git push origin master

# ✅ GitHub Actions creates release with zip file
# Download from: GitHub → Releases → extension-v0.0.Y
```

### 🧪 Development Release (for testing)
```bash
# 1. Switch to dev branch
git checkout dev
git pull origin dev

# 2. Make your changes
cd apps/extension
# Edit files...

# 3. Push to trigger dev release
git add .
git commit -m "Test feature X"
git push origin dev

# ✅ Creates pre-release: dev-v0.0.Y-timestamp-sha
# Extension name will have [DEV] badge
```

### 🎯 Manual Dev Release (custom tag)
```bash
# Via GitHub UI:
# 1. Go to Actions tab
# 2. Select "Extension Development Release"
# 3. Click "Run workflow"
# 4. Enter custom tag (optional): "dev-v0.0.1-beta.1"
# 5. Run workflow
```

---

## API Deployment (Cloudflare Workers)

### ⚡ Production Deployment (automatic)
```bash
# Any change to apps/api/ on master triggers deployment
cd apps/api
# Make changes...
git add .
git commit -m "Update API endpoint"
git push origin master

# ✅ Auto-deploys to production Cloudflare Worker
```

### 🔧 Staging Deployment (manual)
```bash
# Via GitHub UI:
# 1. Go to Actions tab
# 2. Select "API Deploy to Cloudflare Workers"
# 3. Click "Run workflow"
# 4. Select environment: "staging"
# 5. Run workflow
```

### 💻 Local API Testing
```bash
cd apps/api
bun run dev
# API runs at http://localhost:8787
```

---

## Quick Release Workflows

### 🏃 Speed Run: Extension to Production
```bash
# Fastest way to release extension
git checkout master && git pull
cd apps/extension
npm version patch  # Auto-increments version
git add . && git commit -m "Release $(node -p "require('./package.json').version")"
git push origin master
# Wait for GitHub Actions...
# Download zip from Releases page
```

### 🏃 Speed Run: API to Production
```bash
# Fastest way to deploy API
git checkout master && git pull
cd apps/api
# Make your changes
git add . && git commit -m "Deploy API updates"
git push origin master
# Auto-deploys to Cloudflare
```

---

## Version Management

### Extension Versioning
```bash
# Check current version
cd apps/extension
node -p "require('./package.json').version"

# Increment version
npm version patch  # 0.0.1 → 0.0.2
npm version minor  # 0.0.1 → 0.1.0
npm version major  # 0.0.1 → 1.0.0
```

### View All Releases
```bash
# List all extension releases
gh release list --repo ulixes/xad

# Download specific release
gh release download extension-v0.0.2 --repo ulixes/xad
```

---

## Branch Management

### Standard Workflow
```bash
# Feature development
git checkout -b feature/new-feature
# Work on feature...
git push origin feature/new-feature
# Creates dev release automatically

# When ready for production
git checkout master
git merge feature/new-feature
git push origin master
# Creates production release
```

### Current Branch Setup
```
master     → Production (auto-deploy)
dev        → Development (auto-deploy with [DEV] tag)
feature/*  → Feature branches (auto-create dev releases)
```

---

## Monitoring Deployments

### 📊 Check Status
```bash
# View GitHub Actions status
gh run list --repo ulixes/xad

# Watch specific workflow
gh run watch --repo ulixes/xad
```

### 🔍 View Logs
- **GitHub Actions**: https://github.com/ulixes/xad/actions
- **Cloudflare Workers**: https://dash.cloudflare.com → Workers & Pages
- **Extension Console**: Chrome DevTools → Extensions

---

## Emergency Procedures

### 🔙 Rollback Extension
```bash
# Delete bad release
gh release delete extension-v0.0.X --yes --cleanup-tag

# Re-release previous version
git checkout master
git revert HEAD
git push origin master
```

### 🔙 Rollback API
```bash
# Via Cloudflare Dashboard
# Workers & Pages → Your Worker → Deployments → Rollback
```

---

## Testing Releases

### Test Extension Locally
```bash
cd apps/extension
bun run build
# Load .output/chrome-mv3 in Chrome as unpacked extension
```

### Test API Locally
```bash
cd apps/api
bun run dev
# Test at http://localhost:8787
```

---

## Common Commands Reference

```bash
# Check what will be released
git status
git diff

# View recent releases
gh release list --limit 5

# Download latest extension
gh release download --pattern "*.zip"

# Check workflow runs
gh run list --workflow "Extension Release"

# Cancel running workflow
gh run cancel [run-id]

# Re-run failed workflow
gh run rerun [run-id]
```

---

## Tips & Tricks

1. **Always increment version** before pushing to master
2. **Test on dev branch first** before production
3. **Check Actions tab** after pushing for build status
4. **Keep dev branch updated**: `git merge master` regularly
5. **Use semantic versioning**: major.minor.patch
6. **Tag important releases** with descriptions
7. **Monitor Cloudflare dashboard** after API deploys

---

## Quick Links

- 📦 [GitHub Releases](https://github.com/ulixes/xad/releases)
- 🔧 [GitHub Actions](https://github.com/ulixes/xad/actions)
- ☁️ [Cloudflare Dashboard](https://dash.cloudflare.com)
- 🔑 [GitHub Secrets](https://github.com/ulixes/xad/settings/secrets/actions)
- 🌍 [GitHub Environments](https://github.com/ulixes/xad/settings/environments)
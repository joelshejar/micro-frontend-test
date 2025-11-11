# Prerequisites Guide

Complete checklist and detailed setup instructions for deploying the micro-frontend architecture to Cloudflare.

## Quick Status

### Current State

- ✅ **Cloudflare Account**: Created and active
- ✅ **Pages Projects**: Both host and remote connected to GitHub
- ✅ **Automatic Deployments**: Enabled via GitHub integration
- ✅ **Wrangler CLI**: Installed and authenticated
- ✅ **KV Namespace**: Created with production and preview IDs
- ✅ **KV Binding (Host)**: Bound to micro-frontend-test project
- ⏳ **KV Binding (Remote)**: Needs manual binding in dashboard
- ⏳ **KV Initialization**: Needs initial remote URL value

**Action Required**: Complete the two pending items above before deploying.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Accounts & Access](#accounts--access)
- [Development Tools](#development-tools)
- [Cloudflare Setup](#cloudflare-setup)
- [GitHub Integration](#github-integration)
- [KV Namespace Setup](#kv-namespace-setup)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Local Machine

- ✅ **Operating System**: macOS, Linux, or Windows
- ✅ **Node.js**: Version 20.13.1 or higher
  - Check: `node --version`
  - Install via: [nvm](https://github.com/nvm-sh/nvm) recommended

- ✅ **Package Manager**: pnpm 9.0+
  - Check: `pnpm --version`
  - Install: `npm install -g pnpm`

- ✅ **Git**: Version 2.0+
  - Check: `git --version`
  - Install: [git-scm.com](https://git-scm.com/)

### Verification

```bash
# Check all at once
node --version    # Should be 20.13.1+
pnpm --version    # Should be 9.0+
git --version     # Should be 2.0+
```

---

## Accounts & Access

### 1. Cloudflare Account

**Status**: ✅ Complete

**Requirements**:
- Active Cloudflare account
- Email verified
- Pages enabled (free tier sufficient)
- Workers enabled (free tier sufficient)

**Verification**:
1. Visit: https://dash.cloudflare.com
2. Should see Workers & Pages in sidebar
3. Click "Create application" to verify access

### 2. GitHub Account

**Status**: ✅ Complete

**Requirements**:
- GitHub account with repo access
- Repositories for host and remote apps:
  - Host: `joelshejar/micro-frontend-test`
  - Remote: `joelshejar/micro-frontend-test-remote`
- Push access to both repositories

**Verification**:
```bash
# Check repo access
cd /Users/joelrajeshk/Desktop/micro-frontend-test
git remote -v
# Should show your GitHub repos

cd /Users/joelrajeshk/Desktop/micro-frontend-test-remote
git remote -v
```

---

## Development Tools

### 1. Node Version Manager (nvm)

**Status**: ✅ Recommended

**Installation**:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Verify
nvm --version
```

**Usage**:

```bash
# Install Node 20.13.1
nvm install 20.13.1

# Use this version
nvm use 20.13.1

# Set as default
nvm alias default 20.13.1
```

**Auto-load** (project has `.nvmrc`):

```bash
cd /Users/joelrajeshk/Desktop/micro-frontend-test
nvm use  # Automatically uses version from .nvmrc
```

### 2. Wrangler CLI

**Status**: ✅ Complete

**Installation** (already done):

```bash
npm install -g wrangler
```

**Authentication** (already done):

```bash
wrangler login
# Opens browser for OAuth
```

**Verification**:

```bash
wrangler --version
# Should show version 3.60.0+

wrangler whoami
# Should show your Cloudflare account email
```

---

## Cloudflare Setup

### 1. Pages Projects

**Status**: ✅ Complete

Both projects are connected and deployed:

#### Host Project

- **Name**: `micro-frontend-test`
- **URL**: https://micro-frontend-test-7m9.pages.dev
- **GitHub**: joelshejar/micro-frontend-test
- **Branch**: main
- **Build**: Automatic on push

**Configuration**:
- Build command: `pnpm install && pnpm build`
- Build output: `dist`
- Root directory: (default)
- Node version: 20

**Access**:
1. Dashboard → Workers & Pages → micro-frontend-test
2. View deployments, settings, functions

#### Remote Project

- **Name**: `micro-frontend-test-remote`
- **URL**: https://micro-frontend-test-remote.pages.dev
- **GitHub**: joelshejar/micro-frontend-test-remote
- **Branch**: main
- **Build**: Automatic on push

**Configuration**:
- Build command: `pnpm install && pnpm build`
- Build output: `dist`
- Root directory: (default)
- Node version: 20

**Verification**:

```bash
# Check host is live
curl -I https://micro-frontend-test-7m9.pages.dev
# Should return 200 OK

# Check remote is live
curl -I https://micro-frontend-test-remote.pages.dev
# Should return 200 OK

# Check remoteEntry.js exists
curl -I https://micro-frontend-test-remote.pages.dev/remoteEntry.js
# Should return 200 OK with CORS headers
```

### 2. Pages Settings

**Build Settings** (for both projects):

| Setting | Value |
|---------|-------|
| Framework preset | None |
| Build command | `pnpm install && pnpm build` |
| Build output directory | `dist` |
| Root directory | (empty) |
| Environment variables | See below |

**Environment Variables**:

**Remote App**:
- `PUBLIC_URL`: `https://micro-frontend-test-remote.pages.dev/`
- `NODE_ENV`: `production`

**Host App**:
- `NODE_ENV`: `production`

**How to Set**:
1. Dashboard → Project → Settings → Environment variables
2. Click "Add variable"
3. Production/Preview: Choose environment
4. Save

---

## GitHub Integration

**Status**: ✅ Complete

### Connection Details

Both repositories are connected to Cloudflare Pages with automatic deployments.

**Webhook Verification**:
1. GitHub → Repository → Settings → Webhooks
2. Should see Cloudflare Pages webhook
3. Recent deliveries should show successful pings

**Build Triggers**:
- ✅ Push to `main` branch triggers build
- ✅ Pull request creates preview deployment
- ✅ Commits show deployment status

**Verification**:

```bash
# Make a test commit (host repo)
cd /Users/joelrajeshk/Desktop/micro-frontend-test
echo "# Test" >> README.md
git add README.md
git commit -m "Test deployment"
git push origin main

# Check deployment starts in dashboard
# Dashboard → Workers & Pages → micro-frontend-test → Deployments
```

---

## KV Namespace Setup

### 1. Create Namespace

**Status**: ✅ Complete

You've already created the `REMOTE_URLS` namespace.

**Verification**:

```bash
# List all namespaces
wrangler kv namespace list

# Should see something like:
# [
#   {
#     "id": "abc123...",
#     "title": "REMOTE_URLS"
#   },
#   {
#     "id": "xyz789...",
#     "title": "REMOTE_URLS_preview"
#   }
# ]
```

**Save these IDs** for the next steps.

### 2. Bind to Host Project

**Status**: ✅ Complete

KV namespace is already bound to the host project.

**Verification**:
1. Dashboard → Workers & Pages → micro-frontend-test
2. Settings → Functions → KV namespace bindings
3. Should see: `REMOTE_URLS` bound for Production

### 3. Bind to Remote Project

**Status**: ⏳ **Action Required**

You need to manually bind KV to the remote project.

**Steps**:
1. Go to: Dashboard → Workers & Pages → micro-frontend-test-remote
2. Navigate to: Settings → Functions → KV namespace bindings
3. Click "Add binding"
4. Configure:
   - **Variable name**: `REMOTE_URLS`
   - **KV namespace**: Select your REMOTE_URLS namespace
   - **Environment**: Production
5. Click "Save"
6. **Repeat for Preview environment** (recommended)

**Why?**
- Remote edge function needs to write to KV
- Updates `remote1_url` after each deployment
- Host reads this value to load remote

### 4. Initialize KV Data

**Status**: ⏳ **Action Required**

After binding, you need to set the initial remote URL.

**Command**:

```bash
# Replace with your actual namespace ID from step 1
NAMESPACE_ID="your_namespace_id_here"

# Set initial remote URL
wrangler kv key put --namespace-id $NAMESPACE_ID \
  "remote1_url" \
  "https://micro-frontend-test-remote.pages.dev/remoteEntry.js"

# Verify it was set
wrangler kv key get --namespace-id $NAMESPACE_ID "remote1_url"

# Should output:
# https://micro-frontend-test-remote.pages.dev/remoteEntry.js
```

**Alternative** (via Cloudflare Dashboard):
1. Dashboard → Workers & Pages → KV
2. Click on `REMOTE_URLS` namespace
3. Click "Add entry"
4. Key: `remote1_url`
5. Value: `https://micro-frontend-test-remote.pages.dev/remoteEntry.js`
6. Click "Add"

---

## Verification Steps

### Complete System Check

Run these commands to verify everything is set up correctly:

```bash
# 1. Check Node version
node --version
# Expected: v20.13.1 or higher

# 2. Check pnpm
pnpm --version
# Expected: 9.0.0 or higher

# 3. Check Wrangler
wrangler --version
# Expected: 3.60.0 or higher

# 4. Check Wrangler auth
wrangler whoami
# Expected: Your Cloudflare account email

# 5. Check KV namespace
wrangler kv namespace list
# Expected: REMOTE_URLS and REMOTE_URLS_preview

# 6. Check KV value
wrangler kv key get --namespace-id <YOUR_ID> "remote1_url"
# Expected: https://micro-frontend-test-remote.pages.dev/remoteEntry.js

# 7. Check host is live
curl -I https://micro-frontend-test-7m9.pages.dev
# Expected: HTTP/2 200

# 8. Check remote is live
curl -I https://micro-frontend-test-remote.pages.dev
# Expected: HTTP/2 200

# 9. Check remoteEntry.js
curl -I https://micro-frontend-test-remote.pages.dev/remoteEntry.js
# Expected: HTTP/2 200 with CORS headers

# 10. Test remote content
curl https://micro-frontend-test-remote.pages.dev/remoteEntry.js | head -n 5
# Expected: JavaScript code
```

### Browser Verification

1. **Visit Host App**:
   - Open: https://micro-frontend-test-7m9.pages.dev
   - Should load without errors
   - Check DevTools console for errors

2. **Check Remote Loading**:
   - Open DevTools → Network tab
   - Filter: "remoteEntry.js"
   - Refresh page
   - Should see successful fetch from micro-frontend-test-remote.pages.dev

3. **Verify Edge Function**:
   - View page source: `Ctrl+U` (Windows) or `Cmd+Option+U` (Mac)
   - Search for: `__REMOTE_URL_PLACEHOLDER__`
   - Should NOT find it (replaced by edge function)
   - Search for: `micro-frontend-test-remote.pages.dev`
   - Should find it in Module Federation config

---

## Troubleshooting

### Issue: Wrangler login fails

**Symptoms**: Browser doesn't open or auth fails

**Solutions**:

```bash
# Clear auth and retry
wrangler logout
wrangler login

# Manual auth (if browser doesn't work)
wrangler login --scopes-list
# Follow manual instructions
```

### Issue: KV namespace not showing

**Symptoms**: `wrangler kv namespace list` returns empty

**Solutions**:

1. **Check account selection**:
   ```bash
   wrangler whoami
   # Verify correct account
   ```

2. **Create namespace again**:
   ```bash
   wrangler kv namespace create "REMOTE_URLS"
   wrangler kv namespace create "REMOTE_URLS" --preview
   ```

### Issue: KV binding not working

**Symptoms**: Edge function can't access KV

**Solutions**:

1. **Verify binding in dashboard**:
   - Project → Settings → Functions → KV namespace bindings
   - Should see REMOTE_URLS bound

2. **Check environment**:
   - Production vs. Preview
   - Need separate bindings for each

3. **Redeploy after binding**:
   ```bash
   # Make empty commit to trigger redeploy
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

### Issue: Pages project not building

**Symptoms**: Build fails in Cloudflare Pages

**Solutions**:

1. **Check build logs**:
   - Dashboard → Project → Deployments → Click deployment
   - View "Build log" tab

2. **Common issues**:
   - Node version mismatch (set to 20 in settings)
   - Missing pnpm (should auto-detect)
   - Missing dependencies (check package.json)

3. **Test locally**:
   ```bash
   cd project-directory
   pnpm install
   pnpm build
   # If fails locally, fix before pushing
   ```

### Issue: Cannot find namespace ID

**Symptoms**: Need namespace ID for CLI commands

**Solution**:

```bash
# List all namespaces with IDs
wrangler kv namespace list

# Output format:
# [
#   {
#     "id": "abc123def456...",  ← This is your namespace ID
#     "title": "REMOTE_URLS"
#   }
# ]

# Copy the "id" value
```

---

## Next Steps

Once all prerequisites are complete:

1. ✅ All items in [Quick Status](#quick-status) should be checked
2. 📖 Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment process
3. 🏗️ Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
4. 🚀 Deploy your changes and test automatic updates

---

## Checklist Summary

Use this checklist to track your progress:

### Required Setup

- [x] Cloudflare account created
- [x] GitHub repositories created
- [x] Wrangler CLI installed
- [x] Wrangler authenticated
- [x] Host Pages project created
- [x] Remote Pages project created
- [x] KV namespace created
- [x] KV bound to host project
- [ ] KV bound to remote project ← **DO THIS NEXT**
- [ ] KV initialized with remote URL ← **THEN THIS**

### Verification

- [x] Both projects deployed successfully
- [x] remoteEntry.js accessible with CORS
- [ ] Host app loads remote components
- [ ] Browser console shows no errors
- [ ] Edge functions deployed and running
- [ ] KV updates on remote deployment

### Documentation

- [x] DEPLOYMENT.md created
- [x] ARCHITECTURE.md created
- [x] PREREQUISITES.md created
- [ ] Team members onboarded (if applicable)

---

**Last Updated**: 2025-11-12

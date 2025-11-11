# Deployment Guide

Complete guide for deploying the micro-frontend host and remote applications to Cloudflare Pages with automatic integration via Workers and KV storage.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Process](#deployment-process)
- [Environment Variables](#environment-variables)
- [How Automatic Updates Work](#how-automatic-updates-work)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## Overview

This micro-frontend architecture consists of:

- **Host App** (this repo): Deployed at `https://micro-frontend-test-7m9.pages.dev`
- **Remote App**: Deployed at `https://micro-frontend-test-remote.pages.dev`
- **KV Storage**: Stores the active remote URL for dynamic discovery
- **Edge Functions**: Automatically update and inject remote URLs

### Key Features

✅ **Automatic Integration**: Remote deployments automatically propagate to host
✅ **Zero Host Redeployment**: Host loads new remote versions without rebuilding
✅ **Edge Function Performance**: Sub-10ms latency for URL resolution
✅ **Cloudflare CDN**: Global distribution with optimal caching

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                   Host App (Cloudflare Pages)                   │
│                 https://micro-frontend-test-7m9.pages.dev       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Edge Function (_middleware.ts)                   │  │
│  │  1. Intercept HTML/JS requests                           │  │
│  │  2. Read remote1_url from KV                             │  │
│  │  3. Replace __REMOTE_URL_PLACEHOLDER__                   │  │
│  │  4. Return modified response                             │  │
│  └──────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Cloudflare KV     │
                    │                     │
                    │  Key: remote1_url   │
                    │  Value: https://... │
                    └─────────────────────┘
                               ▲
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                   Remote App (Cloudflare Pages)                  │
│               https://micro-frontend-test-remote.pages.dev       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Edge Function (_middleware.ts)                   │  │
│  │  1. Detect deployment                                    │  │
│  │  2. Update KV with new remoteEntry.js URL               │  │
│  │  3. Include deployment metadata                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

See [PREREQUISITES.md](./PREREQUISITES.md) for detailed setup instructions.

### Quick Checklist

- ✅ Cloudflare account with Pages enabled
- ✅ Wrangler CLI installed (`npm install -g wrangler`)
- ✅ GitHub repositories connected to Cloudflare Pages
- ✅ KV namespace `REMOTE_URLS` created
- ✅ KV namespace bound to both host and remote projects
- ✅ Node.js 20.13.1+ installed
- ✅ pnpm package manager installed

---

## Initial Setup

### 1. Create KV Namespace

```bash
# Create production namespace
wrangler kv namespace create "REMOTE_URLS"
# Note the namespace ID from output

# Create preview namespace
wrangler kv namespace create "REMOTE_URLS" --preview
# Note the preview namespace ID
```

**Save these namespace IDs** - you'll need them for binding.

### 2. Bind KV to Projects

#### For Host App (micro-frontend-test):

1. Go to: Cloudflare Dashboard → Workers & Pages → **micro-frontend-test**
2. Navigate to: Settings → Functions → KV namespace bindings
3. Click "Add binding"
   - Variable name: `REMOTE_URLS`
   - KV namespace: Select your namespace
   - Environment: Production
4. Click "Save"
5. Repeat for Preview environment

#### For Remote App (micro-frontend-test-remote):

1. Go to: Cloudflare Dashboard → Workers & Pages → **micro-frontend-test-remote**
2. Navigate to: Settings → Functions → KV namespace bindings
3. Click "Add binding"
   - Variable name: `REMOTE_URLS`
   - KV namespace: Select the same namespace
   - Environment: Production
4. Click "Save"
5. Repeat for Preview environment

### 3. Initialize KV with Remote URL

After binding, initialize the KV store with the remote URL:

```bash
# Get your namespace ID from step 1
NAMESPACE_ID="your_namespace_id_here"

# Set the initial remote URL
wrangler kv key put --namespace-id $NAMESPACE_ID \
  "remote1_url" \
  "https://micro-frontend-test-remote.pages.dev/remoteEntry.js"

# Verify it was set
wrangler kv key get --namespace-id $NAMESPACE_ID "remote1_url"
```

---

## Deployment Process

### Remote App Deployment

1. **Make changes** to the remote app code
2. **Commit and push** to GitHub:
   ```bash
   cd /path/to/micro-frontend-test-remote
   git add .
   git commit -m "Update remote feature"
   git push origin main
   ```
3. **Automatic deployment**:
   - Cloudflare Pages detects the push
   - Builds the app with `pnpm build`
   - Deploys to `micro-frontend-test-remote.pages.dev`
   - Edge function automatically updates KV with new URL
4. **Verification**:
   ```bash
   # Check KV was updated
   wrangler kv key get --namespace-id $NAMESPACE_ID "remote1_url"

   # Check the remote is accessible
   curl https://micro-frontend-test-remote.pages.dev/remoteEntry.js
   ```

### Host App Deployment

1. **Make changes** to the host app code
2. **Commit and push** to GitHub:
   ```bash
   cd /path/to/micro-frontend-test
   git add .
   git commit -m "Update host feature"
   git push origin main
   ```
3. **Automatic deployment**:
   - Cloudflare Pages detects the push
   - Builds the app with `pnpm build`
   - Deploys to `micro-frontend-test-7m9.pages.dev`
   - Edge function reads from KV and injects remote URL
4. **Verification**:
   ```bash
   # Visit the host app
   open https://micro-frontend-test-7m9.pages.dev

   # Check browser console for successful remote loading
   ```

### Manual Deployment (Alternative)

If needed, deploy manually using Wrangler:

```bash
# Build the app
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=micro-frontend-test
# or
wrangler pages deploy dist --project-name=micro-frontend-test-remote
```

---

## Environment Variables

### Remote App

Configure in Cloudflare Pages dashboard under Settings → Environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `PUBLIC_URL` | `https://micro-frontend-test-remote.pages.dev/` | Base URL for asset loading |
| `NODE_ENV` | `production` | Environment mode |

### Host App

Configure in Cloudflare Pages dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode (triggers placeholder URL) |

### KV Bindings

Both apps need KV binding (configured via dashboard, not env vars):

- **Variable name**: `REMOTE_URLS`
- **KV namespace**: Your namespace ID
- **Access**: Read/Write

---

## How Automatic Updates Work

### Step-by-Step Flow

1. **Developer pushes to remote repo**
   ```bash
   git push origin main
   ```

2. **Cloudflare Pages builds and deploys**
   - Runs `pnpm install && pnpm build`
   - Deploys to production
   - Assigns deployment URL: `https://micro-frontend-test-remote.pages.dev`

3. **Remote edge function executes**
   - Runs on first request after deployment
   - Reads current deployment URL
   - Updates KV: `remote1_url = https://micro-frontend-test-remote.pages.dev/remoteEntry.js`
   - Includes metadata: timestamp, deployment ID

4. **User visits host app**
   - Request hits host at `https://micro-frontend-test-7m9.pages.dev`
   - Host edge function intercepts request

5. **Host edge function injects URL**
   - Reads `remote1_url` from KV (cached 5 mins)
   - Finds `__REMOTE_URL_PLACEHOLDER__` in JS bundle
   - Replaces with actual URL from KV
   - Returns modified response to browser

6. **Browser loads remote**
   - Module Federation receives actual remote URL
   - Lazy loads remote components
   - Renders remote app seamlessly

### Timeline

- **Remote deployment**: ~2-3 minutes
- **KV update**: <1 second (automatic)
- **Host picks up change**: Immediately on next page load
- **No host redeployment**: ✅ Zero downtime

---

## Troubleshooting

### Remote Not Loading

**Symptom**: Host app shows "Loading..." indefinitely

**Solutions**:

1. **Check KV value**:
   ```bash
   wrangler kv key get --namespace-id $NAMESPACE_ID "remote1_url"
   ```
   Should return the remote URL.

2. **Verify remote is accessible**:
   ```bash
   curl -I https://micro-frontend-test-remote.pages.dev/remoteEntry.js
   ```
   Should return `200 OK` with CORS headers.

3. **Check browser console**:
   - Open DevTools → Console
   - Look for Module Federation errors
   - Check Network tab for failed requests

4. **Verify KV binding**:
   - Dashboard → Project → Settings → Functions → KV namespace bindings
   - Ensure `REMOTE_URLS` is bound to production

### CORS Errors

**Symptom**: Browser console shows CORS errors

**Solutions**:

1. **Check remote _headers file** exists:
   ```bash
   cat /path/to/micro-frontend-test-remote/_headers
   ```

2. **Verify CORS headers** in response:
   ```bash
   curl -I https://micro-frontend-test-remote.pages.dev/remoteEntry.js
   ```
   Should include:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, OPTIONS
   ```

3. **Redeploy remote** if headers are missing:
   ```bash
   cd micro-frontend-test-remote
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

### Edge Function Not Running

**Symptom**: Placeholder not being replaced

**Solutions**:

1. **Check edge function exists**:
   ```bash
   ls /path/to/micro-frontend-test/functions/_middleware.ts
   ```

2. **View deployment logs**:
   - Dashboard → Project → Deployments → View details
   - Check "Functions" tab for logs

3. **Verify function is deployed**:
   - Should see `_middleware.ts` in deployment artifacts

4. **Test with curl**:
   ```bash
   curl https://micro-frontend-test-7m9.pages.dev/ | grep "__REMOTE_URL_PLACEHOLDER__"
   ```
   Should return empty (placeholder should be replaced).

### Worker Error 1101

**Symptom**: Site shows "Error 1101: Worker threw exception"

**Root Cause**: Edge function has a runtime error, typically from:
- Immutable headers being passed to `new Response()`
- Content-type detection failing
- Missing error handling in middleware

**Solutions**:

1. **Check edge function code** in `functions/_middleware.ts`:
   - Ensure headers are cloned: `new Headers(response.headers)`
   - Content-type check should be comprehensive
   - All code paths return a valid Response

2. **View Functions logs**:
   - Dashboard → Project → Deployments → [Latest] → Functions tab
   - Look for JavaScript errors or stack traces

3. **Test locally with Wrangler**:
   ```bash
   pnpm build
   wrangler pages dev dist --kv REMOTE_URLS
   ```

4. **Verify the fix**:
   ```typescript
   // ✅ Correct approach
   const newHeaders = new Headers(response.headers);
   return new Response(body, {
     status: response.status,
     statusText: response.statusText,
     headers: newHeaders,  // Use cloned headers
   });
   ```

5. **Redeploy after fixing**:
   ```bash
   git add functions/_middleware.ts
   git commit -m "Fix edge function Worker error"
   git push origin main
   ```

**Related**: See [TROUBLESHOOTING.md - Issue 5](./TROUBLESHOOTING.md#issue-5-worker-error-1101-on-cloudflare-pages-deployment) for detailed fix.

### KV Not Updating

**Symptom**: Old remote version keeps loading

**Solutions**:

1. **Manually update KV**:
   ```bash
   wrangler kv key put --namespace-id $NAMESPACE_ID \
     "remote1_url" \
     "https://micro-frontend-test-remote.pages.dev/remoteEntry.js"
   ```

2. **Check remote edge function**:
   - Verify `functions/_middleware.ts` exists in remote repo
   - Check deployment logs for errors

3. **Clear KV and retry**:
   ```bash
   wrangler kv key delete --namespace-id $NAMESPACE_ID "remote1_url"
   # Then visit remote app to trigger update
   curl https://micro-frontend-test-remote.pages.dev/
   # Verify KV was set
   wrangler kv key get --namespace-id $NAMESPACE_ID "remote1_url"
   ```

### Local Development Not Working

**Symptom**: Remote not loading locally

**Solutions**:

1. **Ensure remote is running**:
   ```bash
   cd micro-frontend-test-remote
   pnpm dev
   # Should start on port 3001
   ```

2. **Verify localhost URL**:
   ```bash
   curl http://localhost:3001/remoteEntry.js
   ```
   Should return JavaScript content.

3. **Check NODE_ENV**:
   - In development, host uses `http://localhost:3001/remoteEntry.js`
   - Verify `rspack.config.ts` has `isDev` check

4. **Clear build cache**:
   ```bash
   rm -rf dist node_modules/.cache
   pnpm install
   pnpm dev
   ```

---

## Rollback Procedures

### Rollback Remote App

#### Option 1: Via Cloudflare Dashboard

1. Go to: Dashboard → Workers & Pages → micro-frontend-test-remote
2. Click "Deployments" tab
3. Find previous successful deployment
4. Click "..." menu → "Rollback to this deployment"
5. Confirm rollback

#### Option 2: Via Git

```bash
cd micro-frontend-test-remote

# Find the commit to rollback to
git log --oneline

# Create a revert commit
git revert <commit-hash>
git push origin main

# Or reset to previous commit (destructive)
git reset --hard <commit-hash>
git push origin main --force
```

#### Option 3: Manual KV Update

```bash
# Point KV to a specific deployment
wrangler kv key put --namespace-id $NAMESPACE_ID \
  "remote1_url" \
  "https://8efb197b.micro-frontend-test-remote.pages.dev/remoteEntry.js"
```

Use the deployment-specific URL from a previous deployment.

### Rollback Host App

#### Via Cloudflare Dashboard

1. Go to: Dashboard → Workers & Pages → micro-frontend-test
2. Click "Deployments" tab
3. Find previous successful deployment
4. Click "..." menu → "Rollback to this deployment"
5. Confirm rollback

#### Via Git

```bash
cd micro-frontend-test

git log --oneline
git revert <commit-hash>
git push origin main
```

---

## Monitoring & Logs

### View Deployment Logs

**Cloudflare Dashboard**:
1. Dashboard → Workers & Pages → Project
2. Click "Deployments"
3. Click on a deployment
4. View "Build log" and "Functions" tabs

**Real-time Logs** (requires Logpush or Tail Workers):
```bash
wrangler pages deployment tail --project-name=micro-frontend-test
```

### Check KV Activity

```bash
# List all keys
wrangler kv key list --namespace-id $NAMESPACE_ID

# Get key with metadata
wrangler kv key get --namespace-id $NAMESPACE_ID "remote1_url" --preview=false

# View key metadata (if stored)
wrangler kv key get --namespace-id $NAMESPACE_ID "remote1_url" --preview=false --text=false
```

### Performance Monitoring

Monitor via Cloudflare Analytics:
- Dashboard → Workers & Pages → Project → Analytics
- View requests, response times, errors
- Check edge function execution time

---

## Production Checklist

Before going live, verify:

- [ ] KV namespace created and bound to both projects
- [ ] Initial KV value set for `remote1_url`
- [ ] Both apps deployed successfully
- [ ] Remote app CORS headers configured (`_headers` file)
- [ ] Edge functions deployed (check deployment artifacts)
- [ ] Remote components load successfully in host
- [ ] Browser console shows no errors
- [ ] Test automatic update flow (deploy remote → verify host updates)
- [ ] Custom domains configured (if applicable)
- [ ] SSL/TLS certificates active
- [ ] Analytics and monitoring set up

---

## Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details
- [PREREQUISITES.md](./PREREQUISITES.md) - Detailed setup requirements
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [Module Federation Docs](https://module-federation.io/)
- [Rspack Docs](https://rspack.dev/)

---

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section above
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Check remote app's [TROUBLESHOOTING.md](../micro-frontend-test-remote/TROUBLESHOOTING.md)

---

**Last Updated**: 2025-11-12

# Module Federation Integration Guide

This guide walks you through integrating remote micro-frontend applications with the host application using Module Federation and Rspack.

## Table of Contents
- [Overview](#overview)
- [Current Setup](#current-setup)
- [Step-by-Step Integration](#step-by-step-integration)
- [Testing the Integration](#testing-the-integration)
- [Troubleshooting](#troubleshooting)
- [Adding More Remote Apps](#adding-more-remote-apps)

---

## Overview

Module Federation allows you to:
- Load remote components dynamically at runtime
- Share dependencies between host and remote apps
- Build independent micro-frontends that work together seamlessly

### Architecture

```
┌─────────────────────────────────────┐
│        Host Application             │
│        (Port 3000)                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Lazy loads remote components│  │
│  └──────────────────────────────┘  │
│              │                      │
│              │ HTTP Request         │
│              ▼                      │
│  ┌──────────────────────────────┐  │
│  │  remoteEntry.js              │  │
│  │  from Remote Apps            │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
                 │
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────┐              ┌─────────┐
│ Remote1 │              │ Remote2 │
│ :3001   │              │ :3002   │
└─────────┘              └─────────┘
```

---

## Current Setup

### Remote Application (remote1)

**Location**: `/Users/joelrajeshk/Desktop/micro-frontend-test-remote`

**Configuration** (`rspack.config.ts`):
```typescript
new rspack.container.ModuleFederationPlugin({
  name: 'remote1',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App.tsx',
    './Button': './src/components/Button.tsx',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.3.1' },
    'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
  },
})
```

**Port**: 3001
**Exposed Components**:
- `./App` - Main application component
- `./Button` - Button component

### Host Application

**Location**: `/Users/joelrajeshk/Desktop/micro-frontend-test`

**Configuration** (`rspack.config.ts:70`):
```typescript
new rspack.container.ModuleFederationPlugin({
  name: 'host',
  remotes: {
    remote1: 'remote1@http://localhost:3001/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.3.1' },
    'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
  },
})
```

**Port**: 3000

---

## Step-by-Step Integration

### Step 1: Configure Module Federation in Host

Update `rspack.config.ts` to add the remote application:

```typescript
new rspack.container.ModuleFederationPlugin({
  name: 'host',
  remotes: {
    // Add your remote apps here
    remote1: 'remote1@http://localhost:3001/remoteEntry.js',
  },
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^18.3.1',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^18.3.1',
    },
  },
})
```

**Key Points**:
- `name`: Identifier for the host application
- `remotes`: Object mapping remote names to their entry points
- `shared`: Dependencies shared between host and remotes (prevents duplicate loading)
- `singleton: true`: Ensures only one instance of React is loaded

**File**: `rspack.config.ts:67-82`

---

### Step 2: Create TypeScript Type Definitions

The type definitions are already configured in `src/types/remotes.d.ts:6-9`:

```typescript
declare module 'remote1/*' {
  const Component: React.ComponentType<any>;
  export default Component;
}
```

This tells TypeScript that:
- Any import from `remote1/*` is a valid React component
- Prevents type errors when importing remote components

For better type safety, you can create more specific type definitions:

```typescript
// More specific types (optional)
declare module 'remote1/App' {
  const App: React.ComponentType;
  export default App;
}

declare module 'remote1/Button' {
  interface ButtonProps {
    onClick?: () => void;
    children?: React.ReactNode;
  }
  const Button: React.ComponentType<ButtonProps>;
  export default Button;
}
```

---

### Step 3: Import and Use Remote Components

In your React components, use lazy loading with Suspense:

**File**: `src/App.tsx:4-5, 39-52`

```typescript
import React, { Suspense, lazy } from 'react';

// Lazy load remote components
const RemoteApp = lazy(() => import('remote1/App'));
const RemoteButton = lazy(() => import('remote1/Button'));

function App() {
  return (
    <div>
      {/* Remote Button Component */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold">Remote Button from Remote1</h3>
        <Suspense fallback={<div>Loading remote button...</div>}>
          <RemoteButton />
        </Suspense>
      </div>

      {/* Remote App Component */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Remote Application</h3>
        <Suspense fallback={<div>Loading remote app...</div>}>
          <RemoteApp />
        </Suspense>
      </div>
    </div>
  );
}
```

**Key Points**:
- `lazy()`: Dynamically imports the component at runtime
- `Suspense`: Shows a fallback while the remote component loads
- Import path format: `'remoteName/exposedPath'`

---

### Step 4: Start Both Applications

**Terminal 1 - Start Remote App**:
```bash
cd /Users/joelrajeshk/Desktop/micro-frontend-test-remote
pnpm dev
```

Expected output:
```
<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: http://localhost:3001/
Rspack compiled successfully
```

**Terminal 2 - Start Host App**:
```bash
cd /Users/joelrajeshk/Desktop/micro-frontend-test
pnpm dev
```

Expected output:
```
<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: http://localhost:3000/
Rspack compiled successfully
```

**IMPORTANT**: The remote app MUST be running before you access the host app, otherwise you'll get a network error when trying to load remote components.

---

## Testing the Integration

### 1. Verify Remote App is Running

Open your browser to http://localhost:3001/

You should see:
- The remote application running independently
- Remote components rendered correctly

### 2. Verify Host App Integration

Open your browser to http://localhost:3000/

You should see:
- The host application header
- "Remote Button from Remote1" section with the button component
- "Remote Application (Remote1)" section with the full app

### 3. Check Browser DevTools

Open browser DevTools (F12) and check:

**Network Tab**:
- Look for `remoteEntry.js` being loaded from `http://localhost:3001`
- Verify no 404 errors for remote resources

**Console Tab**:
- No errors about missing modules
- No CORS errors
- No React duplicate warnings

### 4. Test Hot Module Replacement

While both apps are running:

1. Edit a file in the remote app (e.g., `micro-frontend-test-remote/src/App.tsx`)
2. Save the file
3. Refresh the host app at http://localhost:3000
4. Changes should appear in the remote component section

---

## Troubleshooting

### Issue 1: "Failed to fetch dynamically imported module"

**Error Message**:
```
Failed to fetch dynamically imported module: http://localhost:3001/remoteEntry.js
```

**Causes**:
1. Remote app is not running
2. Remote app is running on a different port
3. Network/CORS issues

**Solutions**:
```bash
# 1. Check if remote app is running
lsof -i:3001

# 2. Start the remote app if not running
cd /Users/joelrajeshk/Desktop/micro-frontend-test-remote
pnpm dev

# 3. Verify the remote URL in host's rspack.config.ts
# Should match: remote1@http://localhost:3001/remoteEntry.js
```

---

### Issue 2: CORS Errors

**Error Message**:
```
Access to fetch at 'http://localhost:3001/remoteEntry.js' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Solution**:
The remote app should have CORS headers configured in `rspack.config.ts`:

```typescript
devServer: {
  port: 3001,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
  },
}
```

This is already configured in `micro-frontend-test-remote/rspack.config.ts:82-86`.

---

### Issue 3: React Version Mismatch

**Error Message**:
```
Warning: Invalid hook call. Hooks can only be called inside the body of a function component.
```

**Cause**: Multiple versions of React being loaded

**Solution**:
Ensure both apps use the same React version and singleton configuration:

**Host `package.json`**:
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

**Remote `package.json`**:
```json
{
  "dependencies": {
    "react": "18.3.1",      // Exact version match
    "react-dom": "18.3.1"
  }
}
```

**Both `rspack.config.ts`**:
```typescript
shared: {
  react: { singleton: true, requiredVersion: '^18.3.1' },
  'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
}
```

---

### Issue 4: Module Not Found

**Error Message**:
```
Module not found: remote1/Button
```

**Solutions**:

1. **Check exposed modules** in remote app's `rspack.config.ts`:
```typescript
exposes: {
  './App': './src/App.tsx',
  './Button': './src/components/Button.tsx',  // Must exist
}
```

2. **Verify import path** in host app matches exposed name:
```typescript
// Correct
import('remote1/Button')

// Incorrect
import('remote1/button')  // Case sensitive!
import('remote1/components/Button')  // Wrong path
```

3. **Rebuild both applications**:
```bash
# Kill both dev servers and restart
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Restart remote first
cd micro-frontend-test-remote && pnpm dev

# Then host
cd micro-frontend-test && pnpm dev
```

---

## Adding More Remote Apps

### Example: Adding a second remote app

**Step 1**: Update host `rspack.config.ts`:
```typescript
remotes: {
  remote1: 'remote1@http://localhost:3001/remoteEntry.js',
  remote2: 'remote2@http://localhost:3002/remoteEntry.js',  // Add new remote
}
```

**Step 2**: Add type definitions in `src/types/remotes.d.ts`:
```typescript
declare module 'remote2/*' {
  const Component: React.ComponentType<any>;
  export default Component;
}
```

**Step 3**: Use in your components:
```typescript
const Remote2Component = lazy(() => import('remote2/SomeComponent'));

<Suspense fallback={<div>Loading...</div>}>
  <Remote2Component />
</Suspense>
```

**Step 4**: Start all applications:
```bash
# Terminal 1: Remote 1
cd micro-frontend-test-remote && pnpm dev

# Terminal 2: Remote 2
cd micro-frontend-test-remote-2 && pnpm dev

# Terminal 3: Host
cd micro-frontend-test && pnpm dev
```

---

## Best Practices

### 1. Version Management
- Keep React versions synchronized across all apps
- Use `singleton: true` for shared dependencies
- Document version requirements

### 2. Error Handling
Always wrap remote components with error boundaries:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function RemoteComponentWrapper() {
  return (
    <ErrorBoundary fallback={<div>Failed to load remote component</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <RemoteComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 3. Loading States
Provide meaningful loading indicators:

```typescript
<Suspense fallback={
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <span className="ml-2">Loading remote application...</span>
  </div>
}>
  <RemoteApp />
</Suspense>
```

### 4. Development Workflow
- Always start remote apps before the host
- Use different terminal windows for each app
- Monitor console for errors in both apps
- Test both standalone and integrated modes

### 5. TypeScript Integration
For better type safety:
- Define proper interfaces for remote component props
- Use branded types for remote modules
- Consider generating types from remote apps

---

## Quick Reference

### Start All Apps
```bash
# Remote app (Terminal 1)
cd /Users/joelrajeshk/Desktop/micro-frontend-test-remote && pnpm dev

# Host app (Terminal 2)
cd /Users/joelrajeshk/Desktop/micro-frontend-test && pnpm dev
```

### Access Applications
- **Host**: http://localhost:3000
- **Remote1**: http://localhost:3001

### Key Files
- **Host Config**: `micro-frontend-test/rspack.config.ts:67-82`
- **Host App**: `micro-frontend-test/src/App.tsx:4-5, 39-52`
- **Remote Config**: `micro-frontend-test-remote/rspack.config.ts:60-77`
- **Type Definitions**: `micro-frontend-test/src/types/remotes.d.ts:6-9`

### Common Commands
```bash
# Kill all dev servers
lsof -ti:3000,3001 | xargs kill -9

# Restart everything
cd micro-frontend-test-remote && pnpm dev &
cd micro-frontend-test && pnpm dev
```

---

## Additional Resources

- [Rspack Module Federation Documentation](https://rspack.dev/plugins/webpack/module-federation-plugin)
- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)

---

**Last Updated**: November 2, 2025

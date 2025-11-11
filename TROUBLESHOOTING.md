# Troubleshooting Guide

This document outlines the issues encountered during the initial setup of the micro-frontend project and their solutions.

## Table of Contents
- [Issue 1: Path Resolution Error](#issue-1-path-resolution-error)
- [Issue 2: CSS Parser Registration Error](#issue-2-css-parser-registration-error)
- [Issue 3: TypeScript Type Errors in IDE](#issue-3-typescript-type-errors-in-ide)
- [Issue 4: Remote App Styles Not Loading in Host](#issue-4-remote-app-styles-not-loading-in-host)
- [Issue 5: Worker Error 1101 on Cloudflare Pages Deployment](#issue-5-worker-error-1101-on-cloudflare-pages-deployment)
- [Final Working Configuration](#final-working-configuration)

---

## Issue 1: Path Resolution Error

### Problem Description
When running `pnpm dev`, the following error occurred:

```
Error: ./dist is neither a posix nor a windows path, and there is no 'dirname' method defined in the file system
    at /Users/.../node_modules/@rspack/core/dist/index.js:6525:31
```

### Root Cause
The `output.path` configuration in `rspack.config.ts` was set to a relative path string `'./dist'`:

```typescript
output: {
  path: './dist',  // ❌ Incorrect - relative path
  // ...
}
```

Rspack expects an absolute path for the output directory, but was receiving a relative path string that it couldn't properly resolve.

### Solution
Convert the relative path to an absolute path using Node.js's `path.resolve()` method:

1. Import the `path` module at the top of `rspack.config.ts`:
```typescript
import path from 'path';
```

2. Update the `output.path` configuration:
```typescript
output: {
  path: path.resolve(__dirname, 'dist'),  // ✅ Correct - absolute path
  // ...
}
```

3. Also updated the alias path for consistency:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),  // ✅ Absolute path
  },
}
```

**File**: `rspack.config.ts:4, 13, 22`

---

## Issue 2: CSS Parser Registration Error

### Problem Description
After fixing the path issue, a new error appeared:

```
ERROR in ./src/index.tsx 5:0-21
  × No parser registered for 'css'
```

This occurred when importing CSS files in the TypeScript/React code:
```typescript
import './index.css';  // Line 4 in src/index.tsx
```

### Root Cause
Rspack's CSS support is an experimental feature that needs to be explicitly enabled. By default, the CSS parser is not registered, even if you configure CSS rules in the module configuration.

### Attempted Solutions (that didn't work)

#### Attempt 1: Using `type: 'css/auto'`
```typescript
{
  test: /\.css$/,
  use: ['postcss-loader'],
  type: 'css/auto',  // ❌ Error: No parser registered for 'css/auto'
}
```

#### Attempt 2: Inline PostCSS configuration
```typescript
{
  test: /\.css$/,
  use: [
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: {
            tailwindcss: {},
            autoprefixer: {},
          },
        },
      },
    },
  ],
  type: 'css',  // ❌ Still no parser registered
}
```

### Final Solution
Enable Rspack's experimental CSS support by adding the `experiments` configuration:

```typescript
export default defineConfig({
  // ...
  experiments: {
    css: true,  // ✅ Enable experimental CSS support
  },
  // ...
  module: {
    rules: [
      {
        test: /\.css$/,
        type: 'css',  // ✅ Now works with experiments.css enabled
      },
    ],
  },
});
```

**File**: `rspack.config.ts:19-21, 50-52`

### Why This Works
- The `experiments.css: true` flag enables Rspack's native CSS parser
- Once enabled, the simple `type: 'css'` configuration is sufficient
- PostCSS configuration is read from the external `postcss.config.js` file automatically

---

## Final Working Configuration

### rspack.config.ts (Key Sections)
```typescript
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import RefreshPlugin from '@rspack/plugin-react-refresh';
import path from 'path';  // ✅ Required for path resolution

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  entry: {
    main: './src/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),  // ✅ Absolute path
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: 'auto',
    uniqueName: 'host',
  },
  experiments: {
    css: true,  // ✅ Enable CSS parser
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),  // ✅ Absolute path
    },
  },
  module: {
    rules: [
      // TypeScript/React configuration
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      // CSS configuration
      {
        test: /\.css$/,
        type: 'css',  // ✅ Simple configuration with experiments.css
      },
      // Asset configuration
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
      title: 'Micro-Frontend Host',
    }),
    new rspack.container.ModuleFederationPlugin({
      name: 'host',
      remotes: {},
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
    }),
    isDev && new RefreshPlugin(),
  ].filter(Boolean),
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
});
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Verification

After applying all fixes, the dev server should start successfully:

```bash
pnpm dev
```

Expected output:
```
<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: http://localhost:3000/
<i> [webpack-dev-server] On Your Network (IPv4): http://192.168.1.37:3000/

Rspack compiled successfully in 101 ms
```

---

## Issue 3: TypeScript Type Errors in IDE

### Problem Description
IDE (VSCode, WebStorm, etc.) shows TypeScript errors like:

```
Property 'div' does not exist on type 'JSX.IntrinsicElements'
Cannot find module 'react' or its corresponding type declarations
```

However, `pnpm type-check` runs successfully without errors.

### Root Cause
This is typically an IDE configuration issue where:
1. The IDE is not using the workspace TypeScript version
2. React types are not being loaded by the IDE
3. The tsconfig doesn't explicitly specify which types to load

### Solution

**1. Update `tsconfig.json` to explicitly reference React types:**

```typescript
{
  "compilerOptions": {
    // ... other options

    /* Type definitions */
    "types": ["@types/react", "@types/react-dom"]
  },
  "include": ["src/**/*", "src/types/**/*.d.ts"]
}
```

**File**: `tsconfig.json:30, 32`

**2. Create `.vscode/settings.json` to configure IDE:**

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**File**: `.vscode/settings.json`

**3. Remove unused React imports (React 18 with jsx: "react-jsx"):**

Before:
```typescript
import React, { Suspense, lazy } from 'react';  // ❌ React not used
```

After:
```typescript
import { Suspense, lazy } from 'react';  // ✅ Only import what's needed
```

**File**: `src/App.tsx:1`

**Note**: You still need `import React from 'react'` in files that use `React.StrictMode` or other React APIs directly.

**4. Restart your IDE:**
- VSCode: Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Developer: Reload Window"
- Press Enter

**5. Verify the fix:**
```bash
# Run type checking
pnpm type-check

# Expected output:
# ✓ No errors
```

### Why This Works
- Explicitly listing types in `tsconfig.json` ensures the TypeScript compiler loads React type definitions
- VSCode settings ensure the IDE uses the workspace TypeScript version
- More explicit `include` paths ensure all TypeScript files are processed
- Removing unused imports eliminates linter warnings

---

## Issue 4: Remote App Styles Not Loading in Host

### Problem Description
When loading a remote micro-frontend via Module Federation:
- Styles (Tailwind CSS, custom CSS) work correctly when accessing the remote app directly at `http://localhost:3001`
- However, none of the styles are applied when the remote components are loaded in the host app at `http://localhost:3000`
- The components render correctly but appear unstyled

### Root Cause
CSS files are only imported in the remote app's entry point (`src/index.tsx`), but Module Federation exposes individual components (`./App`, `./Button`), not the entire entry point.

**What happens:**
```typescript
// remote1/src/index.tsx
import './index.css';  // ✅ Loaded when running standalone
import App from './App';

// remote1/src/App.tsx
// ❌ No CSS import here
function App() { ... }
```

When Module Federation exposes `./App`, it bundles only that component and its direct imports. The CSS import in `index.tsx` is **not included** in the federated module.

**In the remote's rspack.config.ts:**
```typescript
exposes: {
  './App': './src/App.tsx',      // Only bundles App.tsx and its imports
  './Button': './src/components/Button.tsx',  // Only bundles Button.tsx
}
```

### Solution
Import the CSS file directly in the exposed component so it's bundled with the federated module:

```typescript
// remote1/src/App.tsx
import Button from './components/Button';
import './index.css';  // ✅ Add this line

function App() {
  // ... component code
}
```

**File**: `remote1/src/App.tsx:2`

### Why This Works
- Each exposed component in Module Federation is treated as a separate entry point
- Dependencies are resolved from the exposed file, not from the application's main entry
- By importing CSS in the exposed component, it becomes part of that component's dependency graph
- When the host loads `remote1/App`, the CSS is now included in the bundle

### Alternative Approaches

#### Option 1: Create a CSS-only exposed module
```typescript
// remote1/rspack.config.ts
exposes: {
  './App': './src/App.tsx',
  './styles': './src/index.css',  // Expose styles separately
}
```

Then import in the host:
```typescript
// host/src/App.tsx
import 'remote1/styles';  // Load styles once
const RemoteApp = lazy(() => import('remote1/App'));
```

#### Option 2: Import CSS in both entry and exposed component
Keep the import in `index.tsx` (for standalone) and add it to exposed components (for federation). This is safe as bundlers will deduplicate the CSS.

### Verification Steps
1. Add the CSS import to the exposed component(s)
2. Restart the remote dev server (`pnpm dev` in remote app directory)
3. Reload the host application at `http://localhost:3000`
4. Verify that Tailwind classes and custom styles are now applied

### Important Notes
- This applies to **any** asset (CSS, fonts, images) that needs to be loaded with remote components
- Each exposed component should import its required styles
- Shared styles across multiple exposed components should be imported in a common parent or separately exposed
- The same principle applies in production builds, not just development

---

## Issue 5: Worker Error 1101 on Cloudflare Pages Deployment

### Problem Description

After deploying to Cloudflare Pages, visiting the site shows:

```
Error 1101
Worker threw exception
You've requested a page on a website (micro-frontend-test-7m9.pages.dev)
that is on the Cloudflare network. An unknown error occurred while
rendering the page.
```

Additionally, before the edge function code was added, the host app would render content briefly and then disappear.

### Root Cause

The issue is caused by the edge function (`functions/_middleware.ts`) having problems with:

1. **Immutable Headers**: Cloudflare Response headers are immutable and can't be passed directly to `new Response()`
2. **Content-Type Detection**: The original check for `text` content was too strict and didn't catch all JavaScript files
3. **Missing Error Handling**: If the response processing fails, no fallback is provided

### Solution

Update the edge function with proper header handling and content-type detection:

**File**: `functions/_middleware.ts:37-50`

```typescript
// ❌ BEFORE (causes Error 1101)
const response = await next();

if (!response.ok || !response.headers.get('content-type')?.includes('text')) {
  return response;
}

// ... later ...
return new Response(body, {
  status: response.status,
  statusText: response.statusText,
  headers: response.headers,  // ❌ Immutable headers cause error
});
```

```typescript
// ✅ AFTER (fixed)
const response = await next();

// Only process successful responses
if (!response.ok) {
  return response;
}

// Check content type - must be text-based
const contentType = response.headers.get('content-type') || '';
const isTextContent = contentType.includes('text') ||
                      contentType.includes('javascript') ||
                      contentType.includes('html');

if (!isTextContent) {
  return response;
}

// ... later ...

// Create a new headers object (immutable headers can cause issues)
const newHeaders = new Headers(response.headers);

return new Response(body, {
  status: response.status,
  statusText: response.statusText,
  headers: newHeaders,  // ✅ Use new Headers object
});
```

### Key Changes

1. **Split Condition Checks**: Separated `!response.ok` check from content-type check for better error handling
2. **Enhanced Content-Type Detection**: Now checks for `text`, `javascript`, and `html` explicitly
3. **New Headers Object**: Create a new mutable `Headers` object from the immutable response headers
4. **Better Fallbacks**: Each error path returns a valid response

### Verification Steps

After deploying the fix:

1. **Check Deployment Logs**:
   ```bash
   # In Cloudflare Dashboard:
   # Workers & Pages → micro-frontend-test → Deployments → [Latest] → Functions tab
   ```

2. **Test the Site**:
   - Visit: https://micro-frontend-test-7m9.pages.dev
   - Should load without Error 1101
   - Check browser DevTools console for edge function logs

3. **Verify URL Injection**:
   - View page source
   - Search for `__REMOTE_URL_PLACEHOLDER__`
   - Should NOT find it (replaced by edge function)
   - Search for `micro-frontend-test-remote.pages.dev`
   - Should find it in the Module Federation config

4. **Check Edge Function Logs** (if enabled):
   ```bash
   wrangler pages deployment tail --project-name=micro-frontend-test
   ```

### Related Issues

#### Content Disappears After Initial Render

**Symptom**: When visiting the host app, content briefly appears on screen and then disappears, leaving only an empty `<div id="root">`.

**Why This Happens**:

1. **React Mounts**: React successfully initializes and renders the host app
2. **Module Federation Initializes**: The Module Federation runtime tries to load the remote
3. **Invalid URL**: Reads `__REMOTE_URL_PLACEHOLDER__` as the remote entry URL (because edge function isn't running or has an error)
4. **Silent Failure**: Module Federation attempts to fetch from this invalid URL and fails
5. **React Unmounts**: The lazy-loaded remote components throw errors, causing React to unmount
6. **Empty Page**: User sees only the empty root div

**Root Cause**: The edge function either:
- Has a runtime error (Error 1101) preventing it from running
- Isn't deployed properly (missing `functions/_middleware.ts`)
- Has a bug that prevents placeholder replacement

**The Fix Flow**:

```
❌ BEFORE FIX:
User visits → HTML loaded with placeholder → React mounts →
Module Federation reads __REMOTE_URL_PLACEHOLDER__ → Invalid URL →
Fetch fails → React error → Components unmount → Empty page

✅ AFTER FIX:
User visits → Edge function intercepts → Reads KV →
Replaces placeholder with real URL → HTML served with valid URL →
React mounts → Module Federation reads valid URL →
Remote loads successfully → App works! ✅
```

**Key Point**: The edge function runs **before** the browser ever sees the HTML. By the time React initializes, the placeholder is already replaced with a valid URL, so Module Federation never sees the invalid placeholder.

#### Empty `<div id="root">`

**Symptom**: Page source shows `<div id="root"></div>` with no children.

**Cause**: Same as above - React fails to mount due to Module Federation errors from invalid remote URL.

#### CORS Errors

**Symptom**: Remote URL is correctly injected but still fails to load with CORS errors.

**Cause**: Remote app's `_headers` file is missing or not deployed.

**Solution**: Check remote app's `_headers` file has proper CORS configuration:
```
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
```

### Prevention

To avoid this issue in future:

1. **Test Edge Functions Locally**: Use Wrangler's local dev mode
   ```bash
   wrangler pages dev dist --kv REMOTE_URLS
   ```

2. **Always Clone Headers**: When modifying responses, create new Headers objects
   ```typescript
   const newHeaders = new Headers(response.headers);
   ```

3. **Comprehensive Content-Type Checks**: Include all expected MIME types
   ```typescript
   const isTextContent = contentType.includes('text') ||
                         contentType.includes('javascript') ||
                         contentType.includes('html') ||
                         contentType.includes('json');
   ```

4. **Monitor Function Logs**: Enable and check Cloudflare Workers logs for errors

---

## Key Takeaways

1. **Always use absolute paths** for build tool configurations like `output.path`
2. **Enable experimental features** explicitly when using newer bundler features
3. **Rspack CSS support** requires the `experiments.css: true` flag
4. **External configuration files** (like `postcss.config.js`) are automatically detected when using the appropriate loaders
5. **Simplify configurations** - sometimes less is more (simple `type: 'css'` works better than complex loader chains when the experimental flag is enabled)
6. **Explicit type references** in tsconfig help IDEs recognize type definitions
7. **React 18 with jsx: "react-jsx"** doesn't require importing React in every component file
8. **Module Federation exposed components** must import their own styles - dependencies from the entry point are not automatically included
9. **Cloudflare Response headers are immutable** - always create new Headers objects when modifying responses in edge functions
10. **Test edge functions locally** before deploying to catch Worker exceptions early

---

## Related Documentation

- [Rspack CSS Documentation](https://rspack.dev/guide/features/builtin-swc-loader.html#css)
- [Rspack Experiments](https://rspack.dev/config/experiments.html)
- [Node.js Path Module](https://nodejs.org/api/path.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [React 18 JSX Transform](https://react.dev/blog/2020/09/22/introducing-the-new-jsx-transform)

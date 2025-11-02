# Troubleshooting Guide

This document outlines the issues encountered during the initial setup of the micro-frontend project and their solutions.

## Table of Contents
- [Issue 1: Path Resolution Error](#issue-1-path-resolution-error)
- [Issue 2: CSS Parser Registration Error](#issue-2-css-parser-registration-error)
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

## Key Takeaways

1. **Always use absolute paths** for build tool configurations like `output.path`
2. **Enable experimental features** explicitly when using newer bundler features
3. **Rspack CSS support** requires the `experiments.css: true` flag
4. **External configuration files** (like `postcss.config.js`) are automatically detected when using the appropriate loaders
5. **Simplify configurations** - sometimes less is more (simple `type: 'css'` works better than complex loader chains when the experimental flag is enabled)
6. **Explicit type references** in tsconfig help IDEs recognize type definitions
7. **React 18 with jsx: "react-jsx"** doesn't require importing React in every component file

---

## Related Documentation

- [Rspack CSS Documentation](https://rspack.dev/guide/features/builtin-swc-loader.html#css)
- [Rspack Experiments](https://rspack.dev/config/experiments.html)
- [Node.js Path Module](https://nodejs.org/api/path.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [React 18 JSX Transform](https://react.dev/blog/2020/09/22/introducing-the-new-jsx-transform)

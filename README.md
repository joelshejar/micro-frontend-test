# Micro-Frontend Host Application

The main host application for a micro-frontend architecture using Module Federation with Rspack. This application serves as the container that dynamically loads and orchestrates remote micro-frontend applications.

## 🚀 Tech Stack

- **Framework:** React 18.3.1
- **Build Tool:** Rspack 1.1.8 (High-performance bundler)
- **Module Federation:** Built-in Rspack Module Federation Plugin
- **Language:** TypeScript 5.6.3
- **Styling:** Tailwind CSS 3.4 + shadcn/ui
- **Package Manager:** pnpm 9.15.9
- **Node Version:** 20.13.1

## 📁 Project Structure

```
micro-frontend-host/
├── src/
│   ├── components/        # shadcn/ui components (to be added)
│   ├── lib/              # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   ├── index.tsx         # Application entry point
│   └── index.css         # Global styles with Tailwind
├── rspack.config.ts      # Rspack + Module Federation config
├── tailwind.config.js    # Tailwind CSS configuration
├── components.json       # shadcn/ui configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 20+ (recommended: use nvm)
- pnpm 9+

### Getting Started

```bash
# Use correct Node version
nvm use

# Install dependencies
pnpm install

# Start development server (runs on http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm type-check
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server with hot reload (port 3000)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm type-check` - Run TypeScript type checking

## 🐛 Troubleshooting

If you encounter issues during setup or development, check out the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide which covers:

- **Path Resolution Errors** - Issues with `./dist` path configuration
- **CSS Parser Errors** - "No parser registered for 'css'" error
- **Rspack Configuration** - Enabling experimental CSS support

Common quick fixes:
```bash
# If port 3000 is already in use
lsof -ti:3000 | xargs kill -9

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear rspack cache
rm -rf dist node_modules/.cache
```

For detailed solutions and explanations, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## 🎨 Adding shadcn/ui Components

This project is pre-configured for shadcn/ui. To add components:

```bash
# Install shadcn CLI globally (if not already installed)
pnpm add -g shadcn-ui

# Add a component (e.g., button)
npx shadcn-ui@latest add button

# Add multiple components
npx shadcn-ui@latest add button card dialog
```

Components will be added to `src/components/ui/` and can be imported with `@/components/ui/*`.

## 📚 Automated Documentation System

This project uses an **automated, date-based documentation system** that generates LinkedIn posts and Twitter threads based on actual work completed.

### How It Works

Every work session is automatically documented:
- **CHANGELOG.md** - Tracks all changes by date (source of truth)
- **LINKEDIN.md** - Ready-to-post LinkedIn content generated from changes
- **TWITTER.md** - Ready-to-post Twitter threads generated from changes
- **.claude/rules** - Automation rules for consistent documentation

### Documentation Files

- **CHANGELOG.md** - Complete history of changes organized by date
- **LINKEDIN.md** - Professional posts (300-500 words) with code snippets
- **TWITTER.md** - Casual threads (8-12 tweets) for engagement
- **DOCUMENTATION.md** - Full guide on how the system works

### At End of Each Session

Simply say "I'm done" and the system will:
1. ✅ Update CHANGELOG.md with today's changes
2. ✅ Generate LinkedIn post based on actual work
3. ✅ Generate Twitter thread based on actual work
4. ✅ Update README.md timeline

All posts are based on **real work completed**, not templates or predictions.

📖 **See DOCUMENTATION.md for complete guide**

## 🔌 Module Federation Configuration

This project is configured to load remote micro-frontend applications using Module Federation.

### Current Setup

**Host Application**: Running on port 3000
**Remote Applications**:
- `remote1` - Running on port 3001 (exposes `App` and `Button` components)

### Quick Start

Start both applications in separate terminals:

```bash
# Terminal 1: Start remote app
cd /Users/joelrajeshk/Desktop/micro-frontend-test-remote
pnpm dev

# Terminal 2: Start host app
cd /Users/joelrajeshk/Desktop/micro-frontend-test
pnpm dev
```

Visit http://localhost:3000 to see the host app with integrated remote components.

### Integration Example

The host app loads remote components using lazy loading:

```typescript
import { lazy, Suspense } from 'react';

// Load remote components
const RemoteApp = lazy(() => import('remote1/App'));
const RemoteButton = lazy(() => import('remote1/Button'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemoteButton />
      <RemoteApp />
    </Suspense>
  );
}
```

### Complete Guide

For detailed instructions on integrating remote applications, troubleshooting, and best practices, see:

**[MODULE_FEDERATION_GUIDE.md](./MODULE_FEDERATION_GUIDE.md)** - Complete guide covering:
- Step-by-step integration instructions
- Architecture overview
- Troubleshooting common issues
- Adding more remote apps
- Best practices and tips

## 📚 Development Timeline

### ✅ Phase 1: Bootstrap (Completed)
**Date:** October 30, 2025

- [x] Set up Node.js environment with version locking (.nvmrc)
- [x] Installed and configured pnpm 9.15.9
- [x] Configured TypeScript with strict mode
- [x] Configured .gitignore for Node/TypeScript projects

### ✅ Phase 2: Host Application Setup (Completed)
**Date:** November 2, 2025

- [x] Created host application with React 18.3.1
- [x] Configured Rspack 1.1.8 as build tool
- [x] Set up Module Federation for remote loading
- [x] Integrated Tailwind CSS 3.4
- [x] Configured shadcn/ui component system
- [x] Added TypeScript path aliases (@/*)
- [x] Created development and production scripts

### 🔄 Phase 3: Coming Next
- [ ] Create remote micro-frontend app #1
- [ ] Create remote micro-frontend app #2
- [ ] Implement shared state management
- [ ] Add routing across micro-frontends
- [ ] Set up ESLint and Prettier
- [ ] Add testing framework (Vitest + React Testing Library)
- [ ] Implement error boundaries for remote apps
- [ ] Add deployment configuration

## 🤝 Contributing

This is a learning project documenting the journey of building a micro-frontend architecture.

## 📄 License

MIT

---

**Built with** ❤️ **by Joel Rajesh K**

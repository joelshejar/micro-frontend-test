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

### Adding Remote Applications

1. **Update rspack.config.ts** to add remote entries:

```typescript
remotes: {
  remote1: 'remote1@http://localhost:3001/remoteEntry.js',
  remote2: 'remote2@http://localhost:3002/remoteEntry.js',
},
```

2. **Import remote components** in your React code:

```typescript
import { lazy, Suspense } from 'react';

const RemoteApp = lazy(() => import('remote1/App'));
const RemoteButton = lazy(() => import('remote2/Button'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemoteApp />
      <RemoteButton />
    </Suspense>
  );
}
```

3. **Add type definitions** in `src/types/remotes.d.ts`:

```typescript
declare module 'remote1/*' {
  const Component: React.ComponentType<any>;
  export default Component;
}
```

### Creating a Remote Application

See the remote application template repositories for setup instructions. Remote apps need:
- Module Federation plugin configured to expose components
- Same React version (18.3.1) marked as singleton
- Unique port and application name

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

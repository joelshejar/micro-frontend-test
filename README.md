# Micro-Frontend Monorepo

A production-ready micro-frontend architecture using Module Federation, built with modern tooling and best practices.

## 🚀 Tech Stack

- **Package Manager:** pnpm 9.15.9
- **Build Orchestration:** Turborepo 2.5.8
- **Language:** TypeScript 5.9.3
- **Node Version:** 20.13.1

## 📁 Project Structure

```
micro-frontend-test/
├── apps/              # Micro-frontend applications
│   └── (coming soon)
├── packages/          # Shared packages & utilities
│   └── (coming soon)
├── .nvmrc            # Node version lock
├── pnpm-workspace.yaml
├── turbo.json        # Turborepo pipeline
└── tsconfig.json     # TypeScript base config
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

# Start development
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test
```

## 📦 Workspace Configuration

This monorepo uses pnpm workspaces with the following structure:
- `apps/*` - Micro-frontend applications (host & remotes)
- `packages/*` - Shared libraries and utilities

## 🔧 Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests across all packages
- `pnpm clean` - Clean all build artifacts and node_modules
- `pnpm format` - Format code with Prettier

## 📚 Development Timeline

### ✅ Phase 1: Bootstrap (Completed)
**Date:** October 30, 2025

- [x] Set up Node.js environment with version locking (.nvmrc)
- [x] Installed and configured pnpm 9.15.9
- [x] Created monorepo structure with workspace configuration
- [x] Configured TypeScript with strict mode
- [x] Set up Turborepo for build orchestration
- [x] Created folder structure (apps/, packages/)
- [x] Configured .gitignore for Node/TypeScript projects
- [x] Installed core dependencies (Turbo, TypeScript, Prettier)

### 🔄 Phase 2: Coming Next
- [ ] Create host application
- [ ] Create remote micro-frontend apps
- [ ] Set up Module Federation
- [ ] Configure shared UI component library
- [ ] Add ESLint configuration
- [ ] Set up testing framework

## 🤝 Contributing

This is a learning project documenting the journey of building a micro-frontend architecture.

## 📄 License

MIT

---

**Built with** ❤️ **by Joel Rajesh K**

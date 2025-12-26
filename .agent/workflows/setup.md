---
description: Workflow to setup the development environment
---

# Setup Workflow

> **Purpose**: Configure the development environment for a new developer or agent.

## Prerequisites

- **Node.js**: v22+ (LTS recommended)
- **npm**: v11+ (specified in package.json: npm@11.7.0)
- **Git**: For version control

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers (For E2E Testing)

```bash
npx playwright install --with-deps
```

This installs Chromium, Firefox, and WebKit browsers plus required system dependencies.

### 3. Verify Installation

```bash
# Check build works
npm run build

# Check tests run
npm test

# Check linting
npm run lint
```

### 4. Start Development Server

```bash
npm start
```

Open <http://localhost:4200> in your browser.

## Optional Configuration

### Environment Variables

Currently, the app uses no runtime environment variables. All configuration is baked at build time.

If future environment variables are needed:

1. Check `.env.example` for required variables
2. Create `.env` with your values
3. Variables prefixed with `NG_APP_` are available in Angular

### IDE Setup

**VS Code Extensions (Recommended):**

- Angular Language Service
- ESLint
- Prettier
- Tailwind CSS IntelliSense

**Settings already configured in `.vscode/`:**

- Editor formatting on save
- ESLint integration
- Angular-specific settings

### Backend Development

If you need to run the backend locally:

1. Clone [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap)
2. Follow its setup instructions
3. Update `src/environments/environment.ts` with local API URL

## Troubleshooting

### Node Version Mismatch

```bash
# Check current version
node --version

# Use nvm to switch (if installed)
nvm use 20
```

### npm Permission Errors

```bash
# Clear npm cache
npm cache clean --force

# Or try with sudo (not recommended for global installs)
```

### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install --with-deps

# On Linux, you may need additional dependencies
sudo apt-get install libnss3 libatk1.0-0 libatk-bridge2.0-0
```

## Quick Reference

```bash
# Full setup
npm install
npx playwright install --with-deps
npm run build
npm start
```

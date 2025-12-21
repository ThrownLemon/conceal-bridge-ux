# Conceal Bridge UX (`conceal-bridge-ux`)

Angular 21 standalone SPA for bridging between native ₡CCX and wrapped CCX ($wCCX) on EVM networks (Ethereum / BNB Smart Chain / Polygon).

- **Production URL**: <https://bridge.conceal.network>
- **GitHub Pages**: <https://thrownlemon.github.io/conceal-bridge-ux/>
- **Backend API**: [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap)

## What This App Does

The Conceal Bridge UI enables seamless 1:1 conversions between privacy-focused ₡CCX and DeFi-compatible $wCCX tokens.

### Core Functionality

The UI:

- Connects to EVM wallets (MetaMask, Trust Wallet, Binance Wallet) via Viem
- Calls the [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap) backend API to initialize/execute swaps
- Sends on-chain transactions (native gas fees and ERC-20 transfers)
- Polls backend state until swaps complete
- Tracks transaction history locally

### Supported Networks

- **Ethereum** - 500k $wCCX max supply
- **Binance Smart Chain (BSC)** - 350k $wCCX max supply
- **Polygon** - 500k $wCCX max supply

## Tech Stack

- **Framework**: Angular 21 (Standalone Components, Signals, OnPush, Zoneless-ready)
- **Styling**: Tailwind CSS v4 (CSS-first, utility-first, dark theme)
- **Web3**: Viem (modern EVM wallet integration)
- **HTTP**: RxJS + Angular HttpClient
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Package Manager**: npm@11.7.0
- **Build**: Angular CLI 21

## Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm**: v11.7.0
- Install dependencies from this folder (the one containing `package.json`)

## Local Development

```bash
npm install
npm start
```

This runs the Angular dev server. The app will be available at:

- <http://localhost:4200/>

The dev server will automatically reload when source files change.

## Configuration

### Backend API Base URL

The app uses Angular environment files for configuration:

- **Development (default)**: `src/environments/environment.development.ts` (Testing backend at `https://bridge.conceal.network/testing/backend`)
- **Production**: `src/environments/environment.ts` (Production backend at `https://bridge.conceal.network/backend`)

The backend URL is accessed via the `APP_CONFIG` injection token (`src/app/core/app-config.ts`), which automatically reads `apiBaseUrl` from the active environment file based on the build configuration.

**To change the backend URL:**
- For development: Edit `src/environments/environment.development.ts`
- For production: Edit `src/environments/environment.ts`

### Supported Wallets

The app supports EVM wallet connections through **injected providers** (browser extensions):

- **MetaMask** - Most popular Ethereum wallet
- **Trust Wallet** - Mobile-first multi-chain wallet
- **Binance Wallet** - Binance Chain wallet

No additional configuration is required. The `EvmWalletService` (`src/app/core/evm-wallet.service.ts`) automatically detects and connects to available wallet providers using Viem.

## Project Structure

```text
src/
├── app/
│   ├── core/              # Singleton services, types, configs
│   │   ├── bridge-api.service.ts      # Backend API client
│   │   ├── evm-wallet.service.ts      # Viem wallet integration
│   │   ├── bridge-types.ts            # TypeScript interfaces
│   │   └── evm-networks.ts            # Chain configurations
│   ├── pages/             # Route-level components (lazy loaded)
│   │   ├── home/          # Landing page
│   │   ├── swap/          # Main swap interface
│   │   └── not-found/     # 404 page
│   ├── shared/            # Reusable UI components
│   │   ├── wallet/        # Wallet connection components
│   │   ├── qr-code/       # QR code generator
│   │   └── transaction-history/  # Transaction history modal
│   ├── app.config.ts      # Global providers (Router, HTTP, etc.)
│   └── app.routes.ts      # Main routing configuration
├── environments/          # Environment-specific configs
└── main.ts                # Application bootstrap
public/                    # Static assets (Angular public assets)
docs/                      # Detailed project documentation (22+ files)
```

### Tech Notes

- Standalone bootstrap entrypoint: `src/main.ts`
- Static assets live in `public/` (Angular "public assets" approach; no `src/assets/`)
- Styling: Tailwind CSS v4 (via PostCSS, no config file required)
- All components are standalone (no NgModules)
- State management uses Angular Signals

## Build

Production build:

```bash
npm run build
```

Build artifacts are written to `dist/conceal-bridge-ux/browser/`.

Development build in watch mode:

```bash
npm run watch
```

## Testing

### Unit Tests (Vitest)

Run all unit tests:

```bash
npm test
```

Vitest provides fast unit testing with native ESM support.

### E2E Tests (Playwright)

Run end-to-end tests:

```bash
npm run e2e
```

Playwright tests are configured in `playwright.config.ts` and located in the `e2e/` directory. Tests run against the dev server automatically.

### Linting & Formatting

Run ESLint:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

Format all files with Prettier:

```bash
npm run format
```

Check formatting without changing files:

```bash
npm run format:check
```

## Deployment

### Automated Deployment via GitHub Actions

The project uses **GitHub Actions** for automated deployment. Simply push to the `master` branch:

```bash
git push origin master
```

The workflow will automatically:

1. Run linting checks
2. Run unit tests
3. Build the production bundle
4. Deploy to GitHub Pages

**Monitor deployment**: Check the **Actions** tab in your GitHub repository.

**Live URL**: <https://thrownlemon.github.io/conceal-bridge-ux/>

### Workflow Configuration

**Workflow file**: `.github/workflows/deploy.yml`

The workflow uses the native GitHub Actions deployment method (`actions/deploy-pages@v4`) which is:

- ✅ Secure (no third-party dependencies with vulnerabilities)
- ✅ Official GitHub solution
- ✅ Automatically handles SPA routing
- ✅ Integrated with GitHub Pages settings

### First-Time Setup

After pushing the workflow file:

1. Go to your GitHub repository
2. Navigate to **Settings > Pages**
3. Under **Source**, select **GitHub Actions**
4. The deployment will happen automatically on the next push to `master`

For detailed deployment information, see:

- [docs/deployment.md](./docs/deployment.md)
- [docs/ci_cd.md](./docs/ci_cd.md)

## Documentation

### High-Level Product & Architecture

- **Bridge overview / concept**: [docs/bridge_overview.md](./docs/bridge_overview.md)
- **User guide**: [docs/bridge_user_guide.md](./docs/bridge_user_guide.md)
- **Architecture**: [docs/bridge_architecture.md](./docs/bridge_architecture.md)
- **Backend API contract**: [docs/backend_api.md](./docs/backend_api.md)

### Development Guides

- **Build guide** (repo-specific): [docs/build_guide.md](./docs/build_guide.md)
- **Style guide** (UI/UX patterns): [docs/style_guide.md](./docs/style_guide.md)
- **Testing guide**: [docs/testing.md](./docs/testing.md)
- **Deployment guide**: [docs/deployment.md](./docs/deployment.md)
- **CI/CD pipeline**: [docs/ci_cd.md](./docs/ci_cd.md)

### Technical Specs

- **Wallets / Web3 integrations**: [docs/wallets.md](./docs/wallets.md), [docs/web3_integrations.md](./docs/web3_integrations.md)
- **Security + error handling**: [docs/security.md](./docs/security.md), [docs/error_handling.md](./docs/error_handling.md)
- **Smart contracts**: [docs/smart_conctracts.md](./docs/smart_conctracts.md)
- **Angular patterns**: [docs/angular-style-guide.md](./docs/angular-style-guide.md)

### For AI Agents

- **Agent instructions**: [AGENTS.md](./AGENTS.md) - Workflow, patterns, and critical rules
- **Project history**: [docs/project_history.md](./docs/project_history.md)

## Contributing

This project uses:

- **Issue tracking**: [bd (beads)](https://github.com/steveyegge/beads) - AI-native issue tracking that lives in your repo (`.beads/`)
- **Commit style**: Conventional Commits (feat:, fix:, docs:, chore:, refactor:)
- **Branching**: Feature branches merged to `master` via pull requests

### For Developers & AI Agents

- **Agent instructions**: [AGENTS.md](./AGENTS.md) - Critical workflows, patterns, and "Landing the Plane" rules
- **Detailed workflows**: [.agent/workflows/](./.agent/workflows/) - Comprehensive guides for:
  - Testing (`test.md`) - Unit & E2E testing
  - Deployment (`deploy.md`) - GitHub Actions & manual deployment
  - Debugging (`debug.md`) - Browser DevTools, Angular, Web3
  - Releases (`release.md`) - Versioning & changelog
  - Hotfixes (`hotfix.md`) - Emergency fix procedures
  - And more (review, scaffold, submit, update-packages)

**Quick start:** Run `bd onboard` to get started with beads issue tracking.

## Related Repositories

- **Backend API**: [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap) - Express.js swap engine
- **Conceal Network**: [ConcealNetwork](https://github.com/ConcealNetwork) - Privacy-focused cryptocurrency

## License

[Add license information here]

## Support

For issues or questions:

- Open an issue in this repository
- Visit the Conceal Network community channels

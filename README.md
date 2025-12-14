# Conceal Bridge UX (`conceal-bridge-ux`)

Angular 21 standalone SPA for bridging between native ₡CCX and wrapped CCX ($wCCX) on EVM networks (Ethereum / BNB Smart Chain / Polygon).

- Production URL: <https://bridge.conceal.network>

## What this app does

At a high level, the UI:

- connects to an EVM wallet,
- calls the bridge backend API to initialize/execute swaps,
- sends on-chain transactions (native gas-fee transactions or ERC-20 transfers),
- polls backend state until the swap completes.

## Documentation (in this repo)

High-level product + architecture docs:

- Bridge overview / concept: [docs/bridge_overview.md](./docs/bridge_overview.md)
- User guide: [docs/bridge_user_guide.md](./docs/bridge_user_guide.md)
- Architecture: [docs/bridge_architecture.md](./docs/bridge_architecture.md)
- Backend API contract (endpoints + shapes): [docs/backend_api.md](./docs/backend_api.md)
- Wallets / Web3 integrations: [docs/wallets.md](./docs/wallets.md), [docs/web3_integrations.md](./docs/web3_integrations.md)
- Security + error handling: [docs/security.md](./docs/security.md), [docs/error_handling.md](./docs/error_handling.md)
- Build guide (repo-specific): [docs/build_guide.md](./docs/build_guide.md)
- **Deployment guide:** [docs/deployment.md](./docs/deployment.md)
- **CI/CD pipeline:** [docs/ci_cd.md](./docs/ci_cd.md)

## Tech notes

- Standalone bootstrap entrypoint: `src/main.ts`
- Static assets live in `public/` (Angular “public assets” approach; no `src/assets/`)
- Styling: Tailwind CSS v4 (via PostCSS)

## Prerequisites

- Node.js + npm
- Install dependencies from this folder (the one containing `package.json`)

## Local development

```bash
npm install
npm run start
```

This runs the Angular dev server. The app will be available at:

- <http://localhost:4200/>

## Configuration

### Backend API base URL

The backend base URL is provided via the `APP_CONFIG` injection token in:

- `src/app/core/app-config.ts`

**Configuration:** The app uses Angular environment files for configuration.

- **Development (default):** Uses `src/environments/environment.development.ts` (Testing backend).
- **Production (`npm run build`):** Uses `src/environments/environment.ts` (Production backend).

The `APP_CONFIG` injection token in `src/app/core/app-config.ts` reads from the active environment file.

### WalletConnect project ID

WalletConnect v2 uses `walletConnectProjectId` from the same config token:

- `src/app/core/app-config.ts`

If WalletConnect is not configured (missing/invalid project ID), the WalletConnect connector will be unavailable.

## Build

```bash
npm run build
```

Build artifacts are written under `dist/` (Angular application output).

Development build in watch mode:

```bash
npm run watch
```

## Testing

Unit tests:

```bash
npm run test
```

## E2E tests

E2E is not configured in this workspace by default. If/when you add an E2E framework, document it in:

- [ai_spec/e2e_testing.md](./ai_spec/e2e_testing.md)
- [docs/testing.md](./docs/testing.md)

## Deployment

### Automated Deployment via GitHub Actions

The project uses **GitHub Actions** for automated deployment. Simply push to the `main` branch:

```bash
git push origin main
```

The workflow will automatically:

1. Run tests
2. Build the production bundle
3. Deploy to GitHub Pages

**Monitor deployment:** Check the **Actions** tab in your GitHub repository.

**Live URL:** <https://thrownlemon.github.io/conceal-bridge-ux/>

### Workflow Configuration

**Workflow file:** `.github/workflows/deploy.yml`

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

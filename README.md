# Conceal Bridge UX (`conceal-bridge-ux`)

Angular 21 standalone SPA for bridging between native ₡CCX and wrapped CCX ($wCCX) on EVM networks (Ethereum / BNB Smart Chain / Polygon).

- Production URL: https://bridge.conceal.network

## What this app does

At a high level, the UI:

- connects to an EVM wallet (injected providers + WalletConnect),
- calls the bridge backend API to initialize/execute swaps,
- sends on-chain transactions (native gas-fee transactions or ERC-20 transfers),
- polls backend state until the swap completes.

## Documentation (in this repo)

High-level product + architecture docs:

- Bridge overview / concept: [ai_docs/bridge_overview.md](./ai_docs/bridge_overview.md)
- User guide: [ai_docs/bridge_user_guide.md](./ai_docs/bridge_user_guide.md)
- Architecture: [ai_docs/bridge_architecture.md](./ai_docs/bridge_architecture.md)
- Backend API contract (endpoints + shapes): [ai_docs/backend_api.md](./ai_docs/backend_api.md)
- Wallets / Web3 integrations: [ai_docs/wallets.md](./ai_docs/wallets.md), [ai_docs/web3_integrations.md](./ai_docs/web3_integrations.md)
- Security + error handling: [ai_docs/security.md](./ai_docs/security.md), [ai_docs/error_handling.md](./ai_docs/error_handling.md)
- Build guide (repo-specific): [ai_docs/angular_build_guide.md](./ai_docs/angular_build_guide.md)
- **Deployment guide:** [ai_docs/deployment.md](./ai_docs/deployment.md)
- **CI/CD pipeline:** [ai_docs/ci_cd.md](./ai_docs/ci_cd.md)

Specs (implementation-focused):

- Environment config plan (prod vs testing): [ai_spec/environment_configuration.md](./ai_spec/environment_configuration.md)
- Runtime config: [ai_spec/runtime_config.md](./ai_spec/runtime_config.md)
- HTTP + error handling: [ai_spec/http_and_error_handling.md](./ai_spec/http_and_error_handling.md)

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

- http://localhost:4200/

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
- [ai_docs/testing.md](./ai_docs/testing.md)

## Deployment

### Automated Deployment (Recommended)

The project uses **GitHub Actions** for automated deployment. Simply push to the `main` branch:

```bash
git push origin main
```

The workflow will automatically:
1. Run tests
2. Build the production bundle
3. Deploy to GitHub Pages

**Monitor deployment:** Check the **Actions** tab in your GitHub repository.

For details, see [ai_docs/ci_cd.md](./ai_docs/ci_cd.md).

### Manual Deployment

If you need to deploy manually:

This project is configured for automated deployment to GitHub Pages using `angular-cli-ghpages`.

**Deploy command:**

```bash
npm run deploy
```

Or directly with the Angular CLI:

```bash
ng deploy --base-href=/conceal-bridge-ux/
```

This will:
1. Build the production bundle
2. Create a `404.html` file (for SPA routing support)
3. Push the build output to the `gh-pages` branch

**Live URL:** https://thrownlemon.github.io/conceal-bridge-ux/

**Configuration:**
- The `deploy` target is configured in `angular.json`
- The `--base-href` flag ensures assets load correctly under the GitHub Pages subdirectory

**First-time setup:**
After the first successful deployment, ensure your repository **Settings > Pages** is configured to deploy from the `gh-pages` branch.

For more details on deployment strategy, caching, and security headers, see:
- [ai_spec/deployment_static_hosting.md](./ai_spec/deployment_static_hosting.md)
- [ai_spec/security_headers_and_csp.md](./ai_spec/security_headers_and_csp.md)

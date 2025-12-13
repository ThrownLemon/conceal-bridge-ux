# Conceal Bridge UX (`concael-bridge-ux`)

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

**Important:** Right now, `apiBaseUrl` is hardcoded to the *testing* backend URL in source. This means:

- `npm run start` (dev server) uses the testing backend (intended).
- `npm run build` (production build) will also still bundle the testing backend URL (until you implement environment/config overrides).

There is a repo spec describing how to move this to standard Angular environment file replacements:

- [ai_spec/environment_configuration.md](./ai_spec/environment_configuration.md)

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

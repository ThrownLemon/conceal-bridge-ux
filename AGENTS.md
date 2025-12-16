# AGENTS.md

> **Purpose**: This file provides high-level context, commands, and patterns for AI agents working on the `conceal-bridge-ux` project.

## Project Overview

- **Name**: Conceal Bridge UX (`conceal-bridge-ux`)
- **Type**: Angular 21 Web Application (SPA)
- **Goal**: UI for bridging ₡CCX and $wCCX across Ethereum, BSC, and Polygon.
- **Key Tech**:
  - **Framework**: Angular 21 (Standalone Components, Signals, Zoneless-ready)
  - **Styling**: TailwindCSS v4 (Utility-first)
  - **Web3**: Viem (EVM wallet integration)
  - **Testing**: Vitest (Unit), Playwright (E2E)

## Quick Start Commands

- **Install**: `npm install`
- **Dev Server**: `npm start` (Runs on `http://localhost:4200`)
- **Build (Prod)**: `npm run build` (Output: `dist/conceal-bridge-ux`)
- **Unit Test**: `npm test`
- **Lint**: `npm run lint` (Fix: `npm run lint:fix`)
- **Format**: `npm run format`

## Project Structure

```text
src/
├── app/
│   ├── core/           # Singleton services (API, Wallet), Types, App Config
│   ├── pages/          # Route-level components (Lazy loaded)
│   ├── shared/         # Reusable UI components
│   ├── app.config.ts   # Global providers (Router, HTTP, Error Handling)
│   └── app.routes.ts   # Main routing configuration
├── environments/       # Build-time configuration (Dev vs Prod)
└── main.ts             # Application bootstrap
docs/                   # detailed project documentation
```

## Architecture & Patterns

### Components

- **Standalone**: All components are standalone. Do NOT use NgModules.
- **Change Detection**: `OnPush` by default.
- **State**: Use **Signals** for local UI state and `computed()` for derived state.
- **Inputs/Outputs**: Use modern signal-based inputs (`input()`) and outputs (`output()`).

### Asynchronous Ops

- **HTTP**: Use `BridgeApiService` in `src/app/core/`.
- **Wallet**: Use `EvmWalletService` in `src/app/core/` for all Web3 interactions.
- **Observables**: Use RxJS for HTTP/Event streams, but convert to signals for the view where possible (`toSignal`).

### Styling

- **Tailwind**: Use utility classes in template HTML.
- **Global**: `src/styles.css` handles global resets and Tailwind imports.
- **Dark Mode**: The app is dark-themed by default.

## Documentation Map

- **Build & Architecture**: [`docs/build_guide.md`](docs/build_guide.md)
- **API Specs**: [`docs/backend_api.md`](docs/backend_api.md)
- **Wallet Integration**: [`docs/wallets.md`](docs/wallets.md)
- **Style Guide**: [`docs/style_guide.md`](docs/style_guide.md)
- **Project History**: [`docs/project_history.md`](docs/project_history.md)

## Common Tasks for Agents

1. **Before coding**: Read `docs/build_guide.md` and related specs.
2. **When modifying UI**: Check `docs/style_guide.md` and use Tailwind.
3. **When touching state**: Prefer Signals over behavior subjects for component state.
4. **When adding features**: Ensure new routes are lazy-loaded in `app.routes.ts`.

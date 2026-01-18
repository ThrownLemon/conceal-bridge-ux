# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular 21 SPA for bridging native CCX and wrapped wCCX tokens on EVM networks (Ethereum, BSC, Polygon). Uses Viem for Web3 integration, ZardUI for components, and Tailwind CSS v4 for styling.

## Commands

| Command              | Purpose                           |
| -------------------- | --------------------------------- |
| `npm start`          | Dev server at localhost:4200      |
| `npm test`           | Unit tests with coverage (Vitest) |
| `npm run test:watch` | Unit tests in watch mode          |
| `npm run e2e`        | E2E tests (Playwright)            |
| `npm run test:a11y`  | Accessibility tests               |
| `npm run lint`       | ESLint check                      |
| `npm run lint:fix`   | Auto-fix lint issues              |
| `npm run format`     | Prettier format                   |
| `npm run build`      | Production build                  |

Run a single test file: `npx vitest run src/app/path/to/file.spec.ts`

## Architecture

### Core Services (`src/app/core/`)

- **EvmWalletService** - Wallet connection (MetaMask, Trust, Binance), chain switching, provider management
- **BridgeApiService** - Backend API integration with config caching
- **evm-networks.ts** - Chain configurations using Viem chain objects

### Pages (`src/app/pages/`)

Route-level lazy-loaded components: home, swap, not-found

### Shared (`src/app/shared/`)

- **components/** - ZardUI-based components (button, card, input, toast, sheet, etc.)
- **wallet/** - Wallet button and modal UI
- **transaction-history/** - Swap history display

### Key Patterns

- **Standalone components** - No NgModules, imports declared directly
- **OnPush change detection** - Required for all components
- **Signals** - `signal()` for state, `computed()` for derived, `effect()` for side effects
- **inject()** - Preferred over constructor injection
- **Built-in control flow** - `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- **input()/output()** - Not `@Input()`/`@Output()` decorators
- **host object** - For host bindings (not `@HostBinding`/`@HostListener`)

### RxJS Patterns

- `takeUntilDestroyed()` for subscription cleanup
- `toSignal()` for converting observables to signals
- `firstValueFrom()` for one-shot async operations

## Code Standards

### TypeScript

- Strict mode enabled
- Path alias: `@/*` maps to `src/app/*`
- No `any` types, use `unknown` and narrow
- Private fields use `#` syntax

### Angular Requirements

- `ChangeDetectionStrategy.OnPush` on all components
- Standalone is default (don't set `standalone: true`)
- Use `NonNullableFormBuilder` for typed forms
- Lazy-load routes with `loadComponent`

### Web3 Rules

- **NO hardcoded contract addresses** - Use environment config
- **NO private keys in code**
- Use `BigInt` for on-chain values, never floating point
- Always verify transaction receipts
- Handle wallet disconnection gracefully

### Styling

- Tailwind CSS v4 utility classes
- OKLCH color model for design tokens
- Dark mode default (`color-scheme: dark`)
- Component selectors: `app-` or `z-` prefix, kebab-case

## Git Workflow

- Feature branches: `feature/`, `fix/`, `docs/`, `chore/`
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Reference issues in commits: `fix: resolve login bug (#42)`
- PRs close issues with: `Closes #42`

## Quality Gates

All must pass before merge:

```bash
npm run lint
npm run format:check
npm test
npm run e2e
npm run build
```

## Documentation

Detailed docs in `docs/` directory:

- `bridge_architecture.md` - Technical architecture
- `backend_api.md` - API contract
- `web3_integrations.md` - Viem patterns
- `testing.md` - Test strategy
- `angular_best_practices.md` - Angular 21 patterns

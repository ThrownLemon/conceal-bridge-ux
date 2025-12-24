# Project Build Guide

## Project Overview

**Project Name:** conceal Bridge UX (workspace project: [`conceal-bridge-ux`](conceal-bridge-ux/package.json:1))

**Purpose:** A web UI for bridging (swapping) between **Conceal (CCX)** and **wrapped CCX (wCCX)** on EVM networks (**Ethereum**, **BNB Smart Chain**, **Polygon**). The UI:

- connects to an EVM wallet (injected providers),
- calls the bridge backend API to initialize/execute swaps,
- sends native gas-fee transactions or ERC-20 transfers (wCCX),
- polls backend state until the swap completes.

**Angular Version:** Angular **21.0.x** (CLI **21.0.x**)

- Dependencies pinned in [`conceal-bridge-ux/package.json`](conceal-bridge-ux/package.json:1)
- CLI version referenced in [`conceal-bridge-ux/README.md`](conceal-bridge-ux/README.md:1)

**Target Platform:** Web SPA (responsive), static build output suitable for typical static hosting.

**Key Features:**

- Standalone app bootstrapped via [`bootstrapApplication()`](conceal-bridge-ux/src/main.ts:1)
- Route-level lazy loading with [`loadComponent`](conceal-bridge-ux/src/app/app.routes.ts:3)
- Wallet UX: MetaMask / Trust / Binance Wallet via [`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:33)
- Swap UX for CCX→wCCX and wCCX→CCX via [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:400)
- Tailwind CSS UI (utility-first) via [`src/styles.css`](conceal-bridge-ux/src/styles.css:1) and PostCSS plugin config in [`.postcssrc.json`](conceal-bridge-ux/.postcssrc.json:1)

---

## Project Structure

### Folder Organization

This project uses the newer Angular “public assets” approach (no `src/assets/`).

```
conceal-bridge-ux/
├── angular.json
├── package.json
├── public/                   # Static assets served/copied to build output
│   ├── favicon.ico
│   └── images/...
└── src/
    ├── index.html
    ├── main.ts               # bootstrapApplication()
    ├── styles.css            # global styles + Tailwind import
    └── app/
        ├── core/             # API + app config + wallet + chain metadata
        ├── pages/            # Route-level pages (standalone)
        └── shared/           # Reusable UI components
```

**Key locations:**

- Entry point: [`conceal-bridge-ux/src/main.ts`](conceal-bridge-ux/src/main.ts:1)
- App root component: [`conceal-bridge-ux/src/app/app.ts`](conceal-bridge-ux/src/app/app.ts:1)
- App providers: [`conceal-bridge-ux/src/app/app.config.ts`](conceal-bridge-ux/src/app/app.config.ts:1)
- Routes: [`conceal-bridge-ux/src/app/app.routes.ts`](conceal-bridge-ux/src/app/app.routes.ts:1)
- Backend config token: [`conceal-bridge-ux/src/app/core/app-config.ts`](conceal-bridge-ux/src/app/core/app-config.ts:1)

### Naming Conventions (Observed)

- **Pages:** `kebab-case.page.ts` (examples: [`home.page.ts`](conceal-bridge-ux/src/app/pages/home/home.page.ts:1), [`swap.page.ts`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:1))
- **Components:** `kebab-case.component.ts` (example: [`wallet-button.component.ts`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:1))
- **Services:** `kebab-case.service.ts` (examples: [`bridge-api.service.ts`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:1), [`evm-wallet.service.ts`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:1))
- **Types:** simple `*.ts` files (example: [`bridge-types.ts`](conceal-bridge-ux/src/app/core/bridge-types.ts:1))

---

## Architecture & Patterns

### Component Architecture

- [x] Using **Standalone Components**
  - Root bootstraps via [`bootstrapApplication()`](conceal-bridge-ux/src/main.ts:1)
  - Pages/components declare `imports` directly (example: [`App`](conceal-bridge-ux/src/app/app.ts:5))

### State Management

- [x] **Signals** + computed signals (Angular 16+ reactive primitives)
  - Example usage: [`signal()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:1), [`computed()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:419)
- [x] **Services with RxJS** for API and side-effects
  - Example: [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13)

**State Management Pattern (Project-specific):**

- UI state lives locally in components as `signal()`s (e.g., busy flags, step state, error/status messages).
- Derived state uses `computed()`.
- Router params + form streams are converted using [`toSignal()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:409) to integrate RxJS with signals.
- Services encapsulate integration with:
  - backend HTTP API ([`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13))
  - EVM wallet/provider ([`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:33))

### Routing Strategy

- **Route configuration location:** [`conceal-bridge-ux/src/app/app.routes.ts`](conceal-bridge-ux/src/app/app.routes.ts:1)
- **Lazy loading:** Yes (route-level lazy load components via `loadComponent`)
  - Home page: [`loadComponent`](conceal-bridge-ux/src/app/app.routes.ts:6)
  - Swap page: [`loadComponent`](conceal-bridge-ux/src/app/app.routes.ts:16)
  - Not found: [`loadComponent`](conceal-bridge-ux/src/app/app.routes.ts:28)
- **Route guards used:** None found in this project.

### Change Detection Strategy

- **Default strategy:** `OnPush` (used across pages/components)
  - Root uses [`ChangeDetectionStrategy.OnPush`](conceal-bridge-ux/src/app/app.ts:7)
  - Pages use [`ChangeDetectionStrategy.OnPush`](conceal-bridge-ux/src/app/pages/home/home.page.ts:24)
- **When to use OnPush (project guideline):**
  - Always, unless a component relies on mutable objects / non-signal state that cannot be easily represented with inputs/signals/observables.

---

## Code Standards & Best Practices

### TypeScript Configuration

From [`conceal-bridge-ux/tsconfig.json`](conceal-bridge-ux/tsconfig.json:1):

- **Strict Mode:** Enabled (`"strict": true`)
- **Strict Templates:** Enabled (`"strictTemplates": true`)
- **No Implicit Any:** Enabled via `"strict": true`

Notable compiler options:

- `"target": "ES2022"` ([`tsconfig.json`](conceal-bridge-ux/tsconfig.json:15))
- `"module": "preserve"` ([`tsconfig.json`](conceal-bridge-ux/tsconfig.json:16))
- `"isolatedModules": true` ([`tsconfig.json`](conceal-bridge-ux/tsconfig.json:12))

### RxJS Patterns

**Subscription Management:**

- Prefer `takeUntilDestroyed()` to auto-cleanup subscriptions in components:
  - Example: [`takeUntilDestroyed()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:6) used when subscribing to network changes.
- Prefer `toSignal()` for router params / form streams:
  - Example: [`toSignal()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:409)
- For one-shot calls in async flows, use `firstValueFrom()`:
  - Example: [`firstValueFrom()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:8)

**Preferred Operators (observed):**

- `switchMap`, `catchError`, `filter`, `map`, `take`, `timer` (see imports in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:5))

**Avoid (project anti-patterns):**

- Leaking subscriptions (use `takeUntilDestroyed()` when manually subscribing)
- Storing async state in mutable fields without signals/observables

### Form Handling

- [x] **Reactive Forms** (preferred)
- [x] **Typed Forms** via `NonNullableFormBuilder` (Angular 14+)
  - Example: [`NonNullableFormBuilder`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:3)

### Error Handling

- **Global Error Handler:** No custom handler found. App enables browser global error listeners via:
  - [`provideBrowserGlobalErrorListeners()`](conceal-bridge-ux/src/app/app.config.ts:1)
- **HTTP Interceptor:** None found; HttpClient is provided directly via:
  - [`provideHttpClient()`](conceal-bridge-ux/src/app/app.config.ts:2)
- **User-Facing Error Messages (strategy):**
  - Components store `pageError` / `statusMessage` in signals and render conditionally:
    - Example: [`pageError`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:445), [`statusMessage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:446)
  - Backend call errors commonly handled with `catchError` → set error message → return fallback observable.

### Accessibility Requirements (Current State)

This project uses semantic HTML and includes some ARIA attributes (menus/modals), but there is no explicit WCAG policy in-repo.

- **WCAG Level:** Not specified (treat as “aim for AA”).
- **ARIA Labels:** Used where appropriate (example modal uses `role="dialog"` and `aria-modal="true"` in [`WalletButtonComponent`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:163)).
- **Keyboard Navigation:** Not explicitly documented; components should continue improving focus management for menus/modals.

---

## Dependencies & Third-Party Libraries

### Core Dependencies (from [`package.json`](conceal-bridge-ux/package.json:25))

```json
{
  "@angular/core": "^21.0.5",
  "@angular/common": "^21.0.5",
  "@angular/router": "^21.0.5",
  "@angular/forms": "^21.0.5",
  "rxjs": "~7.8.2",
  "typescript": "~5.9.3"
}
```

### UI Libraries

- [x] **Tailwind CSS** - `^4.1.18` ([`package.json`](conceal-bridge-ux/package.json:38))
  - Integrated via PostCSS plugin in [`.postcssrc.json`](conceal-bridge-ux/.postcssrc.json:1)
  - Imported in global stylesheet [`src/styles.css`](conceal-bridge-ux/src/styles.css:3)

### Web3 / Wallet Libraries

- **viem** - `^2.41.2` ([`package.json`](conceal-bridge-ux/package.json:25))
  - Used for EVM wallet client + chain switching + tx receipts:
    - See [`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:3)
  - Provider initialization in [`#resolveProvider()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:298)

### Other

- **QR Code generation**
  - `qrcode` `^1.5.4` (CommonJS; explicitly allowed by Angular build)
  - See `allowedCommonJsDependencies` in [`angular.json`](conceal-bridge-ux/angular.json:27)

### Internal/Custom Packages

None detected (no internal npm packages referenced in [`package.json`](conceal-bridge-ux/package.json:1)).

---

## Environment Configuration

### Environment Files

This project uses the standard Angular `src/environments/` pattern with build-time file replacements.

- **Files:**
  - [`src/environments/environment.ts`](conceal-bridge-ux/src/environments/environment.ts:1): **Production** configuration (default).
  - [`src/environments/environment.development.ts`](conceal-bridge-ux/src/environments/environment.development.ts:1): **Development/Testing** configuration.

- **Usage:**
  - `APP_CONFIG` in [`app-config.ts`](conceal-bridge-ux/src/app/core/app-config.ts:1) imports `environment` to provide values at runtime.

- **Configuration Strategy:**
  - `ng build` (Production): Uses `environment.ts` (default).
  - `ng build --configuration development`: Replaces `environment.ts` with `environment.development.ts` via `fileReplacements` in `angular.json`.
  - `ng serve`: Uses `development` configuration by default.

### Build Configurations

From [`conceal-bridge-ux/angular.json`](conceal-bridge-ux/angular.json:16):

- **Development:** `development` configuration (source maps enabled, optimization off)
- **Production:** `production` configuration (output hashing, budgets) and is the **default** build configuration

---

## Build & Deployment

### Build Commands (as configured)

Scripts in [`package.json`](conceal-bridge-ux/package.json:4):

- `npm run start` → runs Angular dev server
- `npm run build` → production build by default (because defaultConfiguration is production)
- `npm run watch` → development build in watch mode
- `npm run test` → unit tests

Raw Angular CLI equivalents (same behavior as scripts):

```bash
# Dev server (development configuration is default for serve)
ng serve

# Production build (default build configuration is production)
ng build

# Explicit dev build
ng build --configuration development

# Explicit prod build
ng build --configuration production
```

### Build Output

- **Output directory:** `dist/conceal-bridge-ux` (Angular default for the project name)
- **Production optimizations:** Enabled by default (production configuration)
- **Source maps:** Enabled in `development` configuration
  - See `sourceMap: true` in [`angular.json`](conceal-bridge-ux/angular.json:50)

### Deployment Target

**GitHub Pages** (via native GitHub Actions)

- **Deployment method:** GitHub Actions workflow using `actions/deploy-pages@v4`
- **Workflow file:** `.github/workflows/deploy.yml`
- **Live URL:** https://thrownlemon.github.io/conceal-bridge-ux/
- **Trigger:** Automatic on push to `master` branch, or manual via workflow dispatch
- **SPA Routing:** Handled automatically by GitHub Actions deployment

**Why native GitHub Actions?**

- ✅ Secure (no third-party dependencies with vulnerabilities)
- ✅ Official GitHub solution
- ✅ No manual deployment needed
- ✅ Integrated with GitHub Pages settings

Build artifacts are static and can be deployed to any static hosting (S3/CloudFront, Netlify, Vercel static, Nginx, etc.), but GitHub Pages via GitHub Actions is the current configured target.

For deployment details, see:

- [`.github/workflows/deploy.yml`](conceal-bridge-ux/.github/workflows/deploy.yml)
- [`docs/deployment.md`](conceal-bridge-ux/docs/deployment.md)
- [`docs/ci_cd.md`](conceal-bridge-ux/docs/ci_cd.md)
- [`README.md`](conceal-bridge-ux/README.md) (Deployment section)

### CI/CD Pipeline

**GitHub Actions** (configured for automated deployment)

- **Workflow file:** `.github/workflows/deploy.yml`
- **Trigger:** Automatic on push to `master` branch, or manual via workflow dispatch
- **Steps:**
  1. Checkout code
  2. Setup Node.js (v20)
  3. Install dependencies (`npm ci`)
  4. Run tests (`npm run test`)
  5. Build production bundle (`npm run build`)
  6. Deploy to GitHub Pages (`npm run deploy`)

The workflow automatically deploys to GitHub Pages whenever changes are pushed to the `main` branch.

**Manual trigger:** You can also trigger the workflow manually from the GitHub Actions tab in your repository.

For CI/CD details and alternative configurations, see:

- [`.github/workflows/deploy.yml`](conceal-bridge-ux/.github/workflows/deploy.yml)

---

## Testing Requirements

### Unit Testing

- **Framework:** Vitest (types configured)
  - [`vitest/globals`](conceal-bridge-ux/tsconfig.spec.json:7)
- **Run command:** `ng test` (also via `npm run test`)
  - Scripts in [`package.json`](conceal-bridge-ux/package.json:4)

### E2E Testing

Not configured (Angular CLI doesn’t include an e2e framework by default; see note in [`README.md`](conceal-bridge-ux/README.md:53)).

---

## Common Commands

### Development

Use the scripts defined in [`conceal-bridge-ux/package.json`](conceal-bridge-ux/package.json:4):

```bash
npm install
npm run start
```

### Quality Assurance

There is a `lint` script configured in [`package.json`](conceal-bridge-ux/package.json:4) using Angular ESLint.

```bash
# Run linting
npm run lint

# Fix auto-fixable lint issues
npm run lint:fix
```

### Build

```bash
# Production build (default)
npm run build

# Dev build watch
npm run watch
```

---

## Development Workflow (Repo-specific Notes)

This repo does not include branch/commit conventions in this project folder. If you adopt conventions, ensure they align with your org defaults.

---

## API Integration

### API Configuration

- **Base URL:** `APP_CONFIG.apiBaseUrl` from [`app-config.ts`](conceal-bridge-ux/src/app/core/app-config.ts:3)
- **URL composition:** `base/network/path` via [`#url()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:20)
- **Authentication:** None implemented in this UI (no auth headers/interceptors found).

### HTTP Client

- Provided globally via [`provideHttpClient()`](conceal-bridge-ux/src/app/app.config.ts:2)
- Service wrapper: [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13)

### API Error Handling (Observed)

- Uses `catchError(() => of(fallback))` for polling/balance endpoints:
  - Example: [`catchError(() => of({ result: false, balance: 0 }))`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:511)

---

## Styling Guidelines

### CSS Methodology

- [x] **Utility-First** (Tailwind)
- [x] **Component-Scoped** (Angular default) — but most styling is via Tailwind utility classes in templates

### Styling Technology

- [x] **CSS** (global stylesheet is `.css`)
  - [`src/styles.css`](conceal-bridge-ux/src/styles.css:1)

### Global Styles

- Location: [`conceal-bridge-ux/src/styles.css`](conceal-bridge-ux/src/styles.css:1)
- Tailwind import: [`@import "tailwindcss";`](conceal-bridge-ux/src/styles.css:3)

### Theme / Dark Mode

- App sets `color-scheme: dark` at [`:root`](conceal-bridge-ux/src/styles.css:5)
- Most UI uses Tailwind colors for dark styling.

---

## Performance Considerations

### Lazy Loading

Route-level component lazy loading is used for all main pages:

- Home: [`loadComponent`](conceal-bridge-ux/src/app/app.routes.ts:6)
- Swap: [`loadComponent`](conceal-bridge-ux/src/app/app.routes.ts:16)
- Not found: [`loadComponent`](conceal-bridge-ux/src/app/app.routes.ts:28)

### Change Detection Optimization

- Components use `OnPush` by default:
  - Example: [`ChangeDetectionStrategy.OnPush`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:61)
- Signals are used heavily; avoid calling functions repeatedly in templates unless memoized via `computed()`.

### Bundle Optimization

Production build has budgets configured:

- Initial bundle warning at 3MB and error at 6MB:
  - [`budgets`](conceal-bridge-ux/angular.json:36)
- Component style budgets:
  - [`anyComponentStyle`](conceal-bridge-ux/angular.json:42) (Warning: 4kB, Error: 8kB)

---

## Common Pitfalls & Gotchas (Project-specific)

None currently identified.

---

## Additional Resources

- Project readme: [`conceal-bridge-ux/README.md`](conceal-bridge-ux/README.md:1)
- Product/architecture docs live in [`conceal-bridge-ux/docs/`](conceal-bridge-ux/docs/build_guide.md:1)

---

## Related docs/specs in this repo

- Angular coding conventions for this repo: [`angular_best_practices.md`](conceal-bridge-ux/docs/angular_best_practices.md:1)
- External Angular reference links: [`angular_key_resources.md`](conceal-bridge-ux/docs/angular_key_resources.md:1)
- UI conventions (Tailwind v4, dark-first, brand rules): [`style_guide.md`](conceal-bridge-ux/docs/style_guide.md:1)
- Wallet integration and supported connectors: [`wallets.md`](conceal-bridge-ux/docs/wallets.md:1)
- Backend API contract (endpoints + response shapes): [`backend_api.md`](conceal-bridge-ux/docs/backend_api.md:1)
- Error handling conventions across the app: [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:1)
- Testing strategy (unit/E2E plan + web3 mocking): [`testing.md`](conceal-bridge-ux/docs/testing.md:1)

### Official Angular Best Practices (Local Copies)

- [Style Guide](conceal-bridge-ux/docs/angular-style-guide.md)
- [Security Best Practices](conceal-bridge-ux/docs/angular-security.md)
- [Accessibility (a11y)](conceal-bridge-ux/docs/angular-a11y.md)
- [Error Handling](conceal-bridge-ux/docs/angular-error-handling.md)
- [Runtime Performance](conceal-bridge-ux/docs/angular-runtime-performance.md)

# Angular Project Build Guide for AI Agent

## Project Overview

**Project Name:** Concael Bridge UX (workspace project: [`concael-bridge-ux`](concael-bridge-ux/package.json:1))

**Purpose:** A web UI for bridging (swapping) between **Conceal (CCX)** and **wrapped CCX (wCCX)** on EVM networks (**Ethereum**, **BNB Smart Chain**, **Polygon**). The UI:
- connects to an EVM wallet (injected providers + WalletConnect),
- calls the bridge backend API to initialize/execute swaps,
- sends native gas-fee transactions or ERC-20 transfers (wCCX),
- polls backend state until the swap completes.

**Angular Version:** Angular **21.0.x** (CLI **21.0.x**)  
- Dependencies pinned in [`concael-bridge-ux/package.json`](concael-bridge-ux/package.json:1)
- CLI version referenced in [`concael-bridge-ux/README.md`](concael-bridge-ux/README.md:1)

**Target Platform:** Web SPA (responsive), static build output suitable for typical static hosting.

**Key Features:**
- Standalone app bootstrapped via [`bootstrapApplication()`](concael-bridge-ux/src/main.ts:1)
- Route-level lazy loading with [`loadComponent`](concael-bridge-ux/src/app/app.routes.ts:3)
- Wallet UX: MetaMask / Trust / Binance Wallet / WalletConnect via [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:33)
- Swap UX for CCX→wCCX and wCCX→CCX via [`SwapPage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:400)
- Tailwind CSS UI (utility-first) via [`src/styles.css`](concael-bridge-ux/src/styles.css:1) and PostCSS plugin config in [`.postcssrc.json`](concael-bridge-ux/.postcssrc.json:1)

---

## Project Structure

### Folder Organization

This project uses the newer Angular “public assets” approach (no `src/assets/`).

```
concael-bridge-ux/
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
- Entry point: [`concael-bridge-ux/src/main.ts`](concael-bridge-ux/src/main.ts:1)
- App root component: [`concael-bridge-ux/src/app/app.ts`](concael-bridge-ux/src/app/app.ts:1)
- App providers: [`concael-bridge-ux/src/app/app.config.ts`](concael-bridge-ux/src/app/app.config.ts:1)
- Routes: [`concael-bridge-ux/src/app/app.routes.ts`](concael-bridge-ux/src/app/app.routes.ts:1)
- Backend config token: [`concael-bridge-ux/src/app/core/app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:1)

### Naming Conventions (Observed)

- **Pages:** `kebab-case.page.ts` (examples: [`home.page.ts`](concael-bridge-ux/src/app/pages/home/home.page.ts:1), [`swap.page.ts`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:1))
- **Components:** `kebab-case.component.ts` (example: [`wallet-button.component.ts`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:1))
- **Services:** `kebab-case.service.ts` (examples: [`bridge-api.service.ts`](concael-bridge-ux/src/app/core/bridge-api.service.ts:1), [`evm-wallet.service.ts`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:1))
- **Types:** simple `*.ts` files (example: [`bridge-types.ts`](concael-bridge-ux/src/app/core/bridge-types.ts:1))

---

## Architecture & Patterns

### Component Architecture

- [x] Using **Standalone Components**
  - Root bootstraps via [`bootstrapApplication()`](concael-bridge-ux/src/main.ts:1)
  - Pages/components declare `imports` directly (example: [`App`](concael-bridge-ux/src/app/app.ts:5))

### State Management

- [x] **Signals** + computed signals (Angular 16+ reactive primitives)
  - Example usage: [`signal()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:1), [`computed()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:419)
- [x] **Services with RxJS** for API and side-effects
  - Example: [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13)

**State Management Pattern (Project-specific):**
- UI state lives locally in components as `signal()`s (e.g., busy flags, step state, error/status messages).
- Derived state uses `computed()`.
- Router params + form streams are converted using [`toSignal()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:409) to integrate RxJS with signals.
- Services encapsulate integration with:
  - backend HTTP API ([`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13))
  - EVM wallet/provider ([`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:33))

### Routing Strategy

- **Route configuration location:** [`concael-bridge-ux/src/app/app.routes.ts`](concael-bridge-ux/src/app/app.routes.ts:1)
- **Lazy loading:** Yes (route-level lazy load components via `loadComponent`)
  - Home page: [`loadComponent`](concael-bridge-ux/src/app/app.routes.ts:6)
  - Swap page: [`loadComponent`](concael-bridge-ux/src/app/app.routes.ts:16)
  - Not found: [`loadComponent`](concael-bridge-ux/src/app/app.routes.ts:28)
- **Route guards used:** None found in this project.

### Change Detection Strategy

- **Default strategy:** `OnPush` (used across pages/components)
  - Root uses [`ChangeDetectionStrategy.OnPush`](concael-bridge-ux/src/app/app.ts:7)
  - Pages use [`ChangeDetectionStrategy.OnPush`](concael-bridge-ux/src/app/pages/home/home.page.ts:24)
- **When to use OnPush (project guideline):**
  - Always, unless a component relies on mutable objects / non-signal state that cannot be easily represented with inputs/signals/observables.

---

## Code Standards & Best Practices

### TypeScript Configuration

From [`concael-bridge-ux/tsconfig.json`](concael-bridge-ux/tsconfig.json:1):

- **Strict Mode:** Enabled (`"strict": true`)
- **Strict Templates:** Enabled (`"strictTemplates": true`)
- **No Implicit Any:** Enabled via `"strict": true`

Notable compiler options:
- `"target": "ES2022"` ([`tsconfig.json`](concael-bridge-ux/tsconfig.json:15))
- `"module": "preserve"` ([`tsconfig.json`](concael-bridge-ux/tsconfig.json:16))
- `"isolatedModules": true` ([`tsconfig.json`](concael-bridge-ux/tsconfig.json:12))

### RxJS Patterns

**Subscription Management:**
- Prefer `takeUntilDestroyed()` to auto-cleanup subscriptions in components:
  - Example: [`takeUntilDestroyed()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:6) used when subscribing to network changes.
- Prefer `toSignal()` for router params / form streams:
  - Example: [`toSignal()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:409)
- For one-shot calls in async flows, use `firstValueFrom()`:
  - Example: [`firstValueFrom()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:8)

**Preferred Operators (observed):**
- `switchMap`, `catchError`, `filter`, `map`, `take`, `timer` (see imports in [`SwapPage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:5))

**Avoid (project anti-patterns):**
- Leaking subscriptions (use `takeUntilDestroyed()` when manually subscribing)
- Storing async state in mutable fields without signals/observables

### Form Handling

- [x] **Reactive Forms** (preferred)
- [x] **Typed Forms** via `NonNullableFormBuilder` (Angular 14+)
  - Example: [`NonNullableFormBuilder`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:3)

### Error Handling

- **Global Error Handler:** No custom handler found. App enables browser global error listeners via:
  - [`provideBrowserGlobalErrorListeners()`](concael-bridge-ux/src/app/app.config.ts:1)
- **HTTP Interceptor:** None found; HttpClient is provided directly via:
  - [`provideHttpClient()`](concael-bridge-ux/src/app/app.config.ts:2)
- **User-Facing Error Messages (strategy):**
  - Components store `pageError` / `statusMessage` in signals and render conditionally:
    - Example: [`pageError`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:445), [`statusMessage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:446)
  - Backend call errors commonly handled with `catchError` → set error message → return fallback observable.

### Accessibility Requirements (Current State)

This project uses semantic HTML and includes some ARIA attributes (menus/modals), but there is no explicit WCAG policy in-repo.

- **WCAG Level:** Not specified (treat as “aim for AA”).
- **ARIA Labels:** Used where appropriate (example modal uses `role="dialog"` and `aria-modal="true"` in [`WalletButtonComponent`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:163)).
- **Keyboard Navigation:** Not explicitly documented; components should continue improving focus management for menus/modals.

---

## Dependencies & Third-Party Libraries

### Core Dependencies (from [`package.json`](concael-bridge-ux/package.json:25))

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

- [x] **Tailwind CSS** - `^4.1.18` ([`package.json`](concael-bridge-ux/package.json:38))
  - Integrated via PostCSS plugin in [`.postcssrc.json`](concael-bridge-ux/.postcssrc.json:1)
  - Imported in global stylesheet [`src/styles.css`](concael-bridge-ux/src/styles.css:3)

### Web3 / Wallet Libraries

- **viem** - `^2.41.2` ([`package.json`](concael-bridge-ux/package.json:25))
  - Used for EVM wallet client + chain switching + tx receipts:
    - See [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:3)
- **WalletConnect v2** - `@walletconnect/ethereum-provider ^2.23.1` ([`package.json`](concael-bridge-ux/package.json:25))
  - Provider initialization in [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:298)

### Other

- **QR Code generation**
  - `qrcode` `^1.5.4` (CommonJS; explicitly allowed by Angular build)
  - See `allowedCommonJsDependencies` in [`angular.json`](concael-bridge-ux/angular.json:27)

### Internal/Custom Packages

None detected (no internal npm packages referenced in [`package.json`](concael-bridge-ux/package.json:1)).

---

## Environment Configuration

### Environment Files

This project does **not** use the classic Angular `src/environments/` pattern (no environment files in this workspace).

Instead, it uses an `InjectionToken` that provides runtime-ish config via a factory:

- [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17)

Current defaults (checked into source):
- `apiBaseUrl` defaults to a **testing** backend URL in [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:19)
- `walletConnectProjectId` is present in [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:22)

**Important:** The comment notes these values should be “overridden at build time”, but no override mechanism is defined in this repo (e.g. file replacements or define plugin). If you need production/staging builds, add a documented config strategy (file replacements, environment injection, runtime `config.json`, etc.).

### Build Configurations

From [`concael-bridge-ux/angular.json`](concael-bridge-ux/angular.json:16):

- **Development:** `development` configuration (source maps enabled, optimization off)
- **Production:** `production` configuration (output hashing, budgets) and is the **default** build configuration

---

## Build & Deployment

### Build Commands (as configured)

Scripts in [`package.json`](concael-bridge-ux/package.json:4):

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

- **Output directory:** `dist/concael-bridge-ux` (Angular default for the project name)
- **Production optimizations:** Enabled by default (production configuration)
- **Source maps:** Enabled in `development` configuration
  - See `sourceMap: true` in [`angular.json`](concael-bridge-ux/angular.json:50)

### Deployment Target

Not specified in this repo. Build artifacts are static and can be deployed to any static hosting (S3/CloudFront, Netlify, Vercel static, Nginx, etc.).

### CI/CD Pipeline

Not specified in this repo (no GitHub Actions/GitLab/Jenkins config found under this project directory).

---

## Testing Requirements

### Unit Testing

- **Framework:** Vitest (types configured)
  - [`vitest/globals`](concael-bridge-ux/tsconfig.spec.json:7)
- **Run command:** `ng test` (also via `npm run test`)
  - Scripts in [`package.json`](concael-bridge-ux/package.json:4)

### E2E Testing

Not configured (Angular CLI doesn’t include an e2e framework by default; see note in [`README.md`](concael-bridge-ux/README.md:53)).

---

## Common Commands

### Development

Use the scripts defined in [`concael-bridge-ux/package.json`](concael-bridge-ux/package.json:4):

```bash
npm install
npm run start
```

### Quality Assurance

There is no `lint` script configured in [`package.json`](concael-bridge-ux/package.json:4). If linting is desired, add ESLint config + `ng lint` (or `eslint`) script.

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

- **Base URL:** `APP_CONFIG.apiBaseUrl` from [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:3)
- **URL composition:** `base/network/path` via [`#url()`](concael-bridge-ux/src/app/core/bridge-api.service.ts:20)
- **Authentication:** None implemented in this UI (no auth headers/interceptors found).

### HTTP Client

- Provided globally via [`provideHttpClient()`](concael-bridge-ux/src/app/app.config.ts:2)
- Service wrapper: [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13)

### API Error Handling (Observed)

- Uses `catchError(() => of(fallback))` for polling/balance endpoints:
  - Example: [`catchError(() => of({ result: false, balance: 0 }))`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:511)

---

## Styling Guidelines

### CSS Methodology

- [x] **Utility-First** (Tailwind)
- [x] **Component-Scoped** (Angular default) — but most styling is via Tailwind utility classes in templates

### Styling Technology

- [x] **CSS** (global stylesheet is `.css`)
  - [`src/styles.css`](concael-bridge-ux/src/styles.css:1)

### Global Styles

- Location: [`concael-bridge-ux/src/styles.css`](concael-bridge-ux/src/styles.css:1)
- Tailwind import: [`@import "tailwindcss";`](concael-bridge-ux/src/styles.css:3)

### Theme / Dark Mode

- App sets `color-scheme: dark` at [`:root`](concael-bridge-ux/src/styles.css:5)
- Most UI uses Tailwind colors for dark styling.

---

## Performance Considerations

### Lazy Loading

Route-level component lazy loading is used for all main pages:
- Home: [`loadComponent`](concael-bridge-ux/src/app/app.routes.ts:6)
- Swap: [`loadComponent`](concael-bridge-ux/src/app/app.routes.ts:16)
- Not found: [`loadComponent`](concael-bridge-ux/src/app/app.routes.ts:28)

### Change Detection Optimization

- Components use `OnPush` by default:
  - Example: [`ChangeDetectionStrategy.OnPush`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:61)
- Signals are used heavily; avoid calling functions repeatedly in templates unless memoized via `computed()`.

### Bundle Optimization

Production build has budgets configured:
- Initial bundle warning at 500kB and error at 1MB:
  - [`budgets`](concael-bridge-ux/angular.json:36)
- Component style budgets:
  - [`anyComponentStyle`](concael-bridge-ux/angular.json:42)

---

## Common Pitfalls & Gotchas (Project-specific)

1. **WalletConnect not configured**
   - **Cause:** `walletConnectProjectId` is empty or invalid.
   - **Where:** [`APP_CONFIG.walletConnectProjectId`](concael-bridge-ux/src/app/core/app-config.ts:11)
   - **Solution:** Provide a valid WalletConnect project ID for the target environment.

2. **Wrong backend environment**
   - **Cause:** `apiBaseUrl` is currently set to a testing endpoint in source.
   - **Where:** [`APP_CONFIG.apiBaseUrl`](concael-bridge-ux/src/app/core/app-config.ts:19)
   - **Solution:** Establish a production/staging config strategy and ensure the correct base URL per deployment.

3. **CommonJS dependency warnings**
   - **Cause:** `qrcode` is CommonJS.
   - **Solution:** It is already allowed via `allowedCommonJsDependencies` in [`angular.json`](concael-bridge-ux/angular.json:27).

---

## Additional Resources

- Project readme: [`concael-bridge-ux/README.md`](concael-bridge-ux/README.md:1)
- Product/architecture docs live in [`concael-bridge-ux/ai_docs/`](concael-bridge-ux/ai_docs/angular_build_guide.md:1)

---

## Related docs/specs in this repo

- Angular coding conventions for this repo: [`angular_best_practices.md`](concael-bridge-ux/ai_docs/angular_best_practices.md:1)
- External Angular reference links: [`angular_key_resources.md`](concael-bridge-ux/ai_docs/angular_key_resources.md:1)
- UI conventions (Tailwind v4, dark-first, brand rules): [`style_guide.md`](concael-bridge-ux/ai_docs/style_guide.md:1)
- Wallet integration and supported connectors: [`wallets.md`](concael-bridge-ux/ai_docs/wallets.md:1)
- Backend API contract (endpoints + response shapes): [`backend_api.md`](concael-bridge-ux/ai_docs/backend_api.md:1)
- Error handling conventions across the app: [`error_handling.md`](concael-bridge-ux/ai_docs/error_handling.md:1)
- Testing strategy (unit/E2E plan + web3 mocking): [`testing.md`](concael-bridge-ux/ai_docs/testing.md:1)
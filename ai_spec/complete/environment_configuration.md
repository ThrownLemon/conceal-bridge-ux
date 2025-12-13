# Spec: Environment Configuration (Prod vs Testing) — Concael Bridge UX

> [!NOTE]
> **Status: Implemented**

## Context / Current State

- The app currently hardcodes environment-like values inside the injection token factory in [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17), including:
  - `apiBaseUrl` pointing at a **testing** backend endpoint (see the factory body in [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:19)).
  - `walletConnectProjectId` checked into source (see [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:22)).
- Backend requests are built from `apiBaseUrl` inside [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:20).
- There is no `src/environments/` directory in this app today.
- Angular workspace uses Angular 21+ standalone bootstrap via [`bootstrapApplication()`](concael-bridge-ux/src/main.ts:1) and configurations in [`angular.json`](concael-bridge-ux/angular.json:1).

## Goal

Add **best-practice Angular environment configuration** so we can support at least:

- **Production** values (production backend URL, production WalletConnect project id if desired)
- **Testing** values (testing backend URL, testing WalletConnect project id if desired)

with predictable behavior based on Angular build configurations.

## Non-Goals

- Storing secrets in environment files (environment files are compiled into JS bundles and are publicly visible).
- Building a full runtime configuration system (optional enhancement only).
- Changing backend API routes or the swap/wallet behavior.

## Requirements

1. Running dev server should use **testing** backend by default:
   - `npm run start` → `ng serve` should point at testing API.
2. Production build should use **production** backend:
   - `npm run build` → `ng build` should point at production API (default build config is production in [`angular.json`](concael-bridge-ux/angular.json:56)).
3. No more hardcoded endpoint values in [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17). It should read from `environment` (file replacement).
4. Keep the current calling shape for the rest of the app:
   - consumers of [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) should not need refactors.
5. Follow Angular best practices for Angular 21 projects.

## Proposed Solution (Angular CLI Environment Files + File Replacements)

### High-level approach

Use Angular’s standard environment file pattern:

- Create:
  - [`concael-bridge-ux/src/environments/environment.ts`](concael-bridge-ux/src/environments/environment.ts:1) → **production** defaults
  - [`concael-bridge-ux/src/environments/environment.development.ts`](concael-bridge-ux/src/environments/environment.development.ts:1) → **testing** defaults (used by `development` build/serve config)
- Update [`angular.json`](concael-bridge-ux/angular.json:1) `development` configuration to replace `environment.ts` with `environment.development.ts`.
- Update [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) to read values from `environment` instead of hardcoding.

This leverages the existing:
- `build.configurations.development` and `build.configurations.production` in [`angular.json`](concael-bridge-ux/angular.json:34)
- `serve.defaultConfiguration = development` in [`angular.json`](concael-bridge-ux/angular.json:68)

### Why this is “best practice” for Angular

- Environment files + file replacements are the canonical Angular CLI approach for build-time config.
- Keeps config types explicit and tree-shakable.
- Avoids ad-hoc global variables and keeps DI clean.

## Detailed Design

### 1) Add environment files

Create [`environment.ts`](concael-bridge-ux/src/environments/environment.ts:1) (production defaults):

```ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://bridge.conceal.network/backend',
  walletConnectProjectId: '...prod-or-shared-id...',
} as const;
```

Create [`environment.development.ts`](concael-bridge-ux/src/environments/environment.development.ts:1) (testing defaults):

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://bridge.conceal.network/testing/backend',
  walletConnectProjectId: '...testing-or-shared-id...',
} as const;
```

Notes:
- `walletConnectProjectId` is not a secret, but keep it environment-specific to support separate WC projects per env if desired.
- `apiBaseUrl` must not include a trailing slash (consistent with comment in [`AppConfig.apiBaseUrl`](concael-bridge-ux/src/app/core/app-config.ts:5)). Even if it does, [`BridgeApiService.#url()`](concael-bridge-ux/src/app/core/bridge-api.service.ts:20) normalizes.

### 2) Wire environment into `APP_CONFIG`

Update [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) to:

- import `environment` from [`src/environments/environment.ts`](concael-bridge-ux/src/environments/environment.ts:1)
- return `apiBaseUrl` and `walletConnectProjectId` from `environment`

Example structure (pseudocode):

```ts
import { environment } from '../environments/environment';

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    apiBaseUrl: environment.apiBaseUrl,
    walletConnectProjectId: environment.walletConnectProjectId,
  }),
});
```

This keeps all existing consumers working:
- [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:16)
- [`EvmWalletService.walletConnectConfigured`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:62)

### 3) Update `angular.json` file replacements

In [`concael-bridge-ux/angular.json`](concael-bridge-ux/angular.json:1), for `build.configurations.development`, add:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.development.ts"
  }
]
```

Resulting behavior:
- `ng serve` (development) → uses testing environment file
- `ng build` (production default) → uses production environment file

Optional extension:
- Add a dedicated `testing` build configuration (distinct from `development`) if we want prod optimizations *but* testing backend:
  - `ng build --configuration testing`

### 4) Update docs / scripts (optional but recommended)

In [`package.json`](concael-bridge-ux/package.json:1) optionally add explicit scripts for clarity:

- `build:dev`: `ng build --configuration development`
- `build:prod`: `ng build --configuration production`
- `serve:prod`: `ng serve --configuration production` (useful for smoke testing)

## Acceptance Criteria

1. `ng serve` uses the testing backend URL (the same currently hardcoded in [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:21)).
2. `ng build` uses the production backend URL (previously commented in [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:20)).
3. No hardcoded env-specific values remain in the [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) factory.
4. WalletConnect remains functional and can be configured per environment.
5. All builds compile with strict TS + strict templates (as configured in [`tsconfig.json`](concael-bridge-ux/tsconfig.json:6) and [`angularCompilerOptions.strictTemplates`](concael-bridge-ux/tsconfig.json:22)).

## Testing Plan

- Manual verification:
  - Run `ng serve`, initiate a swap flow, confirm calls go to the testing backend domain (via browser network tab).
  - Run `ng build` and confirm generated bundle references the production URL (search in `dist/` output).
- Unit test (optional):
  - Add a unit test that injects [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) and asserts `apiBaseUrl` equals the expected value for the test environment.
  - Note: unit tests will compile using the default test builder; ensure it uses the intended environment file (may need explicit config if necessary).

## Risks / Considerations

- Environment files are public at runtime (compiled into JS). Do not store secrets.
- If deployments require changing API base URL *without rebuilding*, consider the optional runtime config approach below.

## Optional Enhancement (Runtime Config)

If “switch endpoints without rebuild” is needed, add a runtime-loaded JSON config:

- Serve `/config.json` from [`public/`](concael-bridge-ux/public:1) and fetch it at bootstrap using `APP_INITIALIZER`.
- This is more flexible for ops, but increases complexity. Keep it out of scope unless required.

## Implementation Steps (Work Breakdown)

1. Create [`src/environments/environment.ts`](concael-bridge-ux/src/environments/environment.ts:1) and [`src/environments/environment.development.ts`](concael-bridge-ux/src/environments/environment.development.ts:1).
2. Update [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) to source values from `environment`.
3. Add `fileReplacements` for the `development` configuration in [`angular.json`](concael-bridge-ux/angular.json:34).
4. (Optional) Add scripts in [`package.json`](concael-bridge-ux/package.json:4).
5. Update the docs section “Environment Configuration” in [`angular_build_guide.md`](concael-bridge-ux/ai_docs/angular_build_guide.md:1) to reflect the new approach.

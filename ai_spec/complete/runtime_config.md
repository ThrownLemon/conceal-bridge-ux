# Spec: Runtime Configuration (No-Rebuild) — Concael Bridge UX

> [!NOTE]
> **Status: Implemented**

## Context / Current State

- The app currently injects configuration via [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17), which is effectively “build-time” because it is compiled into the bundle.
- The build guide notes that environment switching is needed (prod vs testing), especially for `apiBaseUrl` (see current hardcoded value in [`app-config.ts`](concael-bridge-ux/src/app/core/app-config.ts:20)).
- The environment approach in [`environment_configuration.md`](concael-bridge-ux/ai_spec/environment_configuration.md:1) solves build-time config, but still requires **rebuild** to change URLs.

## Goal

Add an optional runtime configuration mechanism that allows changing non-secret settings **without rebuilding**, e.g.:

- `apiBaseUrl` switch between production and testing endpoints
- `walletConnectProjectId` per environment

This must work with the existing DI pattern and Angular 21 standalone bootstrap.

## Non-Goals

- Storing secrets (runtime config is public).
- Supporting arbitrary feature-flag systems beyond basic config.
- Migrating all configuration to runtime-only (we want sensible defaults via environments).

## Requirements

1. App loads configuration from a static file served alongside the app:
   - [`/config.json`](concael-bridge-ux/public/config.json:1) (served from [`public/`](concael-bridge-ux/public:1))
2. Runtime config merges with build-time defaults:
   - Build-time defaults come from environment files (per [`environment_configuration.md`](concael-bridge-ux/ai_spec/environment_configuration.md:1)).
3. Configuration is available **before** services use it:
   - [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:20) relies on `apiBaseUrl`.
4. Failure behavior is safe:
   - If `/config.json` is missing/unreachable/invalid, use build-time defaults.
5. Validate config shape to avoid runtime breakage.

## Proposed Solution

Use `APP_INITIALIZER` (or equivalent bootstrap-time async provider) to:

1. Fetch `/config.json`
2. Validate and normalize
3. Store it in a service (`RuntimeConfigService`)
4. Provide [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) from merged values (environment defaults + runtime overrides)

### Why this is “best practice”

- Avoids using global mutable `window.__CONFIG__` patterns when possible.
- Keeps config access type-safe and DI-driven.
- Ensures config is ready before any API calls.

## Detailed Design

### 1) Add a public runtime config file

Create:

- [`concael-bridge-ux/public/config.json`](concael-bridge-ux/public/config.json:1)

Example contents (prod deployment):

```json
{
  "apiBaseUrl": "https://bridge.conceal.network/backend",
  "walletConnectProjectId": "YOUR_PROD_WALLETCONNECT_PROJECT_ID"
}
```

Example contents (testing deployment):

```json
{
  "apiBaseUrl": "https://bridge.conceal.network/testing/backend",
  "walletConnectProjectId": "YOUR_TEST_WALLETCONNECT_PROJECT_ID"
}
```

Notes:
- This file is public and should not contain secrets.
- Hosting should serve it with `Cache-Control: no-cache` (see [`deployment_static_hosting.md`](concael-bridge-ux/ai_spec/deployment_static_hosting.md:1)).

### 2) Define runtime config types

Add an interface (either colocated with the runtime config service or next to [`AppConfig`](concael-bridge-ux/src/app/core/app-config.ts:3)):

- `RuntimeConfig` is a partial overlay of [`AppConfig`](concael-bridge-ux/src/app/core/app-config.ts:3)

Example:

```ts
export type RuntimeConfig = Partial<Pick<AppConfig, 'apiBaseUrl' | 'walletConnectProjectId'>>;
```

### 3) RuntimeConfigService

Create a service responsible for:
- fetching config
- storing config
- providing a `get()` accessor

Proposed file:
- [`concael-bridge-ux/src/app/core/runtime-config.service.ts`](concael-bridge-ux/src/app/core/runtime-config.service.ts:1)

Implementation outline:
- `load(): Promise<void>` fetches `/config.json`
- validate keys and normalize `apiBaseUrl` (trim, remove trailing slashes)
- store the parsed config in a private field / signal

### 4) Bootstrap-time loading using `APP_INITIALIZER`

Update the app providers in [`app.config.ts`](concael-bridge-ux/src/app/app.config.ts:7) to register an initializer.

Because this app uses standalone config, the pattern is:
- add a provider that calls `runtimeConfig.load()` during bootstrap

Example outline:

- Provide `RuntimeConfigService`
- Provide `APP_INITIALIZER` with `multi: true` that returns `() => runtimeConfig.load()`

### 5) Provide `APP_CONFIG` from merged values

Best option: keep [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) but change its factory to:

- import `environment` (build-time defaults)
- inject `RuntimeConfigService`
- return merged config:
  - `{ ...environmentDefaults, ...runtimeOverrides }`

If `RuntimeConfigService` has not loaded (should not happen if initializer works), it returns `{}`.

### 6) Validation rules

`apiBaseUrl`:
- must be a string
- must be a valid URL (or at least start with `http://` or `https://`)
- must not end with `/` (normalize)

`walletConnectProjectId`:
- must be a non-empty string if present

If validation fails:
- log a warning (dev only) and ignore invalid fields

## Acceptance Criteria

1. Deploying with a different [`public/config.json`](concael-bridge-ux/public/config.json:1) changes backend URL **without rebuild**.
2. If config is missing, app still works using build-time defaults.
3. No app code (e.g. [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13)) needs to change beyond consuming the same [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) token.

## Testing Plan

- Local manual:
  1. Create [`public/config.json`](concael-bridge-ux/public/config.json:1) with a known base URL.
  2. Run `ng serve`, verify network calls go to that base URL.
  3. Delete `config.json`, verify fallback to environment defaults.
- Unit:
  - Mock fetch and test `RuntimeConfigService.load()` validation behavior.
- E2E (optional, see [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:1)):
  - verify app loads and can route with mocked backend endpoints.

## Risks / Considerations

- Caching: If `config.json` is cached aggressively, changes won’t apply quickly. Ensure correct cache headers (see [`deployment_static_hosting.md`](concael-bridge-ux/ai_spec/deployment_static_hosting.md:1)).
- CSP: Fetching `/config.json` requires CSP to allow self `connect-src` (see [`security_headers_and_csp.md`](concael-bridge-ux/ai_spec/security_headers_and_csp.md:1)).
- SSR: Not applicable (this is a pure SPA).

## Implementation Steps (Work Breakdown)

1. Add [`public/config.json`](concael-bridge-ux/public/config.json:1) template (dev/test friendly).
2. Add [`runtime-config.service.ts`](concael-bridge-ux/src/app/core/runtime-config.service.ts:1).
3. Add initializer provider(s) in [`app.config.ts`](concael-bridge-ux/src/app/app.config.ts:7).
4. Update [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17) factory to merge environment + runtime.
5. Document deployment caching rules for `config.json` in [`deployment_static_hosting.md`](concael-bridge-ux/ai_spec/deployment_static_hosting.md:1).
# Spec: HTTP Conventions & Error Handling — conceal Bridge UX

## Context / Current State

- HTTP is provided globally via [`provideHttpClient()`](conceal-bridge-ux/src/app/app.config.ts:2).
- There are no HTTP interceptors configured today (same file: [`app.config.ts`](conceal-bridge-ux/src/app/app.config.ts:7)).
- Backend calls are centralized in [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13), which builds URLs using `APP_CONFIG.apiBaseUrl` (see [`#url()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:20)).
- Components handle errors with local `catchError` + UI signals (example in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:489)).
- Swap flows include backend polling loops using RxJS `timer` and `switchMap` (see [`startPolling()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:845)).

## Goal

Define a consistent, best-practice HTTP/error-handling approach for this Angular 21 SPA so that:

- request timeouts and transient failures are handled predictably
- user-facing messages are consistent and actionable
- logging/telemetry can be added without sprinkling `console.error`
- polling behavior does not overload the backend and can be canceled cleanly

## Non-Goals

- Rewriting all API endpoints or changing backend contract.
- Adding full observability stack (Sentry/etc.) in this spec (can be a follow-up).
- Implementing auth (no auth exists today).

## Requirements

1. **Centralized error mapping**:
   - map `HttpErrorResponse` into a small set of user-facing messages + machine-readable categories
2. **Timeout policy**:
   - requests should not hang indefinitely (especially swap init and status calls)
3. **Retry policy**:
   - only for idempotent requests (GET and safe polling calls)
   - do not blindly retry swap-init endpoints
4. **Consistent UI messaging**:
   - follow the existing `pageError` / `statusMessage` pattern in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:445)
5. **Cancelable polling**:
   - ensure polling stops on navigation and on completion (already does `takeUntilDestroyed()` in [`startPolling()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:855))

## Proposed Solution

### A) Introduce an HTTP Interceptor Layer

Add one interceptor for:
- request correlation (optional request ID)
- default headers if needed
- centralized error mapping
- optional timeout enforcement

In Angular 21 standalone, register interceptors using `provideHttpClient(withInterceptors([...]))` in [`app.config.ts`](conceal-bridge-ux/src/app/app.config.ts:7).

### B) Add a small “ApiError” mapping utility

Create a helper that converts an error into:

- `kind`: `'network' | 'timeout' | 'server' | 'client' | 'unauthorized' | 'notFound' | 'unknown'`
- `message`: user-facing string
- `status` (optional)

Proposed location:
- [`conceal-bridge-ux/src/app/core/api-error.ts`](conceal-bridge-ux/src/app/core/api-error.ts:1)

### C) Apply strict retry rules

Rules:
- `GET` requests: retry on network/5xx with exponential backoff (small max attempts)
- `POST` requests:
  - **do not retry** swap-init endpoints (they may not be idempotent)
  - allow retry only for safe “status polling” POST endpoints if backend guarantees idempotency (e.g. [`checkSwapState()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:92) posts a `paymentId` for status; this is likely safe)

### D) Establish timeouts

Define per-endpoint timeouts (examples):
- config endpoints: 10s
- balance endpoints: 10s
- swap init/exec: 20–30s
- polling call: 10s

Implementation choices:
- in interceptor (global default) with overrides via custom header
- or in service methods using RxJS `timeout()` operator

This spec recommends:
- global default timeout in interceptor, and allow overrides for long calls.

### E) UI messaging conventions

Standardize messages:
- “Could not reach server. Check your connection.”
- “The server is taking too long to respond.”
- “Swap initialization failed. Please try again.”
- etc.

Keep using signals in pages and set messages consistently:
- `pageError` for route-blocking errors (e.g. missing config)
- `statusMessage` for step-level status and transient notifications

## Acceptance Criteria

1. A centralized error mapping exists and is used consistently.
2. App has a documented retry/timeout policy by endpoint class.
3. Polling calls are safe, cancelable, and do not leak subscriptions.
4. User-facing errors are consistent across pages.

## Testing Plan

- Unit tests for:
  - api error mapping function (various Http statuses)
  - retry/backoff logic (marble tests if desired)
- Manual tests:
  - offline mode → verify “network” message
  - backend 500 → verify “server” message
  - slow backend → verify timeout message
  - polling continues until success and stops after completion (verify via network tab)

## Risks / Considerations

- Retrying non-idempotent requests can cause double-swaps; the spec explicitly forbids this.
- Backend-specific error payloads may need parsing; ensure mapping handles unknown shapes gracefully.

## Implementation Steps (Work Breakdown)

1. Add [`api-error.ts`](conceal-bridge-ux/src/app/core/api-error.ts:1) (type + mapper).
2. Add interceptor file (e.g. [`api-http.interceptor.ts`](conceal-bridge-ux/src/app/core/api-http.interceptor.ts:1)).
3. Register interceptor(s) in [`app.config.ts`](conceal-bridge-ux/src/app/app.config.ts:7) via `withInterceptors`.
4. Update [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13) and pages as needed to adopt consistent mapping/messages.
5. Add tests for mapping and timeout/retry behavior.
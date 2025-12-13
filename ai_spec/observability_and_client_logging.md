# Spec: Observability & Client Logging — Concael Bridge UX

## Context / Current State

- The app registers browser-level global error listeners via [`provideBrowserGlobalErrorListeners()`](concael-bridge-ux/src/app/app.config.ts:9).
- HTTP calls are performed via Angular `HttpClient` without interceptors (see [`provideHttpClient()`](concael-bridge-ux/src/app/app.config.ts:10) and notes in [`http_and_error_handling.md`](concael-bridge-ux/ai_spec/http_and_error_handling.md:6)).
- Swap flows set user-facing errors locally (signals like [`pageError`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:445) and [`statusMessage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:446)).
- The existing HTTP spec explicitly defers “full observability stack (Sentry/etc.)” as a follow-up (see [`http_and_error_handling.md`](concael-bridge-ux/ai_spec/http_and_error_handling.md:23)).

## Goal

Introduce a consistent, low-friction observability layer so we can:

- capture unexpected runtime errors with context (route, network, wallet connector, etc.)
- log expected failures in a structured way (timeouts, network errors, wallet rejections)
- correlate client events with backend logs (request/correlation ID)
- do all of this **without exposing secrets or sensitive user data**

## Non-Goals

- Implementing a full product analytics solution.
- Capturing or storing seed phrases, private keys, or other secrets (never allowed).
- Building a backend telemetry ingestion pipeline in this spec.
- Retrofitting every legacy call site immediately (migrate incrementally).

## Requirements

1. **Structured logging interface**
   - A single logging API with levels: `debug | info | warn | error`.
   - Logs must support structured metadata (`Record<string, unknown>`).

2. **Redaction & privacy**
   - No secrets or high-risk PII in logs.
   - Default redaction of:
     - WalletConnect project id (see [`walletConnectProjectId`](concael-bridge-ux/src/app/core/app-config.ts:14))
     - full wallet addresses (allow only short form unless user explicitly opts-in)
     - emails (email fields exist in swap init calls; see `email?: string` in [`sendWccxToCcxInit()`](concael-bridge-ux/src/app/core/bridge-api.service.ts:67))

3. **Error capture**
   - Capture unhandled errors and convert them into a safe, structured event.

4. **Correlation**
   - Add a client-generated correlation ID per app load and per request.
   - If an HTTP interceptor is added per [`http_and_error_handling.md`](concael-bridge-ux/ai_spec/http_and_error_handling.md:42), it must add this correlation ID to outgoing requests (header).

5. **Environment toggles**
   - Ability to turn reporting on/off by environment/config.
   - In local dev, default to console output.
   - In production, allow routing to an error-reporting backend (future) or third-party tool (optional).

## Proposed Solution

### A) Add a `LoggerService` abstraction

Create a core service:
- [`concael-bridge-ux/src/app/core/logger.service.ts`](concael-bridge-ux/src/app/core/logger.service.ts:1)

Responsibilities:
- Provide methods `debug()`, `info()`, `warn()`, `error()`.
- Attach base context:
  - app version (from build-time environment if available)
  - route (Angular Router current URL)
  - network key (if known)
  - wallet connector id (see [`WalletConnectorId`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:23))
- Redact known sensitive values.

### B) Add an `ErrorReporter` adapter (optional)

A small interface that can be implemented by:
- console reporter (default)
- Sentry (optional future)
- custom backend endpoint (optional future)

Proposed location:
- [`concael-bridge-ux/src/app/core/error-reporter.ts`](concael-bridge-ux/src/app/core/error-reporter.ts:1)

### C) Wire global error capture into the logger

Leverage the fact we already register browser listeners via [`provideBrowserGlobalErrorListeners()`](concael-bridge-ux/src/app/app.config.ts:9):

- Add a global handler that forwards uncaught errors to `LoggerService.error()` and `ErrorReporter`.

Notes:
- User-facing UX should still use the per-page patterns (e.g. [`statusMessage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:446)). Logging is not a replacement for UX.

### D) Correlation ID strategy

- Generate an `appSessionId` on first load and store in memory only (not localStorage).
- Generate a `requestId` per HTTP request.

If/when HTTP interceptors are implemented (per [`http_and_error_handling.md`](concael-bridge-ux/ai_spec/http_and_error_handling.md:42)):
- Add header: `X-Request-Id: <uuid>` and `X-Session-Id: <uuid>` (names can be adjusted to backend conventions).

### E) Event taxonomy (recommendation)

Standardize event names so logs are searchable:

- `wallet.connect.start|success|error`
- `wallet.disconnect.start|success|error`
- `wallet.ensureChain.start|success|error` (see [`ensureChain()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:205))
- `swap.ccxToEvm.start|error|completed`
- `swap.evmToCcx.start|error|completed`
- `api.request.error` (include endpoint, status, mapped category per error mapping spec)

## Acceptance Criteria

1. A central logging API exists and is used for new work.
2. Unhandled errors are captured and logged with safe context.
3. HTTP calls include correlation IDs once interceptor work is implemented.
4. No logs contain secrets or raw wallet keys/seed phrases (audit checklist documented).

## Testing Plan

- Unit tests:
  - redaction logic (wallet address shortening, email removal)
  - correlation ID generation format
- Manual tests:
  - simulate runtime error and confirm it logs in dev console without crashing the app
  - verify no wallet prompts triggered by logging layer
- Security review:
  - grep output logs in dev to confirm no accidental full addresses/emails

## Risks / Considerations

- Over-logging can leak sensitive context; default to minimal + redacted.
- Third-party reporting tools may conflict with CSP; coordinate with [`security_headers_and_csp.md`](concael-bridge-ux/ai_spec/security_headers_and_csp.md:41) when enabled.
- Logging must not introduce new runtime errors or block UI (log operations must be fire-and-forget).

## Implementation Steps (Work Breakdown)

1. Add `LoggerService` with redaction and base context.
2. Add `ErrorReporter` interface + console implementation.
3. Hook global error capture into logger/reporter.
4. (Optional) Add Sentry or backend reporter, guarded by environment flags.
5. Integrate correlation IDs into HTTP interceptor work described in [`http_and_error_handling.md`](concael-bridge-ux/ai_spec/http_and_error_handling.md:42).
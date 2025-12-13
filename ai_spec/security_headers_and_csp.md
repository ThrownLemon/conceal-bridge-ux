# Spec: Security Headers & Content Security Policy (CSP) — Concael Bridge UX

## Context / Current State

- This is a static Angular SPA (standalone bootstrapped via [`bootstrapApplication()`](concael-bridge-ux/src/main.ts:1)).
- The app calls a backend API via a configurable base URL in [`APP_CONFIG.apiBaseUrl`](concael-bridge-ux/src/app/core/app-config.ts:8), consumed by [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:20).
- The app integrates with EVM wallets (injected providers + WalletConnect) via [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:33).
- The UI loads local static assets from [`public/`](concael-bridge-ux/public:1) (images for networks/wallets referenced by [`WalletButtonComponent`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:256)).
- The home page indicates it loads chain metadata from a public API (see note in [`HomePage`](concael-bridge-ux/src/app/pages/home/home.page.ts:141)), so there may be external `connect-src` and/or external `img-src` requirements.

## Goal

Define a **safe default set of security headers** (especially CSP) for deployment of `concael-bridge-ux` that:

- reduces XSS and injection risk
- allows necessary connections for:
  - the bridge backend
  - WalletConnect (if enabled)
  - any chain metadata API the app uses
- remains compatible with Angular production builds (hashed asset filenames via `outputHashing` in [`angular.json`](concael-bridge-ux/angular.json:48))

## Non-Goals

- Perfect CSP on day 1 (CSP is iterative).
- Blocking all external connections (WalletConnect requires external connectivity).
- Managing security headers in-app (this should be done at the hosting/CDN layer).

## Requirements

1. Provide recommended headers for static hosting (Nginx, S3/CloudFront, Netlify, etc.).
2. Provide a baseline CSP with clear extension points for:
   - backend API host(s) from [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:3)
   - chain metadata host(s) (as used by [`EvmChainMetadataService`](concael-bridge-ux/src/app/core/evm-chain-metadata.service.ts:1))
   - WalletConnect endpoints when [`walletConnectProjectId`](concael-bridge-ux/src/app/core/app-config.ts:14) is enabled
3. Document how to validate CSP correctness (report-only rollout).

## Recommended Security Headers

> Apply these at the hosting layer for all responses, unless otherwise noted.

### 1) Content-Security-Policy (CSP)

Start with **Report-Only** first, then enforce once verified.

**Baseline (Report-Only example):**

```
Content-Security-Policy-Report-Only:
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self';
  img-src 'self' data: https:;
  font-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  script-src 'self';
  connect-src 'self' https:;
  upgrade-insecure-requests;
  report-to csp-endpoint;
```

Notes:
- `style-src 'unsafe-inline'` is often needed if any inline styles are emitted by tooling or a CSS-in-JS dependency. Tighten later if feasible.
- `connect-src https:` is permissive to reduce breakage during rollout; tighten to explicit hosts once the allowlist is known (see “Allowlist Derivation” below).

**Enforced CSP (target state):**

Once you identify exact hosts, tighten:

- `img-src`: allow only required external image hosts (ideally none; prefer local assets in [`public/`](concael-bridge-ux/public:1))
- `connect-src`: allow only:
  - bridge backend base domain(s) used by [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:20)
  - chain metadata API domain(s) used by [`EvmChainMetadataService`](concael-bridge-ux/src/app/core/evm-chain-metadata.service.ts:1)
  - WalletConnect endpoints (if WalletConnect is enabled)

Example tightened form (placeholders for actual domains):

```
Content-Security-Policy:
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self';
  img-src 'self' data:;
  font-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  script-src 'self';
  connect-src 'self'
    https://bridge.conceal.network
    https://<CHAIN_METADATA_API_HOST>
    https://<WALLETCONNECT_HOSTS>;
  upgrade-insecure-requests;
```

#### WalletConnect CSP considerations

If using WalletConnect provider initialization in [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:298), the app may need `connect-src` permissions to WalletConnect infrastructure.

Because WalletConnect endpoints can evolve, prefer:
- allowlist the minimum set from WalletConnect docs
- verify via CSP report logs and browser network logs

### 2) Strict-Transport-Security (HSTS)

Only if you serve HTTPS (production should):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

(Do not enable `preload` until you’re sure every subdomain supports HTTPS.)

### 3) X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

### 4) Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

### 5) Permissions-Policy

Start restrictive:

```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

Adjust only if needed.

### 6) Cross-Origin policies (optional, be careful)

- If you are not using SharedArrayBuffer or cross-origin isolation, avoid breaking changes:
  - `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` can break third-party integrations.
- Recommended safe baseline:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

Validate with WalletConnect flows before enforcing broadly.

## Allowlist Derivation (How to get the right CSP)

1. Deploy with `Content-Security-Policy-Report-Only` first.
2. Use your browser devtools network panel while exercising:
   - home page load + chain metadata load (see note in [`HomePage`](concael-bridge-ux/src/app/pages/home/home.page.ts:141))
   - swap flows calling backend via [`BridgeApiService`](concael-bridge-ux/src/app/core/bridge-api.service.ts:13)
   - WalletConnect connect flow via [`WalletButtonComponent`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:286)
3. Capture all blocked/attempted `connect-src`, `img-src`, and `frame-src`.
4. Tighten `connect-src` and `img-src` to explicit hosts only.

## Runtime Config Interaction

If you adopt runtime config per [`runtime_config.md`](concael-bridge-ux/ai_spec/runtime_config.md:1), ensure CSP allows:
- fetching `/config.json` from self:
  - keep `connect-src 'self'`
- any configured backend host(s) still fit within the allowlist

## Acceptance Criteria

1. App works under `CSP-Report-Only` with no critical violations during normal flows.
2. Tightened CSP can be enforced without breaking:
   - backend calls
   - wallet flows
   - chain metadata loads
3. All recommended non-CSP headers are applied in production hosting.

## Testing Plan

- Manual:
  - Verify no console CSP errors under Report-Only.
  - Confirm swap flow works end-to-end with test backend.
  - Confirm WalletConnect works when enabled.
- Automated:
  - E2E suite (see [`e2e_testing.md`](concael-bridge-ux/ai_spec/e2e_testing.md:1)) should run with headers enabled in a staging environment if feasible.

## Implementation Steps (Work Breakdown)

1. Add `CSP-Report-Only` + reporting endpoint in hosting/CDN.
2. Exercise main flows; collect reported violations.
3. Create allowlist; switch to enforced `Content-Security-Policy`.
4. Add remaining security headers.
5. Document final header values in the deployment spec [`deployment_static_hosting.md`](concael-bridge-ux/ai_spec/deployment_static_hosting.md:1).
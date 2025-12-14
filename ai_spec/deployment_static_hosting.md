# Spec: Deployment to Static Hosting — conceal Bridge UX (Angular 21)

## Context / Current State

- The project builds an Angular SPA using [`@angular/build:application`](conceal-bridge-ux/angular.json:17).
- Production build is the default configuration (`defaultConfiguration: "production"` in [`angular.json`](conceal-bridge-ux/angular.json:56)).
- Production build enables `outputHashing: "all"` (see [`angular.json`](conceal-bridge-ux/angular.json:48)), which is good for long-term caching.
- Static assets are served from [`public/`](conceal-bridge-ux/public:1) and included as build assets via [`assets.input = "public"`](conceal-bridge-ux/angular.json:24).
- No deployment target is currently specified (noted in [`build_guide.md`](conceal-bridge-ux/docs/build_guide.md:273)).

## Goal

Define best-practice deployment requirements for hosting the built SPA on a static host (S3/CloudFront, Netlify, Vercel static, Nginx, etc.) including:

- build output expectations
- SPA routing rewrites
- caching policy (hashed assets vs HTML)
- environment/runtime configuration strategy compatibility
- security header integration

## Non-Goals

- Selecting a single provider.
- Providing full IaC for every platform (platform-specific snippets are optional appendices).

## Requirements

1. Host must serve the SPA correctly for client-side routing:
   - routes in [`app.routes.ts`](conceal-bridge-ux/src/app/app.routes.ts:3) must work on full page refresh
2. Cache strategy must:
   - aggressively cache hashed static assets
   - avoid caching `index.html` too aggressively
3. Deployment must be compatible with:
   - build-time env files (see [`environment_configuration.md`](conceal-bridge-ux/ai_spec/environment_configuration.md:1))
   - optional runtime config file (see [`runtime_config.md`](conceal-bridge-ux/ai_spec/runtime_config.md:1))
4. Security headers must be applied at the edge (see [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1))

## Build Output

After `npm run build` (script in [`package.json`](conceal-bridge-ux/package.json:7)):

- output folder: `conceal-bridge-ux/dist/conceal-bridge-ux/` (default Angular dist naming)
- contains:
  - `index.html`
  - hashed JS/CSS bundles (because of `outputHashing: "all"`)
  - copied assets from [`public/`](conceal-bridge-ux/public:1) (e.g. `/images/...`)

## SPA Routing Requirements (Rewrites)

Because this is an SPA using Angular Router (see [`provideRouter(routes)`](conceal-bridge-ux/src/app/app.config.ts:11)), hosting must rewrite unknown paths to `index.html`.

**Generic rule:**

- If request path is not a real file, serve `/index.html`.

Examples:

- `/swap/ccx-to-evm/eth` should serve `index.html` and let Angular route it.
- Legacy redirects like `/eth` are handled by Angular router config in [`app.routes.ts`](conceal-bridge-ux/src/app/app.routes.ts:21).

## Caching Policy (Best Practice)

### 1) Hashed assets (JS/CSS/images built with hashes)

For files like:

- `/*.js`
- `/*.css`
- hashed chunks under the build output

Set:

- `Cache-Control: public, max-age=31536000, immutable`

Rationale:

- hashes change when content changes.

### 2) `index.html`

Set:

- `Cache-Control: no-cache`

Rationale:

- ensures clients fetch latest HTML that references new bundle hashes.

### 3) Runtime config file (if adopted)

If you implement [`runtime_config.md`](conceal-bridge-ux/ai_spec/runtime_config.md:1) and serve:

- [`/config.json`](conceal-bridge-ux/public/config.json:1)

Set:

- `Cache-Control: no-cache`

So ops can update config without redeploying assets.

## Base Href / Subpath Hosting

If hosting under a subpath (e.g. `https://example.com/bridge/`), build with:

- `ng build --base-href /bridge/`

Also configure the host rewrite rules to rewrite under that subpath.

## Environment Strategy Compatibility

### Build-time environments

When environment files are introduced (per [`environment_configuration.md`](conceal-bridge-ux/ai_spec/environment_configuration.md:1)), builds produce different bundles per env.

Recommended:

- production bundle deployed to production host
- development/testing bundle deployed to testing host

### Runtime config

If you deploy the same bundle to multiple envs, adopt runtime config (per [`runtime_config.md`](conceal-bridge-ux/ai_spec/runtime_config.md:1)) and vary only `config.json`.

## Security Headers Integration

Apply at the CDN/host level:

- CSP + other headers in [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1)

At minimum:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (start report-only)

## Observability / Error Pages (Optional)

- Provide a static `404` that still serves `index.html` for SPA routes (host-specific).
- Consider a basic “maintenance mode” page for backend outages.

## Acceptance Criteria

1. Refreshing a deep route (e.g. `/swap/ccx-to-evm/eth`) loads the app successfully.
2. Hashed assets are long-cacheable, `index.html` is not.
3. If runtime config is used, `config.json` updates take effect without rebuild and without cache delays.
4. Security headers are applied without breaking required network connections (backend, WalletConnect, chain metadata).

## Implementation Steps (Work Breakdown)

1. Choose hosting platform.
2. Implement rewrite rule to `index.html`.
3. Implement cache headers:
   - immutable for hashed assets
   - no-cache for `index.html`
   - no-cache for `config.json` (if used)
4. Apply headers from [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1).
5. Validate with smoke tests and E2E where possible (see [`e2e_testing.md`](conceal-bridge-ux/ai_spec/e2e_testing.md:1)).

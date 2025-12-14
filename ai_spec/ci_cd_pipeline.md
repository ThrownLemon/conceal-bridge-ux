# Spec: CI/CD Pipeline — conceal Bridge UX (Angular 21)

## Context / Current State

- No CI configuration exists in this project folder (the build guide notes this gap in [`build_guide.md`](conceal-bridge-ux/docs/build_guide.md:277)).
- The project has these key scripts in [`package.json`](conceal-bridge-ux/package.json:4):
  - `start`: `ng serve`
  - `build`: `ng build` (defaults to production config per [`angular.json`](conceal-bridge-ux/angular.json:56))
  - `test`: `ng test`
- Package manager is pinned via `"packageManager": "npm@11.7.0"` in [`package.json`](conceal-bridge-ux/package.json:24).
- Angular build is configured via the application builder in [`angular.json`](conceal-bridge-ux/angular.json:17).

## Goal

Define a CI/CD pipeline that:

- reliably installs deps, runs tests, runs lint (after lint spec is implemented), and builds
- produces a versioned build artifact suitable for static hosting
- optionally deploys to hosting (platform-specific, but the pipeline should define interfaces)
- supports multiple environments (production vs testing) aligned with the environment strategy spec in [`environment_configuration.md`](conceal-bridge-ux/ai_spec/environment_configuration.md:1)

## Non-Goals

- Choosing a specific hosting provider (unless requested).
- Building a monorepo pipeline for other folders (this spec is for `conceal-bridge-ux` only).

## Requirements

1. CI must be deterministic:
   - uses pinned Node/npm versions
   - uses `npm ci` (not `npm install`)
2. CI must run:
   - tests: `npm run test` (from [`package.json`](conceal-bridge-ux/package.json:9))
   - lint: `npm run lint` (to be added in [`linting_and_formatting.md`](conceal-bridge-ux/ai_spec/linting_and_formatting.md:1))
   - build: `npm run build`
3. Build output should be captured as an artifact:
   - `dist/conceal-bridge-ux` (default Angular dist folder, based on project name and [`angular.json`](conceal-bridge-ux/angular.json:9))
4. Deployment should be environment-aware:
   - production deploy on `main` (or a tagged release)
   - testing/staging deploy on `develop` or manually triggered

## Proposed CI Tooling

This spec is CI-tool agnostic. Recommended implementations:

- GitHub Actions
- GitLab CI
- Jenkins

The pipeline stages remain the same.

## Pipeline Stages

### Stage 1 — Checkout + Toolchain Setup

**Inputs:**

- Node version (pin using `.nvmrc` or CI config)
- npm version pinned to `"npm@11.7.0"` in [`package.json`](conceal-bridge-ux/package.json:24)

**Actions:**

1. Checkout repo
2. Install Node (recommended: LTS compatible with npm 11.x; pin explicitly)
3. Ensure npm version:
   - either rely on Corepack (recommended) or `npm i -g npm@11.7.0`

### Stage 2 — Install Dependencies

Run from the project directory:

- `cd conceal-bridge-ux && npm ci`

Rationale:

- `npm ci` ensures lockfile fidelity and reproducible builds (lockfile exists at [`package-lock.json`](conceal-bridge-ux/package-lock.json:1)).

### Stage 3 — Static Checks (Lint + Type Checks)

After implementing lint tooling per [`linting_and_formatting.md`](conceal-bridge-ux/ai_spec/linting_and_formatting.md:1):

- `npm run lint`

Optional additional checks:

- `tsc -p tsconfig.app.json --noEmit` (if you want a separate explicit typecheck step)
  - [`tsconfig.app.json`](conceal-bridge-ux/tsconfig.app.json:1)

### Stage 4 — Unit Tests

Run:

- `npm run test`

Notes:

- This uses Angular unit test builder in [`angular.json`](conceal-bridge-ux/angular.json:70).
- Vitest is present as a dev dependency in [`package.json`](conceal-bridge-ux/package.json:48), and types are configured in [`tsconfig.spec.json`](conceal-bridge-ux/tsconfig.spec.json:7).

CI expectations:

- run headless (ensure test builder is configured accordingly if needed)
- publish test results if the CI tool supports it (JUnit or similar)

### Stage 5 — Build

Run:

- `npm run build`

Important detail:

- Default build configuration is production (`defaultConfiguration` is `"production"` in [`angular.json`](conceal-bridge-ux/angular.json:56)).

If supporting a testing build output (optional):

- `ng build --configuration development` or a dedicated `testing` config (see [`environment_configuration.md`](conceal-bridge-ux/ai_spec/environment_configuration.md:1)).

### Stage 6 — Artifact Packaging

Archive:

- `conceal-bridge-ux/dist/` or specifically `conceal-bridge-ux/dist/conceal-bridge-ux/`

Recommended artifact naming:

- include commit SHA and environment:
  - `conceal-bridge-ux-${GIT_SHA}.zip`

### Stage 7 — Deployment (Optional, Target-Specific)

This stage depends on hosting provider. The spec defines an interface:

**Inputs:**

- artifact path (dist)
- environment name (`production`, `testing`, `staging`)
- target base URL / domain
- SPA routing support (rewrite rules)
- caching rules (hashed assets vs index)

The details are specified in the deployment spec:

- [`deployment_static_hosting.md`](conceal-bridge-ux/ai_spec/deployment_static_hosting.md:1)

## Environment Strategy

CI must align with the environment config approach:

- build-time env via file replacements (recommended in [`environment_configuration.md`](conceal-bridge-ux/ai_spec/environment_configuration.md:1))
- optionally runtime config (if adopted) per [`runtime_config.md`](conceal-bridge-ux/ai_spec/runtime_config.md:1)

## Branch / Trigger Strategy (Recommended)

- `main`:
  - run CI on PR + push
  - deploy to production on merge to `main` (or on tag `v*`)
- `develop` (optional):
  - deploy to testing/staging
- manual workflow dispatch:
  - allow choosing environment + commit/tag

## Security Considerations

- Do not store secrets in environment files (they are bundled).
- Use CI secrets store for deploy credentials.
- Add security headers / CSP in hosting layer per [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1).

## Acceptance Criteria

1. CI can run on a clean machine and produce a build artifact.
2. CI fails on lint/test/build failures.
3. CI produces deterministic builds using [`package-lock.json`](conceal-bridge-ux/package-lock.json:1) and `npm ci`.
4. Deployment (if enabled) updates hosting with SPA-compatible routing and correct cache headers.

## Implementation Steps (Work Breakdown)

1. Choose CI system (GitHub Actions recommended).
2. Add CI config file(s) under the repo (location depends on CI system).
3. Implement lint tooling first (see [`linting_and_formatting.md`](conceal-bridge-ux/ai_spec/linting_and_formatting.md:1)).
4. Add environment configuration (see [`environment_configuration.md`](conceal-bridge-ux/ai_spec/environment_configuration.md:1)).
5. Add artifact upload step.
6. Add deployment steps + hosting configuration.

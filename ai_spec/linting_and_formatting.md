# Spec: Linting & Formatting (Angular 21) — Concael Bridge UX

## Context / Current State

- The project has **no lint script** today (see [`scripts`](concael-bridge-ux/package.json:4)).
- Formatting is partially defined via a `prettier` config embedded in [`package.json`](concael-bridge-ux/package.json:11).
- Codebase is strict TypeScript + strict templates (see [`compilerOptions.strict`](concael-bridge-ux/tsconfig.json:6) and [`angularCompilerOptions.strictTemplates`](concael-bridge-ux/tsconfig.json:22)).
- Angular project is standalone, configured via [`angular.json`](concael-bridge-ux/angular.json:1) and bootstrapped with [`bootstrapApplication()`](concael-bridge-ux/src/main.ts:1).

## Goal

Add a **best-practice linting + formatting** workflow for an Angular 21 project that:

- enforces code quality consistently in local dev and CI
- integrates with the existing Prettier settings
- supports TypeScript + Angular templates
- remains compatible with standalone components and signals-heavy code

## Non-Goals

- Reformatting the entire codebase immediately (can be a follow-up task).
- Adding pre-commit hooks (optional enhancement).

## Requirements

1. Add `npm run lint` for developers and CI.
2. Lint TypeScript and Angular templates.
3. Avoid “format wars” between ESLint and Prettier (define clear responsibility boundaries).
4. Keep configuration compatible with Angular 21 toolchain.

## Proposed Solution (ESLint + @angular-eslint + Prettier)

### High-level approach

- Use **ESLint** for:
  - correctness and best practices
  - Angular-specific rules
  - TypeScript-specific rules
- Use **Prettier** for:
  - formatting (quotes, wrapping, etc.)
- Ensure ESLint does not fight Prettier:
  - use `eslint-config-prettier` to disable formatting-related ESLint rules.

## Detailed Design

### 1) Dependencies to add

Add these dev dependencies (versions should be chosen to match Angular 21 and TS 5.9):

- `eslint`
- `@angular-eslint/eslint-plugin`
- `@angular-eslint/eslint-plugin-template`
- `@angular-eslint/template-parser`
- `@typescript-eslint/parser`
- `@typescript-eslint/eslint-plugin`
- `eslint-config-prettier`

Optional (recommended if you want a `lint` target in Angular CLI):
- `@angular-eslint/builder`

### 2) ESLint configuration file

Prefer the modern “flat config” file:

- [`concael-bridge-ux/eslint.config.js`](concael-bridge-ux/eslint.config.js:1)

Config must:
- lint `*.ts` using TypeScript parser and `@typescript-eslint`
- lint inline templates in TS where possible (Angular components)
- lint `*.html` templates using `@angular-eslint/template-parser`

### 3) Scripts to add

In [`scripts`](concael-bridge-ux/package.json:4), add:

- `lint`: run eslint over the project
- `lint:fix`: run eslint with `--fix`
- (optional) `format`: run prettier on supported file types
- (optional) `format:check`: check formatting in CI without writing files

Example (spec-level, not final):

- `lint`: `eslint .`
- `lint:fix`: `eslint . --fix`

### 4) (Optional) Add Angular “lint” target

Add a `lint` target under the Angular project in [`angular.json`](concael-bridge-ux/angular.json:15) if you want `ng lint` parity:

- Add `architect.lint` using `@angular-eslint/builder:lint` pointing to `src/**/*.ts` and `src/**/*.html`.

This enables:
- [`ng lint`](concael-bridge-ux/package.json:5) (via `ng` binary) to behave as expected.

### 5) Rule set (recommended baseline)

TypeScript rules:
- no unused vars
- no floating promises (careful: the project uses `async` flows in [`SwapPage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:598))
- consistent type imports where useful

Angular rules:
- consistent component selectors (prefix `app` is set in [`angular.json`](concael-bridge-ux/angular.json:14))
- template accessibility linting where feasible
- discourage `any`

Project-specific rules:
- allow `void` for intentionally ignored promises (pattern used in [`void this.wallet.hydrate()`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:478))

Prettier integration:
- disable ESLint formatting rules with `eslint-config-prettier`
- keep formatting controlled by the Prettier config in [`package.json`](concael-bridge-ux/package.json:11)

## Acceptance Criteria

1. `npm run lint` exists and runs successfully on the repo.
2. `npm run lint:fix` exists and can fix safe issues.
3. `npm run format` / `npm run format:check` exist if adopted.
4. CI (see future spec [`ci_cd_pipeline.md`](concael-bridge-ux/ai_spec/ci_cd_pipeline.md:1)) runs lint as a required step.

## Testing Plan

- Run lint locally against:
  - TS files under [`src/app/`](concael-bridge-ux/src/app:1)
  - HTML templates (inline templates inside TS and any standalone `.html` files such as [`src/app/app.html`](concael-bridge-ux/src/app/app.html:1))
- Verify no conflicts with Prettier output.

## Risks / Considerations

- Angular 21 + TS 5.9 means dependency versions must be compatible; keep the stack aligned to avoid parser/plugin mismatches.
- If the project adopts Vitest patterns more deeply, ensure test files remain lintable (Vitest types are set in [`tsconfig.spec.json`](concael-bridge-ux/tsconfig.spec.json:7)).

## Implementation Steps (Work Breakdown)

1. Add ESLint and plugins to dev dependencies in [`package.json`](concael-bridge-ux/package.json:38).
2. Create [`eslint.config.js`](concael-bridge-ux/eslint.config.js:1).
3. Add scripts in [`package.json`](concael-bridge-ux/package.json:4).
4. (Optional) Add `architect.lint` to [`angular.json`](concael-bridge-ux/angular.json:15).
5. Run `npm run lint` and fix initial findings.
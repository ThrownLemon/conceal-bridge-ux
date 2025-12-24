# Angular Best Practices

This document targets **Angular v21** and is intended to guide both humans and AI code generation.

**Normative language**:

- **MUST / MUST NOT**: hard requirements
- **SHOULD / SHOULD NOT**: strong recommendations
- **MAY**: optional guidance

---

## Standalone-first (NgModules are legacy)

- MUST build new code using **standalone components / directives / pipes**.
- MUST NOT set `standalone: true` in Angular decorators (standalone is the default).
- MAY use `standalone: false` only when integrating legacy code that still depends on NgModules.
- SHOULD prefer `imports: [...]` in the `@Component` decorator over `NgModule` declarations for composition.
- SHOULD keep each component’s `imports` list minimal and precise.

## Signals, change detection & reactivity

- MUST set `changeDetection: ChangeDetectionStrategy.OnPush` for app components unless there is a concrete reason not to.
- SHOULD treat **signals** as the default choice for local UI state.
- SHOULD keep derived state in `computed()` and side-effects in `effect()`.
- MUST keep `computed()` pure (no HTTP calls, no navigation, no DOM writes).
- SHOULD keep `effect()` small and focused; avoid “god effects”.
- MUST keep state transitions predictable:
  - MUST NOT use `mutate()` on signals.
  - MUST use `set()` or `update()`.

## RxJS interop & subscription hygiene

- SHOULD use the `async` pipe for Observables in templates.
- SHOULD convert Observables to signals at the boundary when it improves clarity (for example, a view-model signal).
- MUST NOT leave manual subscriptions unowned:
  - If you must subscribe imperatively, ensure unsubscription is tied to component destruction (for example via Angular-provided lifecycle helpers).

## Dependency Injection

- SHOULD prefer the `inject()` function over constructor injection (especially for standalone and functional patterns).
- SHOULD keep services focused and “flat” (avoid long service dependency chains).
- MUST keep side-effects out of service constructors; prefer explicit `init()`/`start()` methods or effects in a higher-level orchestrator.
- MUST avoid reaching for global objects directly (`window`, `document`, `localStorage`) in services/components. Prefer injected abstractions where possible.

## Routing, lazy loading & code splitting

- MUST lazy-load feature routes.
  - Prefer route-level lazy-loading with `loadComponent` / `loadChildren`.
- SHOULD use template-level deferred loading via `@defer` for expensive UI that is not immediately needed.
  - Only **standalone** dependencies can be deferred; keep deferred dependencies standalone.
  - MUST include a good loading experience (use `@placeholder` / `@loading` / `@error` as appropriate).

## Templates

- MUST prefer native control flow:
  - Use `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- MUST keep templates simple:
  - MUST NOT put complex logic in templates.
  - MUST NOT call non-trivial functions from templates (compute in the component instead).
  - MUST NOT write arrow functions in templates (not supported).
- SHOULD use `@for` with a stable `track` expression for performance.
- SHOULD avoid creating new object/array literals in bindings (move to signals/computed/constants).
- MUST NOT assume runtime-only globals in templates (compute values in TS and bind the result).

## Inputs / Outputs

- MUST use `input()` and `output()` instead of `@Input()` and `@Output()`.
- SHOULD keep inputs immutable and treat them as read-only.
- SHOULD validate/coerce inputs at the boundary (for example, optional vs required inputs).
- SHOULD expose semantic outputs (for example, `confirmed`, `cancelled`) instead of leaking DOM events.

## Host bindings/listeners

- MUST NOT use `@HostBinding()` / `@HostListener()`.
- MUST place host bindings/listeners inside the `host` object of `@Component` / `@Directive`.

## Images & assets

- MUST use `NgOptimizedImage` for static images.
- MUST remember: `NgOptimizedImage` does not work for inline base64 images.
- SHOULD set explicit `width`/`height` for images to avoid layout shift.
- SHOULD provide meaningful `alt` text (or `alt=""` for decorative images).

## Components

- MUST keep components small and focused on a single responsibility.
- SHOULD prefer “smart/container” components for orchestration and “dumb/presentational” components for UI.
- SHOULD prefer inline templates for small components.
- When using external templates/styles:
  - MUST use paths relative to the component TS file.
- MUST NOT use `ngClass` (use `class` bindings instead).
- MUST NOT use `ngStyle` (use `style` bindings instead).
- SHOULD avoid deep component trees that exist only to pass data through; consider composition and view-model signals.

## Forms (Angular v21)

- SHOULD prefer **Signal Forms** for new form-heavy features where appropriate (Angular v21 introduces a signal-based forms model).
- Otherwise, SHOULD prefer Reactive Forms over template-driven forms.
- MUST ensure accessible form semantics:
  - Every input MUST have an associated label.
  - Errors MUST be announced when appropriate (for example, via `aria-describedby` and a live region for form-level errors).
- SHOULD keep form validation logic in TS, not templates.
- SHOULD model form state as explicit UI states (idle / editing / submitting / success / error).

## SSR, hydration & browser-only APIs

- If the app uses SSR/hydration:
  - MUST NOT access browser-only APIs during server rendering (for example, `window`, `document`, media queries).
  - SHOULD isolate browser-only logic behind guards and run it only in the browser.
  - SHOULD keep rendering deterministic (avoid time-based values like “now” unless passed in as data).

## Performance & bundle size

- MUST lazy-load routes and SHOULD use `@defer` for non-critical UI.
- SHOULD keep dependencies small; avoid importing large libraries for small tasks.
- SHOULD avoid unnecessary change detection triggers by keeping state local and using signals/computed.
- SHOULD prefer CSS for animations; avoid layout thrashing (measure → mutate cycles).

---

## State Management

- MUST use signals for local component state.
- MUST use `computed()` for derived state.
- MUST keep state transformations pure and predictable.
- MUST NOT use `mutate()` on signals; use `update()` or `set()` instead.
- SHOULD choose the simplest state model that works:
  - Component-local signals first
  - Shared store/service (signals-based) next
  - RxJS streams for event-like or multi-cast async flows (pair with `async` pipe or boundary conversion)
- SHOULD represent async state explicitly (loading/success/empty/error) rather than “null means unknown”.

---

## Services

- MUST design services around a single responsibility.
- SHOULD prefer `providedIn: 'root'` for singleton services.
- SHOULD use the `inject()` function instead of constructor injection.
- SHOULD keep services framework-agnostic where practical (pure logic in plain TS helpers; framework integration at the edges).
- MUST handle errors explicitly (typed error results, consistent mapping to UI state).
- SHOULD centralize cross-cutting concerns (logging, metrics, retries, auth headers) using interceptors/providers rather than scattering logic.

---

## Accessibility Requirements

- MUST pass all AXE checks.
- MUST follow WCAG AA minimums, including:
  - focus management
  - color contrast
  - correct semantics (native elements first)
  - appropriate ARIA attributes (only when needed)
- SHOULD avoid ARIA where native semantics suffice (“no ARIA is better than bad ARIA”).
- MUST ensure interactive elements are reachable and operable via keyboard:
  - visible focus styles
  - no keyboard traps
- SHOULD ensure dynamic content updates are announced when needed (for example, toast notifications and form errors).
- SHOULD consider Angular’s accessibility tooling/packages (Angular v21 mentions updates to the Angular Aria package) for complex widgets.

---

## TypeScript Best Practices

- MUST use strict type checking (`strict: true`) and strict templates where possible.
- SHOULD prefer type inference when the type is obvious.
- MUST avoid the `any` type; use `unknown` when type is uncertain and narrow it.
- SHOULD define explicit return types for public APIs and exported functions.
- SHOULD use discriminated unions for state machines (loading/success/error).
- MUST not ignore Promise rejections; always `await` or handle errors.
- SHOULD avoid `as` type assertions unless narrowing is proven safe.

---

## Testing Best Practices

- SHOULD test components as users interact with them (DOM queries, accessible roles/names).
- SHOULD keep unit tests deterministic (no time/randomness without control).
- MUST test accessibility behaviors:
  - focus moves correctly for dialogs/overlays
  - form errors are perceivable
  - keyboard interaction works
- SHOULD cover state transitions (loading → success/error) and edge cases (empty, partial, offline).

---

## Quick “Do / Don’t” Summary

- DO: standalone components (default), signals + `computed()`, route lazy-loading, `@defer` for non-critical UI.
- DO: `input()`/`output()`, `inject()`, `ChangeDetectionStrategy.OnPush`, `NgOptimizedImage`.
- DO: keep templates simple and push logic into TS/view-model signals.
- DON’T: `standalone: true`, NgModules for new code, `@HostBinding`/`@HostListener`, `ngClass`/`ngStyle`, complex template logic.

---

## Related docs/specs in this repo

- Project-specific build + architecture notes: [`build_guide.md`](conceal-bridge-ux/docs/build_guide.md:1)
- UI conventions (Tailwind v4, dark-first, brand rules): [`style_guide.md`](conceal-bridge-ux/docs/style_guide.md:1)
- Testing conventions (Angular TestBed + Web3 mocking): [`testing.md`](conceal-bridge-ux/docs/testing.md:1)
- Error handling conventions used across the app: [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:1)
- Security constraints relevant to Angular/browser code: [`security.md`](conceal-bridge-ux/docs/security.md:1)

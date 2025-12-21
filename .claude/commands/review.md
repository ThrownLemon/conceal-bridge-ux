---
description: Comprehensive code review checklist and process for Angular v21+ projects. Use this to review PRs or local changes.
---

# Code Review Workflow

> Purpose: Ensure code quality, consistency, and adherence to Angular v21+ best practices before merging or completing a task.

## 1. Architectural & Structural Review

- [ ] **Standalone Components**: Verify that new components are standalone (default). Ensure `standalone: true` is NOT explicitly set (redundant in v19+).
- [ ] **Path Aliases**: Check imports. Are they using absolute paths / path aliases (e.g., `@app/...`) where possible instead of deep relative paths (`../../`)?
- [ ] **File Location**: Is the code in the correct feature directory? Does it follow the flat structure?
- [ ] **Barrel Files**: If using `index.ts`, ensure it doesn't create circular dependencies.

## 2. Angular Best Practices (v21+)

- [ ] **Change Detection**: Ensure `changeDetection: ChangeDetectionStrategy.OnPush` is set in components.
- [ ] **Signals**:
  - [ ] Are `signal()`, `computed()`, and `effect()` used for state?
  - [ ] Are `input()` and `output()` used instead of `@Input` / `@Output` decorators?
  - [ ] No side effects in `computed()`.
  - [ ] No signal mutations (use `.set()` or `.update()`).
- [ ] **Control Flow**: Verify usage of `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`.
- [ ] **Dependency Injection**: usage of `inject()` instead of constructor injection.
- [ ] **Resources**: Are static images using `NgOptimizedImage`?
- [ ] **Lazy Loading**: Are routes lazy-loaded? Is `@defer` used for heavy components?

## 3. RxJS & Async Logic

- [ ] **No Unowned Subscriptions**: Ensure no `.subscribe()` calls without a corresponding teardown (e.g., `takeUntilDestroyed()`).
- [ ] **Async Pipe**: Prefer `| async` in templates if not using signals.
- [ ] **Declarative over Imperative**: Prefer streams and signals over manual event handlers where possible.

## 4. CSS & Styling

- [ ] **Scoped Styles**: Are styles scoped to the component?
- [ ] **No `ngClass` / `ngStyle`**: Use `[class.name]="..."` or `[style.prop]="..."`.
- [ ] **Design System**: Usage of CSS variables/tokens from the design system instead of hardcoded values.
- [ ] **Responsiveness**: Check for mobile-first media queries if applicable.

## 5. Testing

- [ ] **Unit Tests**: do new components/services have corresponding `.spec.ts` files?
- [ ] **Coverage**: Do the tests cover the main logic logic branch?
- [ ] **Testing Library/TestBed**: Is `TestBed` configured correctly? Are tests deterministic?

## 6. Cleanup & Performance

- [ ] **Console Logs**: Remove `console.log` used for debugging.
- [ ] **Comments**: Remove commented-out code.
- [ ] **Unused Imports**: Remove unused imports.

# Execution

To run the automated parts of this review:

1. **Linting**:

   ```bash
   npm run lint
   ```

2. **Testing**:

   ```bash
   npm test
   ```

3. **Build Check**:
   ```bash
   npm run build
   ```

---
description: Guide for creating new Angular components, services, and features following project best practices.
---

# Feature & Component Scaffolding

> Purpose: Standardize the creation of new features and components to ensure they adhere to strict "Standalone First" and Signal-based architecture.

## 1. Preparation

- **Identify the Feature Module/Domain**: Where does this new code belong? (e.g., `src/app/features/bridge`, `src/app/core/services`).
- **Check Existing**: Ensure a similar component/service doesn't already exist.

## 2. Generation Command

Use the Angular CLI for scaffolding. It handles boilerplate and test files automatically.

**For a Component:**

```bash
# Example: Creating a 'TokenInput' component in the bridge feature
ng generate component features/bridge/components/token-input --change-detection OnPush --style css
```

**For a Service:**

```bash
# Example: Creating a 'BridgeState' service
ng generate service features/bridge/services/bridge-state
```

## 3. Post-Generation Refinement (Mandatory)

After generating the files, you **MUST** modify them to meet specific v21+ standards that CLI might not fully adopt by default yet.

### A. Component (`.ts`)

1. **Inputs/Outputs**: Convert any `@Input() / @Output()` to `input()` / `output()`.
   ```typescript
   // Before
   @Input() amount: number;
   // After
   readonly amount = input<number>();
   ```
2. **Dependency Injection**: Convert constructor DI to `inject()`.
   ```typescript
   // Before
   constructor(private service: MyService) {}
   // After
   private readonly service = inject(MyService);
   ```
3. **Change Detection**: Ensure `changeDetection: ChangeDetectionStrategy.OnPush` is in the decorator.
4. **Imports**: Add necessary imports to the `imports` array (e.g., `CommonModule` is often redundant if using `@if/@for`, but imports like `RouterLink` might be needed).

### B. Template (`.html`)

1. **Control Flow**: Use `@if`, `@for`, `@switch`.
2. **Event Binding**: Ensure strict typing in templates.

### C. Service (`.ts`)

1. **State**: If the service holds state, use `signal` or `writableSignal`.
2. **Cleanup**: If using observables, ensure appropriate cleanup logic.

## 4. Registering the Feature

- **Routing**: If this is a page/view, add it to the `app.routes.ts` or the feature's route config.
  - **Lazy Loading**: Use `loadComponent: () => import(...)`.
  ```typescript
  {
    path: 'bridge',
    loadComponent: () => import('./features/bridge/bridge.component').then(m => m.BridgeComponent)
  }
  ```

## 5. Verification

Run the test suite to ensure the new component passes its initial scaffolding tests:

```bash
ng test --include src/app/path/to/new/component
```

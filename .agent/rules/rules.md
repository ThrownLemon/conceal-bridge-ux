---
trigger: always_on
description: Global rules and constraints for the AI agent working on this Angular v21+ project.
---

# Global Agent Rules

> **Critical**: These rules must be followed for every code generation or modification task.

## 1. Angular v21+ Architecture

- **Standalone Only**: All components, directives, and pipes MUST be `standalone: true` (default). Do NOT creating NgModules.
- **Signals First**:
  - Use `signal()` for mutable state.
  - Use `computed()` for derived state.
  - Use `input()` and `output()` for component API.
  - Avoid `Zone.js` dependencies where possible (aim for Zoneless compatibility).
- **Dependency Injection**: ALWAYS use `inject()` instead of constructor injection.
- **Control Flow**: ALWAYS use `@if`, `@for`, `@switch`. NEVER use `*ngIf` / `*ngFor`.

## 2. Styling & UI (Conceal Brand)

- **Tech Stack**: Tailwind CSS v4.
- **Approach**: Utility-first. Use `@apply` or custom CSS only when utilities become unreadable.
- **Theme**:
  - **Dark Request**: The app is "Dark Mode" first (`bg-slate-950`).
  - **Colors**:
    - **Primary/CTA**: `amber-500` (Deep Yellow). Use sparingly for focus/highlights.
    - **Text**: `slate-300` / `slate-400` for secondary text.
    - **Backgrounds**: Dark slate/black.
- **Ref**: See `docs/style_guide.md` for specific class usages.

## 3. Web3 & Async Patterns

- **Libraries**: `viem` is the primary Web3 library.
- **State Management**:
  - Do NOT store large objects (like Provider) in Signals if they are not immutable.
  - Use RxJS for event streams (blocks, wallet events) but convert to Signals for view consumption (`toSignal`).
- **Safety**:
  - NEVER hardcode private keys or real mnemonics.
  - ALWAYS mock wallet interactions in tests.

## 4. Testing

- **Runner**: Vitest (via Angular CLI builder).
- **Constraint**: Tests MUST be deterministic.
  - Mock all HTTP calls (`HttpTestingController`).
  - Mock all Web3 provider calls.
- **Structure**:
  - "Pure" logic tests (no TestBed) for utils.
  - Shallow render tests for components.

## 5. Tooling & Workflow

- **Angular CLI MCP**: Use `angular-cli` tools (`find_examples`, `get_best_practices`) BEFORE generating complex code.
- **Verification**: After editing code, ALWAYS run:
  1. `npm run lint`
  2. `npm run build` (checks AOT templates)
  3. `npm test`
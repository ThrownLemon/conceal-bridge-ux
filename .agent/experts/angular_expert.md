# Angular Expert Mental Model

## Domain Identity

I am the Angular Expert for the Conceal Bridge UX project. My purpose is to maintain a high-level understanding of the frontend architecture, state management patterns, and best practices. I evolve by learning from every task I complete.

## Core Architectural Patterns (Immutable Rules)

1.  **Framework**: Angular v21+
2.  **Components**: `standalone: true` ONLY. No NgModules.
3.  **State Management**:
    - Mutable state -> Signals (`signal()`).
    - Derived state -> Computed Signals (`computed()`).
    - Async streams -> RxJS (only when necessary), converted to signals via `toSignal()` for the view.
4.  **Dependency Injection**: `inject()` token pattern. No constructor injection.
5.  **Control Flow**: `@if`, `@for`, `@switch` syntax.
6.  **Styling**: Tailwind CSS v4 (Utility-first).

## Knowledge Graph (Evolving)

### Key Directories

- `src/app/pages`: Top-level route components.
- `src/app/shared/components`: Reusable UI atoms/molecules.
- `src/app/core/services`: Global singleton services (web3, store).

### Recent Learnings

- _[Initial Boot]_: System initialized with strict standalone component enforcement.
- _[Initial Boot]_: Web3 interaction is handled via `viem` and encapsulated in services, avoiding direct component dependencies where possible.

## Validation Checklist (Pre-Flight)

Before approving code, I verify:

- [ ] No `CommonModule` or `SharedModule` imports (unless absolutely identifying legacy).
- [ ] No `constructor(private http: HttpClient)` style injection.
- [ ] No `*ngIf` or `*ngFor` directives.
- [ ] Tailwind usage uses standard utility classes.

## Self-Improvement Log

- **2025-12-17**: Initialized expert memory.

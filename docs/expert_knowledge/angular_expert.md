# Angular Expert Mental Model

> **Context**: This file represents the "expert knowledge" for Angular development within the Conceal Bridge project. It is NOT a tutorial, but a collection of high-density patterns, rules, and "gotchas" discovered during development.

## Architecture

### 1. Standalone Components

- **Rule**: All components, directives, and pipes MUST be `standalone: true`.
- **Why**: Removes NgModule boilerplate, enables better tree-shaking, and aligns with modern Angular.
- **Example**:

  ```typescript
  @Component({
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    // ...
  })
  export class MyComponent {}
  ```

### 2. Signals for State

- **Rule**: Prefer `signal()` for mutable state and `computed()` for derived state over manual RxJS subscriptions or getters.
- **Why**: derived state is guaranteed to be glitch-free and dependencies are tracked automatically.
- **Pattern**:

  ```typescript
  // State
  readonly count = signal(0);
  // Derived
  readonly doubleCount = computed(() => this.count() * 2);
  // Derived Async (if needed convert to Signal)
  readonly user = toSignal(this.userService.user$);
  ```

### 3. Inputs & Outputs

- **Rule**: Use the new Signal-based `input()` and `output()` API.
- **Pattern**:

  ```typescript
  export class CardComponent {
    // OLD: @Input() title: string = '';
    // NEW:
    readonly title = input.required<string>();

    // OLD: @Output() closed = new EventEmitter<void>();
    // NEW:
    readonly closed = output<void>();
  }
  ```

### 4. Control Flow

- **Rule**: Use the built-in control flow block syntax (`@if`, `@for`, `@switch`).
- **Why**: Better performance, type-checking, and readability.
- **Traps**:
  - Don't forget `track` in `@for` loops! Use `track $index` or a unique ID.
  - `@empty` block is useful for empty states in `@for`.

## Dependency Injection

- **Rule**: Use `inject()` function instead of constructor parameters.
- **Why**: Type-safe, works outside classes (in functions), and cleaner syntax.

## Testing

- **Rule**: Mock everything. `HttpTestingController` is your friend.
- **Rule**: Avoid `TestBed` for simple services if possible. Plain class instantiation is faster.

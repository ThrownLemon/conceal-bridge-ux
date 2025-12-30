# Gemini Code Review Style Guide

Follow the project conventions defined in `CLAUDE.md`. Key rules:

## Angular Patterns (v21+)

- Use standalone components with `ChangeDetectionStrategy.OnPush`
- Use `inject()` function, not constructor injection
- Use private `#` syntax for fields (e.g., `#http`, `#walletService`)
- Use signals: `signal()`, `computed()`, `effect()`, `input()`, `output()`
- Use control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- No unowned RxJS subscriptions (use `takeUntilDestroyed` or `toSignal`)

## Web3/Security Rules

- Never use floating point math for token amounts (use `BigInt` only)
- Never hardcode contract addresses (use `getChainConfig()`)
- Use `parseUnits()` / `parseEther()` from Viem for token values
- Network switching must go through `EvmWalletService.ensureChain()`

## Code Quality

- Use TypeScript strict types (no `any`, prefer `unknown` or `Record`)
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Follow ZardUI component patterns with camelCase directives

## Testing

- Unit tests: Vitest with `describe`/`it`/`expect`
- E2E tests: Playwright
- Test coverage required for new features

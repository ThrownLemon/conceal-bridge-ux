# Agent Instructions

## Critical Rules (Read First)

### General

- ❌ NEVER stop before pushing - work is incomplete until `git push` succeeds
- ❌ NEVER say "ready to push when you are" - YOU must push
- ❌ NEVER create markdown TODO lists - use bd (beads) for all task tracking
- ✅ Run quality gates before every commit: `npm run lint && npm test && npm run build`
- ✅ Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`

### Quality Gate Anti-Patterns (STRICTLY FORBIDDEN)

❌ **NEVER modify lint rules** to make code pass - fix the code instead
❌ **NEVER add inline eslint-disable** comments to bypass errors
❌ **NEVER modify eslint.config.js** or tsconfig.json to silence errors
❌ **NEVER use `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck`**
❌ **NEVER skip quality gates** to "save time"
❌ **NEVER commit with failing tests** - fix the test or the code
❌ **NEVER assume a build error is "harmless"** - all errors must be resolved

### When Quality Gates Fail

1. Read the error message carefully
2. Understand **why** the rule exists (security, maintainability, consistency)
3. Fix the actual code to satisfy the rule
4. If the rule seems wrong for this case, discuss with the team first - don't disable it

### Web3 / Wallets

- ❌ NEVER handle secrets (no private keys / seed phrases; never log them)
- ❌ NEVER prompt for wallet permissions during hydration (startup uses silent checks)
- ❌ NEVER assume tx is final at "hash returned" - wait for confirmations from chain config
- ✅ Network switching MUST go through `EvmWalletService.ensureChain()`
- ✅ Preserve disconnect semantics (localStorage flag prevents surprise reconnects)

### Smart Contracts

- ❌ NEVER hardcode contract addresses - consume from backend config via `getChainConfig()`
- ❌ NEVER use float math for on-chain values - use `BigInt` only
- ✅ Use `parseUnits()` / `parseEther()` from Viem for token amounts
- ✅ Provider IDs must match between frontend (`EvmNetworkKey`) and backend (`providerId`)
- ✅ Backend validates deposits via tx hash + calldata decode (not event scanning)

---

## Landing the Plane

Work is NOT complete until code is pushed AND a PR is created (or merged). This is the most important workflow rule.

### Branching Strategy

- ❌ NEVER commit directly to `master` (except docs-only changes)
- ✅ Feature work: `feature/your-feature-name`
- ✅ Bug fixes: `fix/issue-description`
- ✅ Hotfixes: `hotfix/critical-fix` (emergency only)

> [!IMPORTANT]
> **Sync First**: Always `git pull origin master` before starting new work or creating a PR. Verify the existing code state to ensure your planned task hasn't already been implemented.

### Required Steps

```bash
# 1. Create feature branch (if not already on one)
git checkout -b feature/your-feature-name

# 2. Quality gates
npm run lint && npm test && npm run build

# 3. Stage and commit
git add .
git commit -m "feat: your change description"

# 4. Push branch to remote
git push -u origin feature/your-feature-name

# 5. Create PR
gh pr create --title "feat: your change" --body "Description of changes"

# 6. Update bd issue (if applicable)
bd close <issue-id>
```

### What "Complete" Means

| Task Type | Complete When                                 |
| --------- | --------------------------------------------- |
| Feature   | PR merged to master (CI must pass)            |
| Bug fix   | PR merged to master                           |
| Hotfix    | PR merged and verified on production          |
| Docs only | Push directly to master                       |
| Release   | Push directly to master (version + changelog) |

### Why PRs for Solo Work?

PRs aren't for waiting on reviewers - they validate your work:

- **CI gate**: GitHub Actions runs lint/test/build before merge
- **Self-review**: Seeing diff in PR view catches mistakes
- **Clean history**: Easy to revert merge commits if needed

### Anti-patterns

- ❌ "I've made the changes, ready to commit when you are"
- ❌ Stopping after local commit without push
- ❌ Leaving work on an unpushed branch without PR
- ❌ Committing directly to master (except docs-only changes)
- ❌ Skipping quality gates to "save time"

---

## Project Overview

See [README.md](./README.md) for full details.

- **Type**: Angular 21 SPA (Standalone, Signals, OnPush)
- **Purpose**: Bridge ₡CCX ↔ $wCCX across Ethereum, BSC, Polygon
- **Backend**: [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap)
- **Stack**: Viem (Web3), TailwindCSS v4, Vitest, Playwright

### Quick Commands

| Command          | Purpose                      |
| ---------------- | ---------------------------- |
| `npm start`      | Dev server at localhost:4200 |
| `npm test`       | Unit tests (Vitest)          |
| `npm run e2e`    | E2E tests (Playwright)       |
| `npm run build`  | Production build             |
| `npm run lint`   | ESLint check                 |
| `npm run format` | Prettier format              |

---

## Quality Gates

Run these before EVERY commit:

```bash
npm run lint        # ESLint (fix: npm run lint:fix)
npm run format      # Prettier formatting
npm test            # Vitest unit tests (Single run)
npm run build       # Production build (run AFTER lint/format)
```

### Markdown Style & Linting

To avoid common linting errors when creating or updating `.md` files:

1. **First Line**: Always start with a top-level heading (`# Heading`). (MD041)
2. **Code Blocks**: Always include a language specifier for fenced code blocks (e.g., ` ```typescript `). (MD040)
3. **Surrounding Lines**: Surround fenced code blocks and lists with blank lines. (MD031, MD032)
4. **Trailing Newline**: Ensure every file ends with a single trailing newline. (MD047)
5. **Punctuation**: Avoid trailing punctuation in headings (e.g., `# Title?` is okay, but `# Title:` is often flagged). (MD026)
6. **Formatting**: Always run `npm run format` after editing Markdown files to ensure consistent spacing and list indentation.

> [!TIP]
> Use the `.agent/workflows/markdown.md` workflow for a comprehensive checklist when working with documentation.
> [!CAUTION]
> **Robust Scripting**: When writing scripts that search for forbidden patterns (like Git hooks), ensure the script itself doesn't match the pattern (use obfuscation like `"eslint""-disable"`) or exclude the script file.

All gates MUST pass before pushing. Do not skip.

### Quality Gate Anti-Patterns

❌ **NEVER modify lint rules** to make code pass - fix the code instead
❌ **NEVER add inline eslint-disable** comments to bypass errors
❌ **NEVER modify eslint.config.js** or tsconfig.json to silence errors
❌ **NEVER use `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck`**
❌ **NEVER skip quality gates** to "save time"
❌ **NEVER commit with failing tests** - fix the test or the code
❌ **NEVER assume a build error is "harmless"** - all errors must be resolved

### When They Fail

1. Read the error message carefully
2. Understand **why** the rule exists (security, maintainability, consistency)
3. Fix the actual code to satisfy the rule
4. If the rule seems wrong for this case, discuss with the team first - don't disable it

### Quality Gate Examples

| Incorrect (Shortcut)                      | Correct (Proper Fix)                        |
| ----------------------------------------- | ------------------------------------------- |
| Add `// eslint-disable-next-line`         | Change code to satisfy the rule             |
| Modify `eslint.config.js` to disable rule | Fix the underlying code issue               |
| Cast with `as any`                        | Use proper type (`unknown`, `Record`, etc.) |
| `@ts-ignore` on a line                    | Fix the type error properly                 |

---

## Angular Patterns (v21+)

### Components

- Standalone only (no NgModules, don't set `standalone: true` explicitly - it's default)
- `changeDetection: ChangeDetectionStrategy.OnPush` always
- Use `inject()` function, not constructor injection
- Private fields use `#` syntax (e.g., `#http`, `#walletService`)

### UI Library (ZardUI)

- Use ZardUI components for UI elements (buttons, inputs, etc.)
- Directives follow camelCase naming (e.g., `zInput`, `zButton`)
- Use `zType`, `zSize`, etc. for inputs instead of classes where possible
- Refer to `src/app/shared/components/` for available components

### Signals (State Management)

- Use `signal()`, `computed()`, `effect()` for state
- Use `input()` and `output()` instead of `@Input` / `@Output` decorators
- No side effects in `computed()` - use `effect()` for side effects
- Mutate with `.set()` or `.update()`, never direct assignment

### Templates

- Use `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`, `[ngSwitch]`)
- Use `[class.name]="condition"` not `[ngClass]`
- Prefer `| async` or `toSignal()` for observables in templates

### RxJS

- No unowned subscriptions - use `takeUntilDestroyed()` or `DestroyRef`
- Prefer declarative streams over manual event handlers
- Convert to Signals for view layer: `toSignal(observable$)`

### Styling

- TailwindCSS v4 utility classes in templates
- Dark theme default: `bg-slate-950`, amber accents for CTAs
- Use `[class.name]` binding, not `ngClass`

---

## Web3 Patterns (Viem)

### Wallet Connection

```typescript
// Always use the service, never raw providers
readonly #wallet = inject(EvmWalletService);

// Check chain before transactions
await this.#wallet.ensureChain(targetChain);

// Wait for confirmations, never assume success
const receipt = await this.#wallet.waitForReceipt(hash);
```

### Token Amounts

```typescript
// CORRECT: Use parseUnits with config-derived decimals
const amount = parseUnits(userInput, chainConfig.units);

// WRONG: Float math
const amount = parseFloat(userInput) * 1_000_000; // NO!
```

### Key Files

| File                                 | Purpose                       |
| ------------------------------------ | ----------------------------- |
| `src/app/core/evm-wallet.service.ts` | Wallet connection, tx sending |
| `src/app/core/bridge-api.service.ts` | Backend API calls             |
| `src/app/core/bridge-types.ts`       | TypeScript interfaces         |
| `src/app/core/evm-networks.ts`       | Chain configurations          |

---

## Issue Tracking (bd)

Use **bd (beads)** for ALL task tracking. No markdown TODOs.

### Quick Reference

```bash
bd ready --json                                    # Check for work
bd create "Title" -t bug|feature|task -p 0-4       # Create issue
bd update bd-42 --status in_progress               # Claim work
bd close bd-42 --reason "Completed"                # Complete work
```

### Issue Types

| Type      | Use For                     |
| --------- | --------------------------- |
| `bug`     | Something broken            |
| `feature` | New functionality           |
| `task`    | Tests, docs, refactoring    |
| `epic`    | Large feature with subtasks |
| `chore`   | Dependencies, tooling       |

### Priorities

| Priority | Meaning                                       |
| -------- | --------------------------------------------- |
| `0`      | Critical (security, data loss, broken builds) |
| `1`      | High (major features, important bugs)         |
| `2`      | Medium (default)                              |
| `3`      | Low (polish, optimization)                    |
| `4`      | Backlog (future ideas)                        |

### Rules

- ✅ Always use `--json` flag for programmatic use
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Link discovered work with `--deps discovered-from:bd-123`
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers

---

## Workflows (.agent/workflows/)

| Workflow     | Purpose                             |
| ------------ | ----------------------------------- |
| `beads.md`   | Issue tracking with bd              |
| `setup.md`   | Environment setup                   |
| `review.md`  | Code review checklist               |
| `cleanup.md` | Pre-commit verification             |
| `submit.md`  | Commit and push (Landing the Plane) |
| `deploy.md`  | GitHub Pages deployment             |
| `release.md` | Version releases                    |
| `hotfix.md`  | Emergency production fixes          |
| `update.md`  | Package updates                     |

---

## Context Commands (.agent/commands/)

Load domain-specific context before working in an area:

| Command                    | When to Use                |
| -------------------------- | -------------------------- |
| `prime.md`                 | General context loading    |
| `prime-wallets.md`         | Wallet/Web3 changes        |
| `prime-smart-contracts.md` | Contract interactions      |
| `prime-architecture.md`    | Structural changes         |
| `prime-backend-api.md`     | API integration work       |
| `prime-testing.md`         | Test development           |
| `prime-security.md`        | Security-sensitive changes |

---

## Documentation Map

| Topic                | File                                                   |
| -------------------- | ------------------------------------------------------ |
| Build & Architecture | [docs/build_guide.md](docs/build_guide.md)             |
| Backend API Contract | [docs/backend_api.md](docs/backend_api.md)             |
| Wallet Integration   | [docs/wallets.md](docs/wallets.md)                     |
| Web3 Patterns        | [docs/web3_integrations.md](docs/web3_integrations.md) |
| Style Guide          | [docs/style_guide.md](docs/style_guide.md)             |
| Security             | [docs/security.md](docs/security.md)                   |
| Testing              | [docs/testing.md](docs/testing.md)                     |

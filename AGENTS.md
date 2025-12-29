# Agent Instructions

This document defines **non-negotiable rules, workflows, and patterns** for contributors and automated agents.  
All instructions in this file are **mandatory**.

---

## 🚨 Critical Rules (Read First)

### General Protocol

- ✅ **Task Tracking:** Use GitHub Issues for all task tracking.
- ✅ **Quality Gates:** Run `npm run lint && npm run test && npm run e2e && npm run build` before every commit.
- ✅ **Commits:** Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).

### Web3 & Security

- ❌ **NO SECRETS:** Never handle private keys or seed phrases. Never log them.
- ❌ **NO HARDCODING:** Never hardcode contract addresses; consume `getChainConfig()`.
- ❌ **NO FLOAT MATH:** Never use floating point math for on-chain values. Use `BigInt` only.
- ❌ **NO EVENT SCANNING:** Backend validates deposits via tx hash + calldata decode.
- ✅ **Network Switching:** MUST go through `EvmWalletService.ensureChain()`.
- ✅ **Disconnects:** Preserve disconnect semantics (localStorage flag prevents surprise reconnects).
- ✅ **Token Units:** Use `parseUnits()` / `parseEther()` from Viem.

---

## 🚀 Development Workflow

### Landing the Plane

Work is **NOT** complete until a PR is created and checks pass.

**Branching Strategy**

- ❌ **NEVER** commit directly to `master`.
- ✅ **Feature:** `feature/your-feature-name`
- ✅ **Docs:** `docs/issue-description`
- ✅ **Fix:** `fix/issue-description`
- ✅ **Hotfix:** `hotfix/issue-description`
- ✅ **Refactor:** `refactor/issue-description`
- ✅ **Chore:** `chore/issue-description`

> [!IMPORTANT]
> **Sync First**: Always `git pull origin master` before starting new work or creating a PR. Verify the existing code state to ensure your planned task hasn't already been implemented.

### Workflow Anti-patterns

- ❌ "I've made the changes, ready to commit when you are" (Just commit it).
- ❌ Stopping after local commit without push.
- ❌ Leaving work on an unpushed branch without a PR.
- ❌ Skipping quality gates to "save time".
- ❌ Leaving the GitHub Issue open after task completion.

---

## 🛡️ Quality Gates

Run these before **EVERY** commit. All gates MUST pass before pushing.

```bash
npm run lint        # ESLint (fix: npm run lint:fix)
npm run format      # Prettier formatting
npm test            # Vitest unit tests (Single run)
npm run e2e         # E2E tests (Playwright)
npm run test:a11y   # Accessibility tests (Playwright)
npm run build       # Production build (run AFTER lint/format)
```

### Strictly Forbidden Anti-Patterns

> [!CAUTION]
> If a gate fails, fix the code. Do not bypass the gate.

| Action                        | Status | Correct Approach                             |
| ----------------------------- | ------ | -------------------------------------------- |
| **Modify lint rules**         | ❌     | Fix the code to satisfy the rule.            |
| **Inline `eslint-disable**`   | ❌     | Fix the underlying issue.                    |
| **Modify `eslint.config.js**` | ❌     | Discuss with team if rule is truly wrong.    |
| **Use `@ts-ignore` / `any**`  | ❌     | Use proper types (`unknown`, `Record`, etc). |
| **Commit failing tests**      | ❌     | Fix the test or the feature.                 |
| **Ignore build errors**       | ❌     | Resolve all errors, no matter how small.     |

### Markdown Style & Linting

When editing documentation:

1. **First Line**: Start with a top-level heading (`# Heading`). (MD041)
2. **Code Blocks**: Include language specifiers (e.g., ````typescript`). (MD040)
3. **Spacing**: Surround fenced code blocks and lists with blank lines. (MD031, MD032)
4. **Newlines**: Ensure every file ends with a single trailing newline. (MD047)
5. **Formatting**: Run `npm run format` after editing.

> [!TIP]
> Use the `.agent/workflows/markdown.md` workflow for a comprehensive checklist when working with documentation.

---

## 💻 Project Architecture

**Overview**

- **Type**: Angular 21 SPA (Standalone, Signals, OnPush).
- **Purpose**: Bridge ₡CCX ↔ $wCCX across Ethereum, BSC, Polygon.
- **Backend**: [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap).
- **Stack**: Viem (Web3), TailwindCSS v4, Vitest, Playwright.

**Quick Commands**
| Command | Purpose |
| :--- | :--- |
| `npm start` | Dev server at `localhost:4200` |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | E2E tests (Playwright) |
| `npm run build` | Production build |

---

## 🛠️ Implementation Patterns

### Angular (v21+)

- **Components**: Standalone only. Always `ChangeDetectionStrategy.OnPush`.
- **Injection**: Use `inject()` function, not constructor injection.
- **Private Fields**: Use `#` syntax (e.g., `#http`, `#walletService`).
- **Signals**: Use `signal()`, `computed()`, `effect()`. Use `input()`/`output()` API.
- **Templates**: Use Control Flow (`@if`, `@for`). Bind classes with `[class.name]`.
- **RxJS**: No unowned subscriptions (use `takeUntilDestroyed` or `toSignal`).

### UI Library (ZardUI)

- Use ZardUI components for UI elements.
- Directives follow camelCase (e.g., `zInput`, `zButton`).
- Use Inputs (e.g., `zType`, `zSize`) instead of CSS classes where possible.

### Web3 (Viem)

**Wallet Connection**

```typescript
// Always use the service, never raw providers
readonly #wallet = inject(EvmWalletService);

// Check chain before transactions
await this.#wallet.ensureChain(targetChain);

// Wait for confirmations, never assume success
const receipt = await this.#wallet.waitForReceipt(hash);
```

**Token Amounts**

```typescript
// CORRECT: Use parseUnits with config-derived decimals
const amount = parseUnits(userInput, chainConfig.units);

// WRONG: Float math
const amount = parseFloat(userInput) * 1_000_000; // NO!
```

**Key Files**
| File | Purpose |
| :--- | :--- |
| `src/app/core/evm-wallet.service.ts` | Wallet connection, tx sending |
| `src/app/core/bridge-api.service.ts` | Backend API calls |
| `src/app/core/bridge-types.ts` | TypeScript interfaces |
| `src/app/core/evm-networks.ts` | Chain configurations |

---

## �️ Agent Tooling & Context

### MCP Tooling Preferences

- **Angular CLI MCP**: Prefer for project analysis and refactors instead of raw shell commands.
- **Context7 MCP**: Prefer for up-to-date library docs and code examples.
- **GitHub MCP**: Prefer for repository analysis, searching issues, and managing PRs.

> Gain an understanding of the workspace layout using your internal tools.

- **`list_projects`** (Angular MCP): Identify projects, roots, and types.
- **`list_dir`** (Native Tool): Explore specific source directories (e.g., `src/app`).
- **`git ls-files`** (Fallback): Use this shell command if the above tools are unavailable or fail.

### Context Building

When establishing context for a new task, prioritize reading:

1. `AGENTS.md` & `README.md`
2. `package.json` & `angular.json`
3. `src/app/app.config.ts` & `src/app/app.routes.ts`

---

## �📚 Documentation Map

| Topic                  | File                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| Build & Architecture   | [docs/build_guide.md](./docs/build_guide.md)                       |
| Backend API Contract   | [docs/backend_api.md](./docs/backend_api.md)                       |
| Wallet Integration     | [docs/wallets.md](./docs/wallets.md)                               |
| Web3 Patterns          | [docs/web3_integrations.md](./docs/web3_integrations.md)           |
| Style Guide            | [docs/style_guide.md](./docs/style_guide.md)                       |
| Security               | [docs/security.md](./docs/security.md)                             |
| Testing                | [docs/testing.md](./docs/testing.md)                               |
| Angular Best Practices | [docs/angular_best_practices.md](./docs/angular_best_practices.md) |
| Bridge Overview        | [docs/bridge_overview.md](./docs/bridge_overview.md)               |
| Project History        | [docs/project_history.md](./docs/project_history.md)               |

# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Project Overview

- **Name**: Conceal Bridge UX (`conceal-bridge-ux`)
- **Type**: Angular 21 Web Application (SPA)
- **Purpose**: UI for bridging ₡CCX and $wCCX across Ethereum, BSC, and Polygon
- **Backend**: Works with [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap) (Express.js API)
- **Production**: <https://bridge.conceal.network>
- **GitHub Pages**: <https://thrownlemon.github.io/conceal-bridge-ux/>

### Key Technologies

- **Framework**: Angular 21 (Standalone Components, Signals, Zoneless-ready)
- **Styling**: TailwindCSS v4 (CSS-first, utility-first)
- **Web3**: Viem (modern EVM wallet integration)
- **Testing**: Vitest (Unit), Playwright (E2E)
- **Package Manager**: npm@11.7.0

## Quick Start Commands

- **Install**: `npm install`
- **Dev Server**: `npm start` (Runs on `http://localhost:4200`)
- **Build (Prod)**: `npm run build` (Output: `dist/conceal-bridge-ux`)
- **Unit Test**: `npm test`
- **E2E Test**: `npm run e2e` (Playwright)
- **Lint**: `npm run lint` (Fix: `npm run lint:fix`)
- **Format**: `npm run format`

## Project Structure

```text
src/
├── app/
│   ├── core/           # Singleton services (API, Wallet), Types, App Config
│   ├── pages/          # Route-level components (Lazy loaded)
│   ├── shared/         # Reusable UI components
│   ├── app.config.ts   # Global providers (Router, HTTP, Error Handling)
│   └── app.routes.ts   # Main routing configuration
├── environments/       # Build-time configuration (Dev vs Prod)
└── main.ts             # Application bootstrap
docs/                   # Detailed project documentation (22+ files)
```

## Architecture & Patterns

### Components

- **Standalone**: All components are standalone. Do NOT use NgModules.
- **Change Detection**: `OnPush` by default.
- **State**: Use **Signals** (`signal()`, `computed()`) for local UI state.
- **Inputs/Outputs**: Use modern signal-based `input()` and `output()`.
- **Dependency Injection**: Use `inject()` function, not constructor injection.
- **Private fields**: Use `#` syntax (e.g., `#http`, `#address`).

### Asynchronous Operations

- **HTTP**: Use `BridgeApiService` in `src/app/core/`.
- **Wallet**: Use `EvmWalletService` in `src/app/core/` for all Web3 interactions.
- **Observables**: Use RxJS for HTTP/Event streams, convert to Signals for views (`toSignal()`).

### Styling

- **Tailwind v4**: Use utility classes in template HTML.
- **Dark Theme**: App is dark-themed by default (`bg-slate-950`).
- **Brand Colors**: Amber/yellow accents (`bg-amber-500`) for CTAs, slate greys for text.
- **Global Styles**: `src/styles.css` handles global resets and Tailwind imports.

## Backend Integration (conceal-wswap)

The frontend communicates with the [conceal-wswap](https://github.com/ConcealNetwork/conceal-wswap) backend API.

### Important API Details

- **URL Pattern**: `{baseUrl}/{network}/api/...`
- **Current Endpoints**: Use `/api/wrap/*`, `/api/unwrap/*`, `/api/swap/*`
- **Legacy Endpoints**: Documentation may show old `/api/ccx/wccx/swap/*` paths - DO NOT USE
- **Provider IDs**: Keep consistent between frontend (`EvmNetworkKey`) and backend (`providerId`)
- **Config Caching**: `BridgeApiService` caches chain config per network to reduce HTTP requests

### Security Model

- Backend validates ALL transaction hashes (confirmations, recipient, amount)
- Frontend cannot fake deposits or skip gas fees
- Always call `ensureChain()` before sending transactions

## Documentation Map

- **Build & Architecture**: [`docs/build_guide.md`](docs/build_guide.md)
- **Backend API**: [`docs/backend_api.md`](docs/backend_api.md) (conceal-wswap contract)
- **Wallet Integration**: [`docs/wallets.md`](docs/wallets.md)
- **Style Guide**: [`docs/style_guide.md`](docs/style_guide.md)
- **Project History**: [`docs/project_history.md`](docs/project_history.md)
- **Security**: [`docs/security.md`](docs/security.md)
- **Testing**: [`docs/testing.md`](docs/testing.md)

## Common Tasks for Agents

1. **Before coding**: Read `docs/build_guide.md` and related specs.
2. **When modifying UI**: Check `docs/style_guide.md` and use Tailwind utilities.
3. **When touching state**: Prefer Signals over BehaviorSubjects for component state.
4. **When adding features**: Ensure new routes are lazy-loaded in `app.routes.ts`.
5. **When working with wallet**: Respect user disconnection flag (don't auto-reconnect).
6. **Task tracking**: Use `bd` for issue management throughout your work.

## Common Gotchas

⚠️ **Backend API Paths**: Use `/api/wrap/init`, `/api/unwrap/init`, NOT old `/api/ccx/wccx/swap/init` format from legacy docs.

⚠️ **Provider IDs**: Keep consistent between frontend network keys and backend provider IDs.

⚠️ **Wallet State**: Don't auto-reconnect if user explicitly disconnected (check `disconnectedByUser` flag).

⚠️ **Chain Switching**: Always call `ensureChain()` before sending transactions to ensure user is on correct network.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

### MANDATORY WORKFLOW

1. **File issues for remaining work** - Create bd issues for anything that needs follow-up
2. **Run quality gates** (if code changed):
   - `npm run lint` - Must pass
   - `npm test` - Must pass
   - `npm run build` - Must succeed
3. **Update issue status** - Close finished work with `bd close <id>`, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:

   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```

5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

### CRITICAL RULES

- ❌ **NEVER** stop before pushing - that leaves work stranded locally
- ❌ **NEVER** say "ready to push when you are" - YOU must push
- ✅ Work is NOT complete until `git push` succeeds
- ✅ If push fails, resolve conflicts and retry until it succeeds

## Git Workflow

- **Main branch**: `master`
- **Commit style**: Conventional Commits (feat:, fix:, docs:, chore:, refactor:)
- **Optional emojis**: Sometimes used (⚡ performance, 🛡️ security)
- **Feature branches**: Pattern `<tool>/<description>-<id>` (e.g., `bolt/cache-chain-config-7756173951920243995`)
- **Workflow**: PR-based merges into master

### Example Commits

```bash
feat: add transaction history component
fix: handle chain config cache errors
docs: update AGENTS.md with new workflows
⚡ Bolt: Cache chain configuration to reduce HTTP requests
```

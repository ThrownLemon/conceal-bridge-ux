# Agent Instructions

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
bd create "Subtask" --parent <epic-id> --json  # Hierarchical subtask (gets ID like epic-id.1)
```

**Claim and update:**

```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`
6. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### GitHub Copilot Integration

If using GitHub Copilot, also create `.github/copilot-instructions.md` for automatic instruction loading.
Run `bd onboard` to get the content, or see step 2 of the onboard instructions.

### MCP Server (Recommended)

If using Claude or MCP-compatible clients, install the beads MCP server:

```bash
pip install beads-mcp
```

Add to MCP config (e.g., `~/.config/claude/config.json`):

```json
{
  "beads": {
    "command": "beads-mcp",
    "args": []
  }
}
```

Then use `mcp__beads__*` functions instead of CLI commands.

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:

- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

#### Best Practice: Use a dedicated directory for these ephemeral files

**Recommended approach:**

- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Example .gitignore entry (optional):**

```gitignore
# AI planning documents (ephemeral)
history/
```

**Benefits:**

- ✅ Clean repository root
- ✅ Clear separation between ephemeral and permanent documentation
- ✅ Easy to exclude from version control if desired
- ✅ Preserves planning history for archeological research
- ✅ Reduces noise when browsing the project

### CLI Help

Run `bd <command> --help` to see all available flags for any command.
For example: `bd create --help` shows `--parent`, `--deps`, `--assignee`, etc.

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Store AI planning docs in `history/` directory
- ✅ Run `bd <cmd> --help` to discover available flags
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents

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

⚠️ **Provider IDs**: Keep consistent between frontend network keys and backend provider IDs.

⚠️ **Wallet State**: Don't auto-reconnect if user explicitly disconnected (check `disconnectedByUser` flag).

⚠️ **Chain Switching**: Always call `ensureChain()` before sending transactions to ensure user is on correct network.

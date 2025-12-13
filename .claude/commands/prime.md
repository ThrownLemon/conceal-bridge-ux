# Context Prime (Baseline)
> Minimal context to work effectively in this repo (Angular 21 bridge UI).
>
> Use the specialized prime files for deeper domains:
> - `.claude/commands/prime-architecture.md`
> - `.claude/commands/prime-backend-api.md`
> - `.claude/commands/prime-wallets.md`
> - `.claude/commands/prime-smart-contracts.md`
> - `.claude/commands/prime-style-guide.md`
> - `.claude/commands/prime-security.md`
> - `.claude/commands/prime-testing.md`
> - `.claude/commands/prime-build-deploy.md`
> - `.claude/commands/prime-mcp.md`

# MCP / Tooling (Angular CLI, Context7, Chrome DevTools)
> Purpose: load the minimum context needed to use MCP tools correctly for this repo (Angular 21 frontend).

## Key rules (read this before coding)
- Prefer **Angular CLI MCP** for Angular-project analysis and refactors instead of running raw shell commands.
- Prefer **Context7 MCP** for up-to-date library docs and code examples (resolve library ID first).
- Use **Chrome DevTools MCP** for UI verification (snapshots/screenshots, DOM inspection, console/network).

## When to use what
### Angular CLI MCP (`angular-cli`)
Use for:
- workspace/project discovery
- Angular best practices retrieval (version-aligned)
- Angular documentation search + example lookup

### Context7 MCP (`context7`)
Use for:
- up-to-date external library docs (e.g., Angular APIs, viem, WalletConnect)
Rules:
- Call `resolve-library-id` before `get-library-docs` unless a full `/org/project` id is already known.

### Chrome DevTools MCP (`chrome-devtools`)
Use for:
- DOM snapshots and screenshots
- verifying rendering/states in a running dev server
- checking console messages and network requests

## Run the following commands

git ls-files

## Read the following files
> Read the files below and nothing else.

README.md
package.json
angular.json

ai_docs/angular_build_guide.md
ai_docs/angular_best_practices.md

ai_tools/angular_mcp.md
ai_tools/context7_mcp.md

src/main.ts
src/app/app.config.ts
src/app/app.routes.ts

src/app/core/app-config.ts
src/app/core/bridge-api.service.ts
src/app/core/bridge-types.ts
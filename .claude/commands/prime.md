# Context for - Angular Project
> Purpose: load the minimum context needed to work effectively in this repo (Angular 21, TailwindCSS, Vite, Web3, Viem).

# Additional Context (Domain-Specific)
> Purpose: additional context for deeper domain-specific knowledge based on the users prompt/intent/domains.

Only read these specialized prime files for deeper context based on the users prompt/intent otherwise the user will include them on his own.
> - `.claude/commands/prime-architecture.md`
> - `.claude/commands/prime-backend-api.md`
> - `.claude/commands/prime-wallets.md`
> - `.claude/commands/prime-smart-contracts.md`
> - `.claude/commands/prime-style-guide.md`
> - `.claude/commands/prime-security.md`
> - `.claude/commands/prime-testing.md`
> - `.claude/commands/prime-build-deploy.md`
> - `.claude/commands/prime-mcp.md`

# MCP / Tooling
> Purpose: load the minimum context needed to use MCP tools correctly for this repo (Angular 21 frontend).

## Key rules (read this before coding)
- Prefer **Angular CLI MCP** for Angular-project analysis and refactors instead of running raw shell commands.
- Prefer **Context7 MCP** for up-to-date library docs and code examples (resolve library ID first).
- Use **Chrome DevTools MCP** for UI verification (snapshots/screenshots, DOM inspection, console/network). **Exception:** Use built-in browser tools if available/equivalent.
- Use any other built in tool you have available to you as required e.g web search. 

## When to use what
### Angular CLI MCP (`angular-cli`)
Use for:
- workspace/project discovery
- Angular best practices retrieval (version-aligned)
- Angular documentation search + example lookup
> *See "Decision Flow" in `ai_tools/angular_mcp.md` for specific tool selection logic.*

### Context7 MCP (`context7`)
Use for:
- up-to-date external library docs (e.g., Angular APIs, viem)
Rules:
- Call `resolve-library-id` before `get-library-docs` unless a full `/org/project` id is already known.

### Chrome DevTools MCP (`chrome-devtools`)
Use for (or use equivalent built-in browser tools):
- DOM snapshots and screenshots
- verifying rendering/states in a running dev server
- checking console messages and network requests

# Common Commands
`npm start` # Run dev server (ng serve)
`ng test` # Run unit tests

# Run the following commands
> Get context of files and folders in the repo.

`git ls-files` # List all files in the repo

# Read the following files
> Read these to build your context.

## Configuration
1. package.json       # Deps and scripts
2. angular.json       # Project architecture & build targets

## AI & Tooling Context
1. docs/angular_build_guide.md
2. docs/angular_best_practices.md

## Application Entry Points
1. src/main.ts                  # App bootstrap
2. src/app/app.config.ts        # Providers & Global Config
3. src/app/app.routes.ts        # Main Routing

## Core Domain Logic
1. src/app/core/app-config.ts
2. src/app/core/bridge-api.service.ts
3. src/app/core/bridge-types.ts

# Workflow
1. **Context**: Read relevant `prime-*.md` files (see top of file) for domain specifics if required.
2. **Specs**: If the user has provided a specs file, read it carefully; if not, create a specs file for the user.
3. **Explore**: Use `angular-cli` (docs/examples) or `context7` (libraries), or just web search as required to help build the plan.
4. **Plan**: Create a detailed plan for the user.
5. **Approval**: Ask for approval before implementing.
6. **Code**: Implement changes + meaningful unit tests.
7. **Verify**:
   - **Self-Verification**: You MUST use available tools (Browser Tool, Terminal) to verify your changes yourself. Do not ask the user to perform manual manual verification steps if you can do it.
   - **Browser Tool**: Use it to visually confirm UI changes, modal states, and interactions.
   - **Tests**: Run `ng test` and `npm run build` to ensure stability.
8. **Update**:
   - **Extensive Documentation Check**: At the end of every task, you MUST search for and update ALL relevant documentation. Don't just update the obvious file; `grep` for keywords to find hidden references in `docs`, `.claude`, and `README` files.
   - **Configuration Hygiene**: When removing dependencies, check `angular.json` (e.g., `allowedCommonJsDependencies`) and `tsconfig.json` for strict cleanup.
   - **Artifacts**: Ensure `task.md` and `walkthrough.md` are up to date.
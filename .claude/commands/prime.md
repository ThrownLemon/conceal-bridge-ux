# Context for this Project

> Purpose: load the minimum context needed to work effectively in this repo (Angular 21, TailwindCSS, Vite, Web3, Viem).

# Tooling

## Key rules (read this before coding)

- Prefer **Angular CLI MCP** for Angular-project analysis and refactors instead of running raw shell commands. Failback to web search if needed.
- Prefer **Context7 MCP** for up-to-date library docs and code examples (resolve library ID first). Failback to web search if needed.
- Use **Chrome DevTools MCP** for UI verification (snapshots/screenshots, DOM inspection, console/network). **Exception:** Use built-in browser tools if available/equivalent.
- Use any other tool you have available to you as required e.g web search.

## When to use what

### Angular CLI MCP (`angular-cli`)

Use for:

- workspace/project discovery
- Angular best practices retrieval (version-aligned)
- Angular documentation search + example lookup

#### Decision Flow

```
Question about Angular concept/API?
  → Use search_documentation

Need code example?
  → Use find_examples

Before generating new code?
  → Use get_best_practices first

Need to know workspace structure?
  → Use list_projects

Planning OnPush/zoneless migration?
  → Use onpush_zoneless_migration

Need to modernize legacy code?
  → Use modernize (experimental)
```

### Context7 MCP (`context7`)

Use for:

- up-to-date external library docs (e.g., Angular APIs, viem)
  Rules:
- Call `resolve-library-id` before `get-library-docs` unless a full `/org/project` id is already known.

#### Decision Flow

```
Use this quick flow to decide when and how to invoke Context7:

- Need third-party library/framework setup, configuration, or exact API usage?
  - Yes → Use Context7
    - Do you already have an exact library ID (`/owner/repo` or `/owner/repo/version`)?
      - Yes → Fetch docs with `get-library-docs` (use a focused `topic` when possible)
      - No → Resolve with `resolve-library-id`, then fetch with `get-library-docs`
    - Still missing details → paginate (`page` 2–10) and/or refine `topic`
  - No → Proceed without Context7 (use local codebase + general language knowledge)

```

### Chrome DevTools MCP (`chrome-devtools`)

Use for (or use equivalent built-in browser tools):

- DOM snapshots and screenshots
- verifying rendering/states in a running dev server
- checking console messages and network requests

# Common Commands

## Development

`npm start` # Run dev server (ng serve)
`npm test` # Run unit tests (Vitest)
`npm run build` # Build for production

## Code Quality

`npm run lint` # Run linter
`npm run lint:fix` # Fix lint errors
`npm run format` # Format code with Prettier

# Project Structure (Agent Tools)

> Gain an understanding of the workspace layout using your internal tools.

- **`list_projects`** (Angular MCP): Identify projects, roots, and types.
- **`list_dir`** (Native Tool): Explore specific source directories (e.g., `src/app`).
- **`git ls-files`** (Fallback): Use this shell command if the above tools are unavailable or fail.

# Read the following files

> Read these to build your context.

## Configuration

1. package.json # Deps and scripts
2. angular.json # Project architecture & build targets

## Application Entry Points

1. src/main.ts # App bootstrap
2. src/app/app.config.ts # Providers & Global Config
3. src/app/app.routes.ts # Main Routing

## Core Logic

1. src/app/core/app-config.ts
2. src/app/core/bridge-api.service.ts
3. src/app/core/bridge-types.ts

## Angular Best Practices

1. docs/angular_build_guide.md
2. docs/angular_best_practices.md

## Project Overview

1. docs/bridge_overview.md

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

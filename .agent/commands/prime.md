# Context for this Project

> Purpose: load the minimum context needed to work effectively in this repo (Angular 21, TailwindCSS, Vite, Web3, Viem).

## Tooling

### Key rules (read this before coding)

- Prefer **Angular CLI MCP** for Angular-project analysis and refactors instead of running raw shell commands. Failback to web search if needed.
- Prefer **Context7 MCP** for up-to-date library docs and code examples (resolve library ID first). Failback to web search if needed.
- Use **GitHub MCP** for repository analysis, searching code/issues, and managing PRs/issues.
- Use **SearXNG MCP** for external web searches and reading content from URLs.
- Use any other tool you have available to you as required (e.g., built-in browser).

### When to use what

#### Angular CLI MCP (`angular-cli`)

Use for:

- workspace/project discovery
- Angular best practices retrieval (version-aligned)
- Angular documentation search + example lookup

##### Angular Decision Flow

```text
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

#### Context7 MCP (`context7`)

Use for:

- up-to-date external library docs (e.g., Angular APIs, viem)
  Rules:
- Call `resolve-library-id` before `get-library-docs` unless a full `/org/project` id is already known.

##### Context7 Decision Flow

```text
Use this quick flow to decide when and how to invoke Context7:

- Need third-party library/framework setup, configuration, or exact API usage?
  - Yes → Use Context7
    - Do you already have an exact library ID (`/owner/repo` or `/owner/repo/version`)?
      - Yes → Fetch docs with `get-library-docs` (use a focused `topic` when possible)
      - No → Resolve with `resolve-library-id`, then fetch with `get-library-docs`
    - Still missing details → paginate (`page` 2–10) and/or refine `topic`
  - No → Proceed without Context7 (use local codebase + general language knowledge)

```

#### GitHub MCP (`github`)

Use for:

- Repository analysis (listing files, searching code)
- Issue management (searching, reading, creating, commenting)
- Pull Request management (listing, reading, diffs, reviews)
- Searching users and teams

#### SearXNG MCP (`searxng`)

Use for:

- General web search (`searxng_web_search`)
- Reading content from external URLs (`web_url_read`)

## Common Commands

### Development

`npm start` # Run dev server (ng serve)
`npm test` # Run unit tests (Vitest)
`npm run build` # Build for production

### Code Quality

`npm run lint` # Run linter
`npm run lint:fix` # Fix lint errors
`npm run format` # Format code with Prettier

## Project Structure (Agent Tools)

> Gain an understanding of the workspace layout using your internal tools.

- **`list_projects`** (Angular MCP): Identify projects, roots, and types.
- **`list_dir`** (Native Tool): Explore specific source directories (e.g., `src/app`).
- **`git ls-files`** (Fallback): Use this shell command if the above tools are unavailable or fail.

## Read the following files

> Read these to build your context.

### Configuration

1. package.json # Deps and scripts
2. angular.json # Project architecture & build targets

### Application Entry Points

1. src/main.ts # App bootstrap
2. src/app/app.config.ts # Providers & Global Config
3. src/app/app.routes.ts # Main Routing

### Core Logic

1. src/app/core/app-config.ts
2. src/app/core/bridge-api.service.ts
3. src/app/core/bridge-types.ts

### Angular Best Practices

1. docs/build_guide.md
2. docs/angular_best_practices.md

### Project Overview

1. docs/bridge_overview.md
2. docs/project_history.md

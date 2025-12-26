# Context for this Project

> Purpose: load the minimum context needed to work effectively in this repo (Angular 21, TailwindCSS, Vite, Web3, Viem).

## Tooling

### Key rules (read this before coding)

- Prefer **Angular CLI MCP** for Angular-project analysis and refactors instead of running raw shell commands. Failback to web search if needed.
- Prefer **Context7 MCP** for up-to-date library docs and code examples (resolve library ID first). Failback to web search if needed.
- Use **GitHub MCP** for repository analysis, searching code/issues, and managing PRs/issues.
- Use **SearXNG MCP** for external web searches and reading content from URLs.
- Use any other tool you have available to you as required (e.g., built-in browser).

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

1. AGENTS.md # Agent instructions
2. README.md # Project overview
3. package.json # Deps and scripts
4. angular.json # Project architecture & build targets

### Application Entry Points

1. src/main.ts # App bootstrap
2. src/app/app.config.ts # Providers & Global Config
3. src/app/app.routes.ts # Main Routing
4. environment.ts # Environment variables

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

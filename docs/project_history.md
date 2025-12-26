# Project History

> Purpose: A high-level log of major architectural changes, feature additions, and significant refactors. This helps future agents understand the evolution of the codebase without reading every commit.

## 2025-12-26

- **Refactor**: Improved `ZardDebounceEventManagerPlugin` to correctly handle dotted event names (custom events) and updated `ZardEventManagerPlugin` to support single-key aliases (enter, escape, space) for better developer ergonomics.
- **Testing**: Added comprehensive unit tests for custom Angular Event Manager plugins in `src/app/shared/core/provider/event-manager-plugins/`.
- **Docs/Workflow**: Updated project workflows (`.agent/workflows/test.md`, `.agent/workflows/review.md`) to use correct Angular CLI commands (`ng test --no-watch`) for the Vitest test runner, preventing environment-related failures.

## 2025-12-14

- **Documentation**: Added official Angular Best Practices (v21) guides locally (`docs/angular-*.md`) and linked them in `docs/build_guide.md`.
- **Documentation**: Updated `docs/build_guide.md` to accurately reflect project configuration (Linting, Budgets, Dependencies).
- **Refactor**: Removed `walletconnect` dependency (v2) in favor of specific connectors.
- **Feature**: Implemented custom SVG QR code generation, removing the `qrcode` dependency.
- **Config**: Implemented environment-specific configurations (Production vs Development) for API base URLs.

## 2025-12-17

- **Agent**: Implemented "Expert Agent" system. Added `docs/expert_knowledge/` for persistent mental models and `.agent/workflows/learn.md` for self-improvement. Updated `.agent/workflows/prime.md` to load expert context.

## 2025-12-16

- **Environment**: Fixed Playwright setup by documenting and verifying installation of required system dependencies for browser binaries.
- **Testing**: Updated E2E tests to match actual application title ("Conceal Bridge"), fixing initial test failures.

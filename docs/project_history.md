# Project History

> Purpose: A high-level log of major architectural changes, feature additions, and significant refactors. This helps future agents understand the evolution of the codebase without reading every commit.

## 2025-12-14

- **Documentation**: Added official Angular Best Practices (v21) guides locally (`docs/angular-*.md`) and linked them in `docs/build_guide.md`.
- **Documentation**: Updated `docs/build_guide.md` to accurately reflect project configuration (Linting, Budgets, Dependencies).
- **Refactor**: Removed `walletconnect` dependency (v2) in favor of specific connectors.
- **Feature**: Implemented custom SVG QR code generation, removing the `qrcode` dependency.
- **Config**: Implemented environment-specific configurations (Production vs Development) for API and WalletConnect IDs.

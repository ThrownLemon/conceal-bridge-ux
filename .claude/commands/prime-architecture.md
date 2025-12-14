# Context for — Architecture / Product Flows
> Purpose: load the minimum architecture + user-flow context so changes don’t break the bridge’s end-to-end swap sequencing.

## Key rules (read this before coding)
- The product is a **two-way bridge** between **CCX** and **wCCX** across EVM networks; most “bridge logic” is **off-chain** (backend orchestrated).
- The UI’s core flow is on the **Swap page**; changes should preserve the sequencing: **fee → init → deposit/transfer → (exec where applicable) → poll until complete**.
- Prefer docs in `docs/` for intended architecture, but treat the **current frontend code** as the behavioral source of truth for UX state transitions.

## Read the following files

docs/bridge_overview.md
docs/bridge_user_guide.md
docs/bridge_architecture.md
docs/angular_build_guide.md

src/app/app.routes.ts
src/app/pages/swap/swap.page.ts
src/app/core/bridge-api.service.ts
src/app/core/evm-wallet.service.ts
# Context for — Wallets / Web3 (Viem + Injected)

> Purpose: load the minimum context to safely change wallet connection UX, provider handling, chain switching, and on-chain tx flows.

## Key rules (read this before coding)

- **Never handle secrets** (no private keys / seed phrases; never log them).
- **Hydration must not prompt** (startup uses silent account/chain checks; do not add wallet permission prompts during hydration).
- **Preserve disconnect semantics** (the “user disconnected” localStorage flag prevents surprise reconnects).
- **Network switching must go through the wallet service** (don’t re-implement RPC calls in components).
- **Transactions are not final at “hash returned”**: always wait for confirmations configured by backend chain config

## Read the following files

docs/wallets.md
docs/security.md
docs/error_handling.md
docs/smart_contracts.md

src/app/core/app-config.ts
src/app/core/bridge-types.ts
src/app/core/evm-networks.ts

src/app/core/evm-wallet.service.ts
src/app/shared/wallet/wallet-button.component.ts

src/app/pages/swap/swap.page.ts
src/viem-window.d.ts

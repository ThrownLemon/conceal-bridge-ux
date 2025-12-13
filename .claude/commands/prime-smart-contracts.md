# Context Prime — Smart Contracts / On-chain Verification (wCCX ERC-20)
> Purpose: load the minimum context for changes involving wCCX contract interactions, tx validation rules, units/decimals, and chain/provider consistency.

## Key rules (read this before coding)
- This bridge is **backend-orchestrated**; on-chain logic is a **standard ERC-20 (wCCX)** plus native transfers for fees.
- **Do not hardcode contract addresses** in frontend logic; consume addresses via backend-provided chain config and validate them.
- **Provider IDs must stay consistent** across backend config and frontend network keys.
- Be careful with **units/decimals**:
  - avoid float math for on-chain values
  - use config-derived units/decimals and `parseUnits()`/`parseEther()` patterns
- Deposit verification in the backend is based on **tx hash + calldata decode** (not event scanning). Frontend work should not assume event-based verification.

## Run the following commands

git ls-files

## Read the following files
> Read the files below and nothing else.

ai_docs/smart_conctracts.md
ai_docs/backend_api.md
ai_docs/security.md

src/app/core/bridge-types.ts
src/app/core/evm-networks.ts
src/app/core/evm-wallet.service.ts
src/app/pages/swap/swap.page.ts
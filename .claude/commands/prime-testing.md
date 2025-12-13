# Context Prime — Testing (Unit + Future E2E)
> Purpose: load the minimum testing context to add/change tests safely (Angular 21 + Vitest + web3 mocking constraints).

## Key rules (read this before coding)
- Tests must be **deterministic**: no real HTTP, no real wallets, no real chain RPC, no WalletConnect sessions.
- Prefer mocking at service boundaries:
  - stub [`BridgeApiService`](src/app/core/bridge-api.service.ts:1)
  - stub [`EvmWalletService`](src/app/core/evm-wallet.service.ts:1)
- Follow existing Angular TestBed patterns in the repo; keep fixtures typed (avoid `any`).

## Run the following commands

git ls-files

## Read the following files
> Read the files below and nothing else.

ai_docs/testing.md
ai_docs/error_handling.md
ai_docs/wallets.md
ai_docs/backend_api.md

ai_spec/e2e_testing.md

package.json
angular.json
tsconfig.spec.json

src/app/app.spec.ts
src/app/pages/swap/swap.page.ts
src/app/core/bridge-api.service.ts
src/app/core/evm-wallet.service.ts
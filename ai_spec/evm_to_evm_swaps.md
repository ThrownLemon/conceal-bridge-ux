# Spec: EVM ↔ EVM Swaps (Future Feature) — conceal Bridge UX

## Context / Current State

- The Home flow explicitly blocks direct EVM-to-EVM swaps:
  - “Direct EVM-to-EVM swaps are not supported yet…” in [`HomePage.go()`](conceal-bridge-ux/src/app/pages/home/home.page.ts:425).
- The network selector enforces “exactly one side is CCX”:
  - see the constraint in [`HomePage.normalizeNetworks()`](conceal-bridge-ux/src/app/pages/home/home.page.ts:359).
- Current supported EVM networks are:
  - Ethereum (1), BSC (56), Polygon (137) via [`EVM_NETWORKS`](conceal-bridge-ux/src/app/core/evm-networks.ts:11).
- Current swap routes are CCX-centric only:
  - `/swap/:direction/:network` with directions `'ccx-to-evm' | 'evm-to-ccx'` in [`routes`](conceal-bridge-ux/src/app/app.routes.ts:3).

## Goal

Add support for **EVM ↔ EVM** swap flows in the UI **without breaking** the existing CCX ↔ EVM bridge flows.

Users should be able to select an EVM network on both sides (e.g. Ethereum → Polygon), connect a wallet, and complete a swap with clear statuses, safe validation, and predictable error handling.

## Non-Goals

- Implementing a full DEX aggregator in the frontend.
- Performing “real cross-chain bridging” on-chain without backend support.
- Supporting non-EVM chains.
- Adding a full “bridge explorer” / account history (separate spec).

## Assumptions / Dependencies

At least one of the following must be true (to be decided with backend team):

1. **Backend-driven EVM↔EVM bridging**
   - Backend exposes idempotent endpoints for quote + execution + status, similar to current bridge endpoints in [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13).

OR

2. **Frontend-driven EVM↔EVM routing**
   - The UI integrates an external bridging/DEX SDK, and the backend is only used for analytics/optional support.
   - This requires careful CSP updates (see [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:41)).

This spec assumes (1) initially because it aligns with the current architecture (backend-driven swap state polling via [`SwapPage.startPolling()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:845)).

## UX / Product Requirements

1. **Network selector must allow EVM↔EVM**
   - Remove/adjust the “one side must be CCX” enforcement (currently in [`HomePage.normalizeNetworks()`](conceal-bridge-ux/src/app/pages/home/home.page.ts:359)).
2. **New swap direction**
   - Introduce a third swap direction: `evm-to-evm`.
3. **Wallet UX**
   - Continue using existing wallet connect and network switching behavior:
     - connect modal: [`WalletButtonComponent`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:309)
     - network switching: [`EvmWalletService.ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:205)
4. **Error-handling consistency**
   - Follow existing conventions (`pageError` vs `statusMessage`) from [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:445) and guidance in [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:30).
5. **Safety & clarity**
   - Must show from/to networks clearly at all times.
   - Must not allow double-submission / double-execution.

## API Contract (Proposed)

> Exact naming may differ; the goal is to define the minimum needed primitives.

### A) Quote endpoint
- `POST /{network}/api/evm/evm/quote`
- Request:
  - `fromChainId`, `toChainId`
  - `fromToken`, `toToken` (addresses or canonical identifiers)
  - `amount` (string/decimal or integer in smallest units)
  - `toAddress`
- Response:
  - `success: boolean`
  - `quoteId`
  - `expectedAmountOut`
  - `feesBreakdown`
  - `expiresAt`
  - optional: transaction request template (to be signed)

### B) Execute endpoint
- `POST /{network}/api/evm/evm/exec`
- Request:
  - `quoteId`
  - `userTxHash` (if user must send an on-chain tx)
  - optional: `email` (if you keep parity with current init flows)
- Response:
  - `success: boolean`
  - `paymentId` (or similar stable tracking id)

### C) Status endpoint (polling)
- `POST /{network}/api/evm/evm/tx`
- Request:
  - `paymentId`
- Response:
  - `result: boolean`
  - `txdata` with:
    - `sourceTxHash`
    - `destinationTxHash`
    - `fromChainId`, `toChainId`
    - `fromAmount`, `toAmount`

**Rule:** status endpoint must be safe/idempotent for polling retry (align with polling design in [`SwapPage.startPolling()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:845)).

## UI Flow (Proposed)

1. **Home**
   - Allow selection of EVM on both sides.
   - When submitting, route to a new swap route:
     - `/swap/evm-to-evm/<fromNetworkKey>-to-<toNetworkKey>` (example)
   - Alternatively, extend route params (recommended):
     - `/swap/:direction/:from/:to`

2. **Swap Page**
   - New mode `evm-to-evm` with steps similar to current flows:
     - Step 0: Validate input (recipient address, amount)
     - Step 1: Quote + user approval (show fees, expected output)
     - Step 2: User signs/sends tx (if required)
     - Step 3: Poll status until completion

## Validation / Security Requirements

- Address validation uses viem `isAddress` (pattern already used in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:9)).
- Must enforce:
  - min/max amounts per backend quote response (do not guess in UI).
  - slippage or “price protection” rules (separate spec if DEX-like).
- Do not store sensitive swap details in localStorage (align with rules in [`security.md`](conceal-bridge-ux/docs/security.md:1)).

## Observability

Log key events via the planned logging system (see [`observability_and_client_logging.md`](conceal-bridge-ux/ai_spec/observability_and_client_logging.md:1)):

- `swap.evmToEvm.quote.start|success|error`
- `swap.evmToEvm.exec.start|success|error`
- `swap.evmToEvm.polling.timeout|recovered|completed`

## Testing Plan

- Unit/component tests:
  - Ensure Home allows EVM↔EVM selection and routes correctly.
  - Ensure Swap page validates addresses/amounts and shows correct step transitions.
- E2E:
  - Use the approach in [`e2e_testing.md`](conceal-bridge-ux/ai_spec/e2e_testing.md:45):
    - mock backend quote/exec/status endpoints
    - inject fake wallet provider
    - verify UI reaches completion via polling

## Risks / Considerations

- EVM↔EVM “swap” may require bridging + liquidity routing; complexity depends on backend.
- UI must avoid confusing EVM↔EVM swaps with the CCX bridge product promise.
- Any new third-party SDK will impact CSP and must be allowlisted per [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:41).

## Implementation Steps (Work Breakdown)

1. Define route shape changes (new params) in [`app.routes.ts`](conceal-bridge-ux/src/app/app.routes.ts:3).
2. Update Home network selection logic in [`HomePage.normalizeNetworks()`](conceal-bridge-ux/src/app/pages/home/home.page.ts:359) and submit logic in [`HomePage.go()`](conceal-bridge-ux/src/app/pages/home/home.page.ts:425).
3. Add new UI path in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:400) for `evm-to-evm`.
4. Add backend API methods to [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13) (or a new dedicated service) for quote/exec/status.
5. Add tests (unit + E2E per [`e2e_testing.md`](conceal-bridge-ux/ai_spec/e2e_testing.md:1)).
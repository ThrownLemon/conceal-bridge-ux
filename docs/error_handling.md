# Error Handling Guide

This guide defines **how you should handle and present errors** across the project’s current architecture and patterns.

Core code references:

- HTTP service: [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13)
- Wallet/EVM integration: [`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:34)
- Main swap flow + UI error signals: [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:400)
- Existing HTTP/error-handling spec: [`http_and_error_handling.md`](conceal-bridge-ux/ai_spec/http_and_error_handling.md:1)

---

## 1) Goals (what “good” looks like)

When an error happens, the app must:

1. **Keep users safe from double-spends / double-swaps**
   - Never retry non-idempotent swap actions blindly (see retry guidance in [`http_and_error_handling.md`](conceal-bridge-ux/ai_spec/http_and_error_handling.md:63)).
2. **Keep the UI state consistent**
   - Clear busy states and avoid advancing steps when a step failed (patterns in [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:598) and [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:720)).
3. **Show actionable user-facing messages**
   - Tell the user what happened and what they can do next.
4. **Degrade gracefully on non-critical features**
   - Example: chain metadata loads are optional and failures are intentionally swallowed via [`rxjs.catchError()`](conceal-bridge-ux/src/app/core/evm-chain-metadata.service.ts:44).
5. **Separate “user message” from “developer detail”**
   - Don’t surface raw stack traces or opaque RPC errors unless they are already user-friendly.

---

## 2) Current UI conventions in this project

### 2.1 Route-blocking vs step-level messages

The swap page uses two message channels:

- **Blocking, page-wide error**: [`pageError`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:445)
  - Used when the page can’t function (example: config load failure in [`rxjs.catchError()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:490)).
  - Renders as a red banner (template block around [`@if (pageError())`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:86)).

- **Step/status message**: [`statusMessage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:446)
  - Used for progress updates (“Connecting wallet…”, “Estimating gas…”) and step-level failures.

**Rule:** prefer `pageError` only when the user cannot proceed at all. For everything else, use `statusMessage`.

### 2.2 Busy state rules

Swap flows gate actions via [`isBusy`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:439). When an error happens:

- Always set busy to false (see [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:715) and [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:840)).
- Do not advance [`step`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:438) unless the step completed successfully.

### 2.3 Polling is cancelable and should remain so

Polling is implemented with [`rxjs.timer()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:846) and stops on navigation via [`takeUntilDestroyed()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:855).

**Rule:** never introduce polling that cannot be canceled (must keep a `DestroyRef`-bound cancellation path like [`takeUntilDestroyed()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:855)).

---

## 3) Error taxonomy (what kinds of errors exist here)

This project has **three major error planes**:

1. **Wallet / Provider / RPC errors (EIP-1193-ish)**
   - Connection, permissions, chain switching, user rejection
   - Examples:
     - connect flows in [`WalletButtonComponent.connect()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:449)
     - chain switching in [`EvmWalletService.ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:205)

2. **Backend HTTP + backend business-logic errors**
   - HTTP failures (network/timeout/5xx/4xx)
   - Backend may return HTTP 200 but still indicate failure in payload:
     - [`BridgeInitSwapResponse.success`](conceal-bridge-ux/src/app/core/bridge-types.ts:39) + [`BridgeInitSwapResponse.error`](conceal-bridge-ux/src/app/core/bridge-types.ts:42)

3. **User input + client-side validation errors**
   - Invalid CCX/EVM addresses, invalid amount, etc.
   - Example messages: “Invalid amount.” / “Invalid EVM address.” in [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:618)

Additionally, this project includes “soft failures” that should not hard-fail the app:

- Wallet hydration ignores failures (see swallowing errors in [`EvmWalletService.hydrate()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:114))
- Chain metadata loads ignore failures (see [`rxjs.catchError()`](conceal-bridge-ux/src/app/core/evm-chain-metadata.service.ts:44))

---

## 4) User-facing message guidelines (copy + tone)

### 4.1 General rules

- **Be specific and actionable**:
  - “Could not reach the bridge server. Check your connection and try again.”
  - “Wallet request already pending. Open your wallet and complete or reject the request.”
- **Avoid blaming the user**. Prefer neutral tone.
- **Avoid leaking internals**:
  - Don’t show raw `HttpErrorResponse` JSON.
  - Don’t show RPC stack traces, hex codes, or provider internals unless already user-friendly.
- **Do not expose secrets**:
  - Never echo private keys, seeds, API keys, or sensitive configuration.

### 4.2 Message placement rules

- Use [`pageError`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:445) only for:
  - missing/invalid route params (“Unknown swap direction.” exists already in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:533))
  - config load failure that makes swap unusable (current pattern in [`rxjs.catchError()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:490))
- Use [`statusMessage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:446) for:
  - progress (“Estimating gas…”) and step errors
  - recoverable failures (retry possible, user can change inputs, etc.)

---

## 5) Wallet/provider error handling (EVM)

### 5.1 Canonical provider error codes to recognize

These appear in the current codebase and should remain consistent:

| Scenario                                    |  Code / detection | What to show                                                    | Where it appears                                                                                                                                                                                                       |
| ------------------------------------------- | ----------------: | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User rejected a wallet request              |   `code === 4001` | “Request was cancelled in your wallet.”                         | [`SwapPage.addTokenToWallet()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:560), [`WalletButtonComponent.friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466)              |
| Wallet request already pending              | `code === -32002` | “A wallet request is already pending. Please open your wallet.” | [`HomePage.switchWalletToSelectedNetwork()`](conceal-bridge-ux/src/app/pages/home/home.page.ts:411), [`WalletButtonComponent.friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466) |
| Chain not added to wallet (MetaMask common) |   `code === 4902` | Automatically add chain and retry switch                        | [`EvmWalletService.ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:213)                                                                                                                           |

### 5.2 Wallet connect UX rules

Wallet connect UI uses a local error signal [`WalletButtonComponent.error`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:317) and maps errors with [`WalletButtonComponent.friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466).

**Rules for agent changes:**

- Reuse and extend [`WalletButtonComponent.friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466) rather than inventing new wording in multiple places.
- Treat `4001` as **non-fatal** (user canceled): show a calm message and keep UI usable.

### 5.3 Transaction submission + confirmation rules

Swap flows use:

- sending native tx: [`EvmWalletService.sendNativeTransaction()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:245)
- waiting for confirmations: [`EvmWalletService.waitForReceipt()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:265)

**Rules:**

- If send fails:
  - show a wallet-focused message (“Transaction rejected”, “Insufficient funds for gas”, etc.)
  - do not proceed to backend init
- If waiting for confirmations fails or hangs:
  - message should suggest checking the tx hash in a block explorer and retrying later
  - do not “auto-retry” sending a new transaction

---

## 6) Backend/API error handling (HTTP + payload)

### 6.1 Know the two layers of “success”

Backend calls can fail in two ways:

1. **HTTP-level failure** (network issues, 5xx, 4xx)

- Calls are made via [`HttpClient`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:1)
- There is no interceptor today (see [`provideHttpClient()`](conceal-bridge-ux/src/app/app.config.ts:10)), so pages often do local [`rxjs.catchError()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:490).

2. **Payload-level failure** (HTTP 200 but success flag false)

- Example:
  - Init: check [`BridgeInitSwapResponse.success`](conceal-bridge-ux/src/app/core/bridge-types.ts:40) and use [`BridgeInitSwapResponse.error`](conceal-bridge-ux/src/app/core/bridge-types.ts:42)
  - In practice: swap init throws on `!init.success` in [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:704) and [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:822)

**Rule:** always check payload success flags; do not assume HTTP 200 means “success”.

### 6.2 Retry policy (safety first)

Follow the constraints in [`http_and_error_handling.md`](conceal-bridge-ux/ai_spec/http_and_error_handling.md:63):

- **Do retry** idempotent operations:
  - GETs like config and balances from [`BridgeApiService.getChainConfig()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:26), [`getCcxSwapBalance()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:42), etc.
- **Do not retry** swap init/execution by default:
  - init endpoints: [`sendCcxToWccxInit()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:50), [`sendWccxToCcxInit()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:67)
  - exec endpoint: [`execWccxToCcxSwap()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:84)

Reason: retrying non-idempotent actions can cause double processing.

### 6.3 Timeout policy

There is no global timeout currently (no interceptors beyond [`provideHttpClient()`](conceal-bridge-ux/src/app/app.config.ts:10)).

**Rule for agent changes:** if you add timeouts, keep them:

- longer for init/exec
- shorter for polling/status
- consistent across the app (prefer centralizing per [`http_and_error_handling.md`](conceal-bridge-ux/ai_spec/http_and_error_handling.md:71))

---

## 7) Polling & transient failures (swap state)

Polling uses:

- [`SwapPage.startPolling()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:845)
- a 10s interval via [`rxjs.timer()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:846)
- suppression of transient errors by converting them to `{ result: false }` via [`rxjs.catchError()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:850)
- completion via [`rxjs.take(1)`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:854)

**Rules:**

- Transient polling failures should not flip the UI into a “failed” state immediately.
- However, repeated failures should become visible to the user:
  - after N consecutive failed polls, set a gentle `statusMessage` like:
    - “Having trouble reaching the bridge server. Retrying…”
  - do not stop polling unless the user navigates away, cancels, or the flow completes.
- Never remove cancellation (must keep [`takeUntilDestroyed()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:855)).

---

## 8) Insufficient funds handling (user vs bridge liquidity)

There are two distinct “insufficient funds” classes in this app:

### 8.1 Bridge liquidity shortage (backend-side/bridge-side)

This is checked in the UI using balances fetched from backend:

- CCX→EVM (needs wCCX liquidity): message in [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:629)
- EVM→CCX (needs CCX liquidity): message in [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:751)

**Rule:** keep this message user-friendly and not blame the user. It’s not their wallet balance.

### 8.2 User wallet/token shortage (user-side)

For EVM→CCX, the app checks user’s wCCX balance using:

- reading contract balance via [`publicClient.readContract()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:782)
- and throws “Insufficient wCCX balance…” in [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:789)

For CCX→EVM, the user must pay gas; “insufficient funds for gas” often comes from the wallet/provider error message. Prefer mapping to a friendly message:

- “Not enough ETH/BNB/MATIC to pay gas fees on this network.”

**Rule:** distinguish bridge liquidity vs user wallet balance in messaging, because the next action differs.

---

## 9) Transaction failure scenarios (what to expect and how to message)

Common scenarios and recommended responses:

1. **User rejected request in wallet** (`4001`)
   - Message: “Request was cancelled in your wallet.”
   - Keep UI interactive; do not treat as “fatal”.

2. **User lacks gas**
   - Message: “Not enough native tokens to pay gas fees.”
   - Suggest: “Add ETH/BNB/MATIC to your wallet and try again.”

3. **Smart contract transfer reverted**
   - Message: “Token transfer failed. Please try again or confirm the recipient/amount.”
   - Provide tx hash if available (we track it via [`evmTxHash`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:442)).

4. **Tx submitted but never confirms**
   - Message: “Transaction is taking longer than expected to confirm. Check the explorer and retry later.”
   - Do not resubmit automatically.

5. **Backend says init/exec failed**
   - Prefer using the backend-provided error only if it is safe and user-friendly (see [`BridgeInitSwapResponse.error`](conceal-bridge-ux/src/app/core/bridge-types.ts:42)).
   - Otherwise show a stable message: “Swap initialization failed. Please try again.”

---

## 10) Background/non-critical failures (don’t hard-fail the app)

Two examples already in the codebase:

- Wallet hydration:
  - [`EvmWalletService.hydrate()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:114) catches and ignores errors so app startup never hard-fails.
- Chain metadata:
  - [`EvmChainMetadataService`](conceal-bridge-ux/src/app/core/evm-chain-metadata.service.ts:23) treats metadata as optional and returns an empty list on errors via [`rxjs.catchError()`](conceal-bridge-ux/src/app/core/evm-chain-metadata.service.ts:44).

**Rule:** continue this approach for optional UI sugar; reserve `pageError` for critical path failures.

---

## 11) Implementation checklist for the AI agent (when adding/changing features)

When implementing or refactoring error handling:

1. **Prefer centralization for HTTP errors**
   - Follow the roadmap in [`http_and_error_handling.md`](conceal-bridge-ux/ai_spec/http_and_error_handling.md:42): interceptor + shared mapping.
2. **Preserve current UX contracts**
   - Keep using [`pageError`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:445) and [`statusMessage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:446) appropriately.
3. **Never introduce unsafe retries**
   - Do not retry init/exec endpoints unless backend explicitly guarantees idempotency.
4. **Treat wallet cancellations as expected**
   - Handle `4001` calmly across the app (see existing patterns in [`WalletButtonComponent.friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466)).
5. **Keep polling cancelable**
   - Always include [`takeUntilDestroyed()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:855) or equivalent cancellation.
6. **Always check payload-level success**
   - e.g. [`BridgeInitSwapResponse.success`](conceal-bridge-ux/src/app/core/bridge-types.ts:40) and [`BridgeSwapStateResponse.result`](conceal-bridge-ux/src/app/core/bridge-types.ts:46).

---

## 12) Notes on global error capture

The app enables browser-level listeners via [`provideBrowserGlobalErrorListeners()`](conceal-bridge-ux/src/app/app.config.ts:9).

**Rule:** do not rely on global handlers for user experience. User-facing flows must still catch and set `statusMessage`/`pageError` at the point of failure (patterns in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:714)).

---

## Related docs/specs in this repo

- Backend API contracts and response shapes: [`backend_api.md`](conceal-bridge-ux/docs/backend_api.md:1)
- HTTP and error-handling roadmap (retry rules, interceptor strategy): [`http_and_error_handling.md`](conceal-bridge-ux/ai_spec/http_and_error_handling.md:1)
- Wallet/provider error codes and mapping strategy: [`wallets.md`](conceal-bridge-ux/docs/wallets.md:1)
- Smart contract + tx verification patterns (wCCX ERC-20, calldata decoding): [`smart_contracts.md`](conceal-bridge-ux/docs/smart_contracts.md:1)
- Security constraints that affect error handling (no secrets in logs, safe UX): [`security.md`](conceal-bridge-ux/docs/security.md:1)
- Testing guidance for failure paths and polling behavior: [`testing.md`](conceal-bridge-ux/docs/testing.md:1)

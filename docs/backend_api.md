# Backend API guide (conceal-wswap)

This document explains how the **backend swap engine** works and how clients should call it.

Backend project: [`conceal-wswap`](conceal-wswap/index.js:1)

Primary goals for an AI agent working in this repo:

- Understand the **actual server endpoints** and their request/response shapes (source: [`index.js`](conceal-wswap/index.js:1))
- Understand the **expected client flows** (source: legacy wrapper [`concealSwap()`](conceal-wswap/public/framework/swap.js:1))
- Avoid introducing breaking changes or security regressions (keys/config exposure, unsafe logging, etc.)

---

## 1) High-level architecture

### Components

The backend is an Express app created in [`index.js`](conceal-wswap/index.js:1):

- Web server: [`express()`](conceal-wswap/index.js:36)
- Logging middleware: [`morganBody()`](conceal-wswap/index.js:62)
- Swap engines:
  - DB access: [`SwapDatabase`](conceal-wswap/index.js:21)
  - EVM contract + RPC: [`SwapContract`](conceal-wswap/index.js:20)
  - CCX wallet/daemon integration: [`SwapWallet`](conceal-wswap/index.js:19)

### Trust model

The backend does **not** blindly trust user-supplied transaction hashes. It validates:

- confirmations threshold (chain-specific)
- recipient address matches configured bridge wallet address
- for ERC-20 deposits: calldata decodes to `transfer(to, amount)` to the bridge wallet

Those checks are performed in API handlers such as [`/api/unwrap/exec`](conceal-wswap/index.js:231) using contract helpers like [`getTxInfo()`](conceal-wswap/units/contract.js:204) and [`decodeTransferData()`](conceal-wswap/units/contract.js:227).

---

## 2) Routing + serving model

### Static files

The server serves static assets from `public/` via [`express.static('public')`](conceal-wswap/index.js:60).

This includes the legacy client wrapper:

- [`public/framework/swap.js`](conceal-wswap/public/framework/swap.js:1)

### API routing conventions

- JSON POST endpoints live under `/api/...` (see e.g. [`/api/wrap/init`](conceal-wswap/index.js:94))
- JSON GET endpoints live under `/api/...` (see e.g. [`/api/tx/:paymentId`](conceal-wswap/index.js:520))
- Config endpoint is `/config/chain` (see [`/config/chain`](conceal-wswap/index.js:631))

---

## 3) Response shapes + error handling rules

### Two “success” patterns exist

The backend uses two different boolean keys depending on endpoint:

- `success: boolean` for “command” endpoints (init/exec), produced in handlers like [`/api/wrap/init`](conceal-wswap/index.js:94) and errors via [`sendError()`](conceal-wswap/index.js:74)
- `result: boolean` for “query” endpoints (balance/tx/gas), e.g. [`/api/wrap/estimateGas`](conceal-wswap/index.js:464), [`/api/tx/:paymentId`](conceal-wswap/index.js:520), [`/api/balance/:providerId`](conceal-wswap/index.js:569)

### Generic error envelope

Most POST endpoints call [`sendError()`](conceal-wswap/index.js:74), which responds:

```json
{
  "success": false,
  "err": "<string | error object>"
}
```

Some GET handlers return their own error shapes, e.g. [`/api/tx/:paymentId`](conceal-wswap/index.js:520) returns:

```json
{
  "result": false,
  "txdata": null,
  "err": "<error>"
}
```

AI agent rules:

- When writing clients, treat **both** `err` and `error` as possible message fields (legacy wrapper sometimes expects `error`; see [`txFeeFailed`](conceal-wswap/public/framework/swap.js:171)).
- Treat any non-2xx response as a transport failure (the wrapper does this in [`doAjaxPOST()`](conceal-wswap/public/framework/swap.js:5) / [`doAjaxGET()`](conceal-wswap/public/framework/swap.js:27)).
- Do not assume the backend always uses consistent keys.

---

## 4) Provider IDs and cross-project consistency

The backend uses provider IDs from config, e.g. `eth`, `bsc`, `plg`, `ccx`, and a configured default provider.

- Provider selection is done by [`getProviderConfig()`](conceal-wswap/units/contract.js:88)
- The newer Angular UX models network keys as [`EVM_NETWORK_KEYS`](conceal-bridge-ux/src/app/core/bridge-types.ts:3)

AI agent rules:

- Keep provider IDs consistent across backend config, backend code, and frontend network keys.
- Do not introduce a new ID spelling in only one place.

---

## 5) Endpoint reference (authoritative from index.js)

All endpoints below are taken from [`index.js`](conceal-wswap/index.js:1).

### 5.1 Wrap (CCX -> wCCX)

#### `POST /api/wrap/init`

Source: [`/api/wrap/init`](conceal-wswap/index.js:94)

Purpose:

- Validates the **fee payment transaction** on the destination EVM chain.
- Creates a DB swap record and returns a `paymentId`.

Request body fields (observed usage):

- `amount`
- `fromAddress` (CCX sender address)
- `toAddress` (EVM recipient address for wCCX)
- `email` (optional)
- `txfeehash` (fee tx hash on EVM chain)
- `inProviderId` (usually `"ccx"`)
- `outProviderId` (e.g. `"eth" | "bsc" | "plg"`)

Response:

- success: `{ "success": true, "paymentId": "<hex>" }`
- failure: `{ "success": false, "err": "<message>" }` via [`sendError()`](conceal-wswap/index.js:74)

Validation highlights:

- Amount bounded by `metrics.maxSwapAmount` and `metrics.minSwapAmount` in config (see checks in [`/api/wrap/init`](conceal-wswap/index.js:98))
- Fee tx “too old” check uses `maxTxBlockAge` (see [`txSwapData.blockNumber + providerConfig.maxTxBlockAge`](conceal-wswap/index.js:113))
- Fee tx cannot be reused (see [`checkFeeTxHash()`](conceal-wswap/units/database.js:45))

#### `POST /api/wrap/estimateGas`

Source: [`/api/wrap/estimateGas`](conceal-wswap/index.js:464)

Request body:

- `providerId`
- `toAddress`
- `amount`

Response:

- `{ "result": true, "gas": <number> }`

---

### 5.2 Unwrap (wCCX -> CCX)

#### `POST /api/unwrap/init`

Source: [`/api/unwrap/init`](conceal-wswap/index.js:168)

Purpose:

- Validates the **fee payment transaction** (native coin) to the bridge wallet.
- Creates a DB swap record and returns `paymentId`.

Request body:

- `amount`
- `fromAddress` (EVM sender address)
- `toAddress` (CCX recipient address)
- `email` (optional)
- `txfeehash` (fee tx hash)
- `inProviderId` (e.g. `"eth" | "bsc" | "plg"`)
- `outProviderId` (usually `"ccx"`)

Response:

- `{ "success": true, "paymentId": "<hex>" }` or error via [`sendError()`](conceal-wswap/index.js:74)

#### `POST /api/unwrap/estimateGas`

Source: [`/api/unwrap/estimateGas`](conceal-wswap/index.js:478)

Request body:

- `providerId`

Response:

- `{ "result": true, "gas": <number> }`

#### `POST /api/unwrap/exec`

Source: [`/api/unwrap/exec`](conceal-wswap/index.js:231)

Purpose:

- Verifies that a user’s wCCX deposit transaction is valid (confirmed + correct recipient).
- Sends CCX on the CCX side (via swap wallet engine).
- Finalizes DB record.

Request body:

- `inProviderId` (EVM chain id key)
- `outProviderId` (expected `"ccx"`)
- `paymentId`
- `txHash` (the ERC-20 transfer tx hash)
- `email` (optional)

Success response:

- `{ "success": true, "swapData": <db finalize result> }` (see response in [`/api/unwrap/exec`](conceal-wswap/index.js:278))

Important validations:

- swap record must exist: [`getSwapData()`](conceal-wswap/index.js:242)
- deposit tx must not have been used already: [`checkPaymentTxHash()`](conceal-wswap/index.js:254)
- tx must meet confirmation threshold: [`txConfirmations >= providerConfig.confirmations`](conceal-wswap/index.js:262)
- tx calldata must decode to `transfer(to, value)` and `to` must equal bridge wallet address (see recipient check in [`/api/unwrap/exec`](conceal-wswap/index.js:265))

---

### 5.3 Swap (wCCX -> wCCX across EVM providers)

This is a “token swap between EVM networks” flow.

#### `POST /api/swap/init`

Source: [`/api/swap/init`](conceal-wswap/index.js:314)

Purpose:

- Validates a fee tx on the **out** provider chain.
- Initializes the swap record and returns `paymentId`.

Request body:

- `amount`
- `fromAddress`
- `toAddress`
- `email` (optional)
- `txfeehash`
- `inProviderId`
- `outProviderId`

Response:

- `{ "success": true, "paymentId": "<hex>" }` or error via [`sendError()`](conceal-wswap/index.js:74)

#### `POST /api/swap/estimateGas`

Source: [`/api/swap/estimateGas`](conceal-wswap/index.js:492)

Request body:

- `providerId`

Response:

- `{ "result": true, "gas": <number> }`

#### `POST /api/swap/exec`

Source: [`/api/swap/exec`](conceal-wswap/index.js:378)

Purpose:

- Verify deposit on the **in** provider chain (ERC-20 transfer to bridge wallet).
- Transfer out on the **out** provider chain (bridge wallet -> user).
- Finalize DB.

Request body:

- `inProviderId`
- `outProviderId`
- `paymentId`
- `txHash`
- `email` (optional)

Success response:

- `{ "success": true, "swapData": <db finalize result> }` (see response in [`/api/swap/exec`](conceal-wswap/index.js:429))

⚠️ Known issue (AI agent should be aware):
Inside [`/api/swap/exec`](conceal-wswap/index.js:378), the recipient validation line references `providerConfig` instead of `inProviderConfig`:

- [`providerConfig.account.address`](conceal-wswap/index.js:413)

This looks like a bug and would throw at runtime (or incorrectly validate). Any work on this endpoint should fix that reference and add coverage.

---

### 5.4 Query endpoints

#### `GET /api/getGasPrice/:providerId`

Source: [`/api/getGasPrice/:providerId`](conceal-wswap/index.js:506)

Response:

- `{ "result": true, "gas": <number> }`

#### `GET /api/tx/:paymentId`

Source: [`/api/tx/:paymentId`](conceal-wswap/index.js:520)

Purpose:

- Poll swap status by `paymentId`

Responses:

- Completed swap: `{ hasRecord: true, result: true, txdata: { swaped, address, swapHash, depositHash } }` (see [`result: true`](conceal-wswap/index.js:526))
- Pending swap: `{ hasRecord: true, result: false, hasExpired: <bool>, txdata: {...} }` (see [`result: false`](conceal-wswap/index.js:540))
- Unknown paymentId: `{ hasRecord: false, result: false, txdata: null }` (see [`hasRecord: false`](conceal-wswap/index.js:551))

#### `GET /api/balance/:providerId`

Source: [`/api/balance/:providerId`](conceal-wswap/index.js:569)

Purpose:

- Returns available balance for swap liquidity, accounting for reserved funds from DB.

Response:

- `{ "result": true, "balance": <number> }`

Notes:

- For `CCX`, it uses swap wallet balance (see [`providerId.toUpperCase() == 'CCX'`](conceal-wswap/index.js:570))
- For EVM providers, it uses ERC-20 balance of the bridge account (see [`contract.getWalletBalance()`](conceal-wswap/index.js:584))

#### `POST /api/ccx/wccx/stats`

Source: [`/api/ccx/wccx/stats`](conceal-wswap/index.js:602)

Request body:

- `includeRecentTx: boolean`
- `includeAllTx: boolean`

Response:

- `{ "result": true, "stats": <object> }`

Stats implementation: [`getStats_ccx_wccx()`](conceal-wswap/units/database.js:124)

#### `POST /api/wccx/ccx/stats`

Source: [`/api/wccx/ccx/stats`](conceal-wswap/index.js:616)

Note:
This endpoint currently calls [`getStats_ccx_wccx()`](conceal-wswap/index.js:617) too, even though [`getStats_wccx_ccx()`](conceal-wswap/units/database.js:155) exists. This mismatch likely indicates incomplete/buggy stats wiring.

---

### 5.5 Config endpoint

#### `GET /config/chain`

Source: [`/config/chain`](conceal-wswap/index.js:631)

Purpose:

- Return chain/provider config to clients.

Response includes:

- `providers: contract.getProvidersConfig()`
- `wccx.units`, `ccx.accountAddress`, `ccx.units`
- `common.maintenance`, `minSwapAmount`, `maxSwapAmount`, `defaultProvider`
- `tx.gasMultiplier`

AI agent security warning:

- [`getProvidersConfig()`](conceal-wswap/units/contract.js:81) currently returns the in-memory `providers` object which, as constructed in [`SwapContract`](conceal-wswap/units/contract.js:14), can include sensitive config fields (e.g. `account` containing keys/mnemonics) and non-JSON-safe objects (`provider`, `contract`).
- If this endpoint is used publicly, it must be **sanitized** to include only public fields (contract address, chainId, confirmations, RPC, currency metadata) and must never expose private keys.

---

## 6) Legacy JS framework wrapper (public/framework/swap.js)

The backend ships a legacy “easy integration” wrapper that drives end-to-end flows:

- Wrapper constructor: [`concealSwap()`](conceal-wswap/public/framework/swap.js:1)
- It loads `/config/chain` on init: [`doAjaxGET("/config/chain")`](conceal-wswap/public/framework/swap.js:505)

Key client-side helper patterns:

- HTTP helpers: [`doAjaxPOST()`](conceal-wswap/public/framework/swap.js:5), [`doAjaxGET()`](conceal-wswap/public/framework/swap.js:27)
- Balance gating: [`isBalanceSufficient()`](conceal-wswap/public/framework/swap.js:64)
- Fee payment + init flow: [`payBridgeFee()`](conceal-wswap/public/framework/swap.js:96)
- High-level flows:
  - wrap flow: [`wrap()`](conceal-wswap/public/framework/swap.js:187)
  - unwrap flow: [`unwrap()`](conceal-wswap/public/framework/swap.js:234)
  - swap flow: [`swap()`](conceal-wswap/public/framework/swap.js:313)
- Polling: [`checkSwapState()`](conceal-wswap/public/framework/swap.js:419)

AI agent rules when modifying frontend UX:

- Treat this wrapper as “legacy reference behavior,” not necessarily the canonical API contract for the Angular UX.
- Use it to understand sequencing (fee -> init -> deposit -> exec -> poll), and port behavior carefully.

---

## 7) Database behavior relevant to API semantics

Core DB operations in [`SwapDatabase`](conceal-wswap/units/database.js:13):

- Lookup: [`getSwapData()`](conceal-wswap/units/database.js:31) calls stored procedure `get_swapdata(paymentId)`
- Prevent tx reuse:
  - fee tx: [`checkFeeTxHash()`](conceal-wswap/units/database.js:45)
  - payment tx: [`checkPaymentTxHash()`](conceal-wswap/units/database.js:59)
- Initialize: [`initializeSwap()`](conceal-wswap/units/database.js:74) calls stored procedure `add_swap(...)`
- Finalize: [`finalizeSwap()`](conceal-wswap/units/database.js:89) updates `data_swaps` and sets status codes

AI agent security warning:

- [`finalizeSwap()`](conceal-wswap/units/database.js:89) uses string interpolation to build SQL. Any inputs that can be influenced by the request (e.g. `txHash`) should be treated as potentially unsafe. If you refactor this code, prefer parameterized queries.

---

## 8) README vs actual endpoints (important!)

The backend’s README describes older endpoint names like `api/ccx/wccx/swap/init` in [`README.md`](conceal-wswap/README.md:93), but the current implementation uses:

- [`/api/wrap/init`](conceal-wswap/index.js:94)
- [`/api/unwrap/init`](conceal-wswap/index.js:168)
- [`/api/unwrap/exec`](conceal-wswap/index.js:231)
- [`/api/swap/init`](conceal-wswap/index.js:314)
- [`/api/swap/exec`](conceal-wswap/index.js:378)

AI agent rule:

- Treat [`index.js`](conceal-wswap/index.js:1) as the authoritative contract, not [`README.md`](conceal-wswap/README.md:1).

---

## 9) Related docs/specs in this repo

- Smart contract behavior (ERC-20 wCCX) and backend verification patterns: [`smart_contracts.md`](conceal-bridge-ux/docs/smart_contracts.md:1)
- Frontend runtime types for swap responses (new UX): [`BridgeInitSwapResponse`](conceal-bridge-ux/src/app/core/bridge-types.ts:39), [`BridgeSwapStateResponse`](conceal-bridge-ux/src/app/core/bridge-types.ts:45)
- Error handling expectations for the UX: [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:1)

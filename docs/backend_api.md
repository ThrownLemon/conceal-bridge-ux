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

Those checks are performed in API handlers such as `/api/wccx/ccx/swap/exec` using contract helpers like `getTxInfo()` and `decodeTransferData()`.

---

## 2) Routing + serving model

### Static files

The server serves static assets from `public/` via [`express.static('public')`](conceal-wswap/index.js:60).

This includes the legacy client wrapper:

- [`public/framework/swap.js`](conceal-wswap/public/framework/swap.js:1)

### API routing conventions

- JSON POST endpoints live under `/api/...` (e.g. `/api/ccx/wccx/swap/init`)
- JSON GET endpoints live under `/api/...` (e.g. `/api/balance/ccx`)
- Config endpoint is `/config/chain`

---

## 3) Response shapes + error handling rules

### Two “success” patterns exist

The backend uses two different boolean keys depending on endpoint:

- `success: boolean` for "command" endpoints (init/exec), e.g. `/api/ccx/wccx/swap/init`
- `result: boolean` for "query" endpoints (balance/tx/gas), e.g. `/api/ccx/wccx/estimateGas`, `/api/balance/ccx`

### Generic error envelope

Most POST endpoints call [`sendError()`](conceal-wswap/index.js:74), which responds:

```json
{
  "success": false,
  "err": "<string | error object>"
}
```

Some handlers return their own error shapes, e.g. `/api/ccx/wccx/tx` returns:

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

## 5) Endpoint reference

All endpoints below are from the backend README and match what the Angular frontend uses.

### 5.1 Wrap (CCX -> wCCX)

#### `POST /api/ccx/wccx/swap/init`

Purpose:

- Initializes the CCX → wCCX swap transaction.
- User must first pay gas fee on EVM chain, then call this endpoint.
- Returns a `paymentId` to track the swap.

Request body:

- `amount` - Amount of CCX to swap for wCCX
- `fromAddress` - CCX address sending the CCX
- `toAddress` - EVM address to receive wCCX
- `email` (optional) - Email to receive swap status
- `txfeehash` - Hash of the fee payment TX on EVM chain

Response:

- success: `{ "success": true, "paymentId": "<hex>" }`
- failure: `{ "success": false, "err": "<message>" }`

#### `POST /api/ccx/wccx/estimateGas`

Purpose:

- Estimates gas required for the swap at current network conditions.

Request body:

- `amount` - Amount of CCX to swap
- `address` - The wCCX smart contract address

Response:

- `{ "result": true, "gas": <number> }`

#### `POST /api/ccx/wccx/tx`

Purpose:

- Check the status of a wrap swap transaction.

Request body:

- `paymentId` - PaymentId of the swap TX

Response:

- `swaped` - Amount of tokens being swapped
- `address` - Target address
- `swapHash` - Hash of the swap TX on Ethereum blockchain
- `depositHash` - Hash of the deposit TX on CCX blockchain

---

### 5.2 Unwrap (wCCX -> CCX)

#### `POST /api/wccx/ccx/swap/init`

Purpose:

- Initializes the wCCX → CCX swap transaction.
- User deposits wCCX and when confirmed, CCX is sent to target address.

Request body:

- `fromAddress` - wCCX address sending the tokens
- `toAddress` - CCX address to receive CCX
- `txHash` - Hash of the wCCX deposit TX on EVM chain
- `email` (optional) - Email to receive swap status

Response:

- success: `{ "success": true, "paymentId": "<hex>" }`
- failure: `{ "success": false, "err": "<message>" }`

#### `POST /api/wccx/ccx/swap/exec`

Purpose:

- Executes the wCCX → CCX swap after deposit is confirmed.

Request body:

- `paymentId` - PaymentId of the swap TX to execute
- `email` (optional) - Email to receive swap status

Response:

- success: `{ "success": true, "swapData": <object> }`
- failure: `{ "success": false, "err": "<message>" }`

#### `POST /api/wccx/ccx/tx`

Purpose:

- Check the status of an unwrap swap transaction.

Request body:

- `paymentId` - PaymentId of the swap TX

Response:

- `hasRecord` - true/false, whether record with paymentId was found
- `result` - true/false, whether tx is finished
- `swaped` - Amount of coins being swapped
- `hasExpired` - true/false, whether swap period has expired
- `txdata` - TX data object (if successful):
  - `swapped` - Amount swapped
  - `address` - Target address
  - `swapHash` - Hash of swap TX on CCX blockchain
  - `depositHash` - Hash of deposit TX on EVM blockchain

---

### 5.3 Query endpoints

#### `GET /api/balance/ccx`

Purpose:

- Returns how much CCX is available in the swap wallet.

Response:

- `{ "result": true, "balance": <number> }`

#### `GET /api/balance/wccx`

Purpose:

- Returns how much wCCX is available in the swap wallet.

Response:

- `{ "result": true, "balance": <number> }`

---

### 5.4 Config endpoint

#### `GET /config/chain`

Purpose:

- Return chain/provider config to clients.

Response includes:

- `providers` - Provider configuration for each supported chain
- `wccx.units`, `ccx.accountAddress`, `ccx.units`
- `common.maintenance`, `minSwapAmount`, `maxSwapAmount`, `defaultProvider`
- `tx.gasMultiplier`

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

## 8) Frontend service reference

The Angular frontend (`bridge-api.service.ts`) uses these endpoints:

| Operation          | Endpoint                         |
| ------------------ | -------------------------------- |
| Wrap init          | `POST /api/ccx/wccx/swap/init`   |
| Unwrap init        | `POST /api/wccx/ccx/swap/init`   |
| Unwrap exec        | `POST /api/wccx/ccx/swap/exec`   |
| Check wrap state   | `POST /api/ccx/wccx/tx`          |
| Check unwrap state | `POST /api/wccx/ccx/tx`          |
| CCX balance        | `GET /api/balance/ccx`           |
| wCCX balance       | `GET /api/balance/wccx`          |
| Gas estimate       | `POST /api/ccx/wccx/estimateGas` |
| Gas price          | `GET /api/ccx/wccx/getGasPrice`  |
| Chain config       | `GET /config/chain`              |

AI agent rule:

- Always use endpoint names from this table
- Match what `src/app/core/bridge-api.service.ts` uses

---

## 9) Related docs/specs in this repo

- Smart contract behavior (ERC-20 wCCX) and backend verification patterns: [`smart_contracts.md`](conceal-bridge-ux/docs/smart_contracts.md:1)
- Frontend runtime types for swap responses (new UX): [`BridgeInitSwapResponse`](conceal-bridge-ux/src/app/core/bridge-types.ts:39), [`BridgeSwapStateResponse`](conceal-bridge-ux/src/app/core/bridge-types.ts:45)
- Error handling expectations for the UX: [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:1)

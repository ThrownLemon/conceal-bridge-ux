# Smart contracts (wCCX) in Conceal Bridge

This project’s “bridge” is **not** a complex on-chain bridge contract. The swap is orchestrated **off-chain** by the backend engine, and the EVM side uses a **standard ERC-20 contract** (wCCX) plus plain native-coin transfers for fees.

The goal of this doc is to teach an AI agent where contract data comes from, which contract methods are used, and the repo’s patterns for reading/verifying transactions.

---

## Source of truth (addresses, ABI, confirmations, units)

### Backend config drives everything
The authoritative contract configuration lives in the backend config (see sample): [`config.json.sample`](conceal-wswap/config.json.sample:1)

Each provider entry contains:
- `rpc` (JSON-RPC URL)
- `chainId`
- `confirmations`
- `address` (the wCCX ERC-20 contract address on that chain)
- `abiPath` (path to an ABI JSON file)
- `account` (the backend “bridge hot wallet” that holds gas + wCCX for payouts)

The backend loads provider configs and instantiates the contract at runtime in [`SwapContract`](conceal-wswap/units/contract.js:14).

### Frontend types expect chain config (contract address + optional ABI)
The Angular UX models the EVM side as `wccx` and expects a contract address (and optionally an ABI) in [`BridgeChainConfig`](concael-bridge-ux/src/app/core/bridge-types.ts:8), using viem types [`Abi`](concael-bridge-ux/src/app/core/bridge-types.ts:1) and [`Address`](concael-bridge-ux/src/app/core/bridge-types.ts:1).

Important: the UX should treat addresses / chain IDs / confirmations as **runtime config**, not hardcoded constants.

---

## Contract addresses for each network

### EVM networks used by the UX
The UX currently defines supported EVM network keys as [`EVM_NETWORK_KEYS`](concael-bridge-ux/src/app/core/bridge-types.ts:3) (currently `eth`, `bsc`, `plg`).

These keys must remain consistent with the backend provider IDs used by [`getProviderConfig()`](conceal-wswap/units/contract.js:88) and config entries in [`config.json.sample`](conceal-wswap/config.json.sample:25).

### Where the address is used
- Backend: contract instances are created with [`ethers.Contract()`](conceal-wswap/units/contract.js:59) using the configured address.
- Frontend: config shape uses [`BridgeChainConfig.wccx.contractAddress`](concael-bridge-ux/src/app/core/bridge-types.ts:14).

Agent rule:
- Do **not** embed contract addresses in UI code, docs, or tests. Always consume config from the backend/runtime config layer.

---

## ABI definitions and types

### Backend ABI loading
For each provider, the backend reads the ABI file and parses JSON into memory as `contractAbi` in [`SwapContract`](conceal-wswap/units/contract.js:14), then binds it to the contract instance with [`ethers.Contract()`](conceal-wswap/units/contract.js:59).

### The ABI currently used is “plain ERC-20”
Example ABI file: [`contract_bsc.abi`](conceal-wswap/contracts/contract_bsc.abi:1)

It includes the standard ERC-20 functions and events:
- [`approve()`](conceal-wswap/contracts/contract_bsc.abi:14)
- [`totalSupply()`](conceal-wswap/contracts/contract_bsc.abi:28)
- [`transferFrom()`](conceal-wswap/contracts/contract_bsc.abi:55)
- [`balanceOf()`](conceal-wswap/contracts/contract_bsc.abi:74)
- [`transfer()`](conceal-wswap/contracts/contract_bsc.abi:97)
- [`allowance()`](conceal-wswap/contracts/contract_bsc.abi:120)
- [`Approval`](conceal-wswap/contracts/contract_bsc.abi:150)
- [`Transfer`](conceal-wswap/contracts/contract_bsc.abi:172)

### Frontend ABI typing (viem)
The UX uses viem ABI types via [`Abi`](concael-bridge-ux/src/app/core/bridge-types.ts:1). If the backend provides ABI at runtime, keep it minimal (ERC-20 subset) unless the UX truly needs extra methods.

Agent rules:
- Prefer **minimal ABI surface**.
- Never “invent” ABI methods: only add methods that exist in the deployed contract + ABI files.

---

## Contract method patterns (how swaps actually use the contract)

The backend performs 3 important contract-adjacent operations:
1) Validate a fee payment TX on the destination EVM chain.
2) Validate a user deposit TX (wCCX transfer to the bridge wallet).
3) Send wCCX payouts (bridge wallet -> user).

### 1) Fee payment TX validation (native coin transfer)
For some swap directions, the user pays a **native-coin** fee to the backend’s bridge wallet so the backend can later pay gas when sending wCCX.

Backend pattern:
- Fetch tx and wait for confirmations using [`getTxInfo()`](conceal-wswap/units/contract.js:204)
- Validate recipient address matches provider hot wallet address (from config)
- Reject too-old TXs using provider `maxTxBlockAge` (config-driven)

Agent rule:
- Fee validation is **not** an ERC-20 contract call; it’s a plain EVM value transfer checked via the tx’s `to` field + confirmations.

### 2) User deposit TX validation (ERC-20 transfer)
When a user deposits wCCX for an unwrap/swap, the backend verifies:
- The tx is sufficiently confirmed (provider `confirmations`)
- The tx calldata decodes to an ERC-20 `transfer(to, value)`
- The decoded recipient `to` matches the backend hot wallet address

Backend pattern:
- Decode calldata using [`decodeTransferData()`](conceal-wswap/units/contract.js:227), which builds an interface using [`ethers.Interface()`](conceal-wswap/units/contract.js:233) and decodes the `transfer` selector.

Agent rule:
- In this repo, deposit verification is done by **decoding tx calldata**, not by scanning logs/events.
- If you add event-based verification, it must be additive and cross-checked against tx calldata and/or receipts.

### 3) Payout TX (backend sends wCCX to user)
Payouts are executed by the backend hot wallet calling ERC-20 `transfer`.

Backend pattern:
- Compute gas price with multiplier using `getFeeData()` + `gasMultiplier` in [`transferFunds()`](conceal-wswap/units/contract.js:97)
- Normalize token amount using `coinUnits.wccx` in [`transferFunds()`](conceal-wswap/units/contract.js:109)
- Execute `transfer` on the configured contract via [`transferFunds()`](conceal-wswap/units/contract.js:97)
- Wait for confirmations via [`waitForTransaction()`](conceal-wswap/units/contract.js:269)

Agent rules:
- Amounts are stored/handled as “human units” and scaled by `coinUnits.wccx`. This is config-driven from [`config.json.sample`](conceal-wswap/config.json.sample:94).
- Be careful: current implementation truncates fractional token amounts via `Math.trunc`. If you change amount handling, update **all** paths (fee estimation, DB fields, UI validation).

---

## Event listening and parsing

### Current repo approach: do not rely on event subscriptions
While the ERC-20 ABI includes [`Transfer`](conceal-wswap/contracts/contract_bsc.abi:172), the backend’s “proof” of deposit is based on:
- tx hash provided by the client
- tx confirmations
- decoded calldata target + value

This is implemented by [`getTxInfo()`](conceal-wswap/units/contract.js:204) and [`decodeTransferData()`](conceal-wswap/units/contract.js:227).

Why:
- Avoids provider log indexing / reorg edge cases
- Works even if event logs are pruned or unavailable via some RPC endpoints
- Keeps validation logic narrowly scoped

Agent rules:
- Prefer “tx-hash + calldata decode” for deposit verification (consistent with current code).
- Use events for UI enhancements (e.g. explorer/history) only when you can tolerate partial data and you still cross-check correctness.

---

## Gas estimation and optimization strategies

### Fee estimation used by backend
The backend estimates wrap fees using [`estimateWrapFee()`](conceal-wswap/units/contract.js:155), which:
- Calls `transfer.estimateGas(...)` on the contract
- Applies a safety margin (`feeMargin`)
- Adds a fixed component (`fixedFee`)
- Returns a rounded gwei value

Related knobs are configured per provider in [`config.json.sample`](conceal-wswap/config.json.sample:25):
- `gasMultiplier` (speeds up mined txs; increases gas price)
- `feeMargin` (safety buffer)
- `fixedFee` (baseline fee component)
- `timeout` (RPC wait timeout)

Agent rules:
- Do not hardcode gas logic in the frontend. The backend is already responsible for network-specific estimation and safety margins.
- Any “optimization” must preserve safety: prioritize confirmation reliability and correct accounting over micro-savings.

### Practical optimization guidance for this repo
When adjusting gas/fee logic:
- Prefer tuning config (`gasMultiplier`, `feeMargin`, `fixedFee`) over code changes.
- Keep calculations in integer units (wei) as long as possible (the backend already does this in parts of [`estimateWrapFee()`](conceal-wswap/units/contract.js:155)).
- Avoid repeated RPC calls:
  - One `getFeeData()` per payout attempt (already used in [`transferFunds()`](conceal-wswap/units/contract.js:97))
  - Cache provider config and ABI in memory (already done in [`SwapContract`](conceal-wswap/units/contract.js:14))

---

## Common pitfalls (agent checklist)

### Address + network mismatches
- Ensure provider IDs match between UX network keys ([`EVM_NETWORK_KEYS`](concael-bridge-ux/src/app/core/bridge-types.ts:3)) and backend provider IDs ([`getProviderConfig()`](conceal-wswap/units/contract.js:88)).
- Ensure `chainId` is correct; ethers v6 is strict about networks (see network initialization in [`SwapContract`](conceal-wswap/units/contract.js:42)).

### Units and decimals
- `coinUnits.wccx` is configured in [`config.json.sample`](conceal-wswap/config.json.sample:94) (commonly `1_000_000` for 6 decimals).
- Backend uses that unit scalar in [`transferFunds()`](conceal-wswap/units/contract.js:109) and balance parsing in [`getWalletBalance()`](conceal-wswap/units/contract.js:250).
- If the contract decimals differ from config, everything breaks. Treat units mismatch as a critical configuration error.

### Confirmations and “too old” transactions
- Confirmation thresholds come from provider config in [`config.json.sample`](conceal-wswap/config.json.sample:25) and are used when waiting/validating txs in [`getTxInfo()`](conceal-wswap/units/contract.js:204) and [`waitForTransaction()`](conceal-wswap/units/contract.js:269).
- Fee tx age is guarded by `maxTxBlockAge` in provider config (defaults to 5 in [`SwapContract`](conceal-wswap/units/contract.js:45)).

---

## Security notes (keys, ABI, and trust boundaries)

- Backend hot wallet credentials live in config as either a mnemonic or private key (see provider `account` fields in [`config.json.sample`](conceal-wswap/config.json.sample:25)).
- These secrets must never appear in:
  - frontend source
  - committed config
  - logs (avoid printing whole config objects)

Agent rule:
- If you need to add new provider credentials, treat it as **secret management** (environment injection / secure storage), not a code change.

---

## Adding a new EVM chain/provider (high-level steps)

1) Backend: add a provider entry in the deployed config (model it after [`config.json.sample`](conceal-wswap/config.json.sample:25))
2) Backend: add an ABI file (ERC-20 subset) similar to [`contract_bsc.abi`](conceal-wswap/contracts/contract_bsc.abi:1)
3) Backend: ensure the provider can be loaded by [`SwapContract`](conceal-wswap/units/contract.js:14) (RPC reachable, ABI path valid)
4) Frontend: decide whether the new chain should be part of [`EVM_NETWORK_KEYS`](concael-bridge-ux/src/app/core/bridge-types.ts:3)
5) End-to-end: verify tx validation works via [`getTxInfo()`](conceal-wswap/units/contract.js:204) and calldata parsing via [`decodeTransferData()`](conceal-wswap/units/contract.js:227)

---

## Related docs/specs in this repo

- Backend API behavior (init/exec/poll endpoints): [`backend_api.md`](concael-bridge-ux/ai_docs/backend_api.md:1)
- Error handling patterns for web3 + backend responses: [`error_handling.md`](concael-bridge-ux/ai_docs/error_handling.md:1)
- Wallet integration patterns (WalletConnect/MetaMask/etc.): [`wallets.md`](concael-bridge-ux/ai_docs/wallets.md:1)
- Security posture and constraints: [`security.md`](concael-bridge-ux/ai_docs/security.md:1)
- Future: explorer/history feature spec: [`bridge_explorer_and_history.md`](concael-bridge-ux/ai_spec/bridge_explorer_and_history.md:1)
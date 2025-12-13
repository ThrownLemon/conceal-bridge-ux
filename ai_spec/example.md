# Conceal Bridge UX — Spec-Based Design Plan

**Status**: Draft  
**Project**: `concael-bridge-ux` (Angular)  
**Last updated**: 2025-12-13  

## Goals & non-goals

- **Goals**
  - **Make CCX ↔ wCCX swaps understandable and safe** for non-technical users.
  - **Support 2 directions**: CCX → wCCX and wCCX → CCX.
  - **Support multiple EVM networks** (currently: Ethereum, BSC, Polygon).
  - **Minimize user error** (wrong network, wrong address, insufficient liquidity, pending wallet prompts).
  - **Be auditable and supportable** (display payment IDs, tx hashes, clear status, copy/share).

- **Non-goals**
  - **EVM ↔ EVM swaps** (explicitly not supported).
  - A full “bridge explorer” (history, account dashboards) beyond a single swap session.
  - Managing Conceal wallet operations (the user sends CCX using their own wallet).

## Product overview (what we’re building)

The bridge UX is a **guided swap flow** between:

- **Conceal Network (CCX)**: native chain asset the user sends/receives via a CCX wallet.
- **EVM network wCCX**: ERC-20 wrapped token the user sends/receives via an EVM wallet (MetaMask/WalletConnect/etc).

The UX must clearly communicate:

- **1:1 peg** between CCX and wCCX.
- **Two-step CCX → wCCX** (gas fee tx on EVM, then CCX deposit with payment ID).
- **One-step wCCX → CCX** (wCCX transfer on EVM; backend executes release; user receives CCX).
- **Waiting and confirmations** are normal.

Reference docs already in-repo:
- `ABOUT.md` (what wCCX is, supported ecosystems, links)
- `USER_GUIDE.md` (user-facing steps)

## Users & primary scenarios

- **Primary user**: a CCX holder who wants access to DeFi (wrap CCX).
- **Secondary user**: a wCCX holder who wants privacy/untraceability (unwrap back to CCX).

Primary scenarios:
- **S1 — Wrap**: User swaps **CCX → wCCX** on a selected EVM network.
- **S2 — Unwrap**: User swaps **wCCX → CCX** from their EVM wallet to a CCX address.

## Scope: supported networks & wallets

- **EVM networks**: `eth`, `bsc`, `plg` (network keys used by routing and backend URLs).
- **Wallet support**:
  - **Injected wallets** (MetaMask, Trust, etc.)
  - **WalletConnect v2** (if configured)
  - Optional: Binance Wallet provider (if present in browser)

## UX information architecture & routing

- **Home**: network selection + connect wallet CTA.
  - Constraint: **Exactly one side must be CCX**.
  - Navigates to `/swap/:direction/:network`.
- **Swap**: step-based flow for selected direction and network.
  - `/swap/ccx-to-evm/:network`
  - `/swap/evm-to-ccx/:network`
- **Legacy redirects**: `/eth`, `/bsc`, `/plg`, `/ccx` map into new routes.
- **404**: a simple not-found page.

## Core UX flows (functional spec)

### Flow A — CCX → wCCX (wrap)

**User intent**: “I have CCX; I want wCCX on an EVM network.”

**Step A1 — Collect inputs**
- Inputs:
  - **CCX from address** (string, validated)
  - **EVM recipient address** (0x address; can be “Use connected wallet”)
  - **Amount** (decimal)
  - **Email (optional)**
- Constraints:
  - Amount within **min/max** from backend config.
  - Must not exceed **available wCCX liquidity** (if provided).

**Step A2 — Wallet actions (gas fee payment)**
- Ensure wallet is connected.
- Ensure wallet is on the selected network (prompt switch/add if needed).
- Ask backend for:
  - Gas estimate for the swap amount
  - Gas price
- Send a **native EVM transaction** to the bridge’s EVM account address for the required fee.
- Wait for **N confirmations** (from backend config).
- UX requirements:
  - Show “Connecting wallet / switching network / estimating gas / sending / confirming” statuses.
  - Handle common wallet errors (user rejected, request pending).

**Step A3 — Initialize swap with backend**
- Call `swap/init` endpoint with:
  - amount, from CCX address, to EVM address, email (optional), and the EVM fee tx hash
- Backend returns **paymentId**.
- UX requirement:
  - Display paymentId clearly and allow copy.

**Step A4 — User sends CCX deposit**
- UI shows:
  - Bridge **CCX deposit address** (from config)
  - **Payment ID** to include
  - QR codes for both values
- User performs CCX transfer in their CCX wallet.
- UX requirement:
  - Explain that confirmations can take minutes; keep the page open.

**Step A5 — Poll & complete**
- Poll backend for swap state using paymentId.
- When result is true, show:
  - swapped amount
  - recipient address
  - swap tx hash
  - deposit tx hash

### Flow B — wCCX → CCX (unwrap)

**User intent**: “I have wCCX; I want CCX to a CCX address.”

**Step B1 — Collect inputs**
- Inputs:
  - CCX recipient address
  - Amount
  - Email (optional)
- Constraints:
  - Amount within min/max.
  - Must not exceed **available CCX liquidity** (if provided).

**Step B2 — Wallet actions (wCCX transfer)**
- Ensure wallet is connected and on selected network.
- Determine token decimals from config (`units` → decimals) with sane fallback.
- Read ERC-20 balance to confirm sufficient wCCX.
- Ask wallet to execute `transfer(to=bridgeEvmAccount, amount)`.
- Wait for confirmations.
- UX requirement:
  - Show tx hash and status.
  - Provide “Add wCCX token” helper (wallet_watchAsset or manual fallback).

**Step B3 — Backend init/exec**
- Call backend `swap/init` with from EVM address, to CCX address, tx hash, amount, email.
- Call backend `swap/exec` with paymentId (and optional email).
- UX requirements:
  - Clear messaging about “processing” vs “complete”.

**Step B4 — Poll & complete**
- Poll backend for swap state until completion.
- Show same completion summary fields as Flow A.

## Backend integration (API contract)

All endpoints are namespaced by network:

`{apiBaseUrl}/{networkKey}/...`

Required endpoints (as implemented in the app today):
- **Chain config**
  - `GET /config/chain` → `BridgeChainConfig`
- **Liquidity**
  - `GET /api/balance/ccx` → `{ result, balance }`
  - `GET /api/balance/wccx` → `{ result, balance }`
- **Fees**
  - `POST /api/ccx/wccx/estimateGas` body `{ amount }` → `{ result, gas }`
  - `GET /api/ccx/wccx/getGasPrice` → `{ result, gas }`
- **Swap**
  - `POST /api/ccx/wccx/swap/init` → `{ success, paymentId?, error? }`
  - `POST /api/wccx/ccx/swap/init` → `{ success, paymentId?, error? }`
  - `POST /api/wccx/ccx/swap/exec` → `{ success, paymentId?, error? }`
  - `POST /api/ccx/wccx/tx` body `{ paymentId }` → swap state
  - `POST /api/wccx/ccx/tx` body `{ paymentId }` → swap state

### Required config fields

Backend must provide per-network `BridgeChainConfig`:
- **common**: min/max swap amounts
- **wccx**:
  - EVM chain id
  - confirmations required
  - wCCX contract address (+ optional ABI)
  - bridge EVM account address (recipient for gas fee or token transfer)
  - units scalar (used to infer token decimals)
- **ccx**:
  - bridge CCX deposit address
  - units scalar
- **tx**:
  - gas multiplier (if used by backend calculations)

## State model (implementation-facing)

### View state per swap session
- **route params**: direction, networkKey
- **remote state**:
  - chain config
  - ccx liquidity
  - wccx liquidity
- **wallet state**:
  - address (optional)
  - chainId (optional)
  - connector (optional)
  - disconnected-by-user flag (sticky)
- **swap session state**:
  - step (0/1/2)
  - busy flag
  - paymentId
  - evm tx hash
  - swap completion payload
  - status message / error

### Polling behavior
- Poll every **10 seconds**
- Stop on first `result === true`
- Must be cancellable by navigating away / destroying page

## Error handling & UX requirements

- **Wallet not installed**
  - Provide WalletConnect path (if configured) and clear instructions.
- **Wrong network**
  - Prompt chain switch; handle error codes:
    - 4001: user rejected
    - -32002: request already pending
- **Insufficient liquidity**
  - Show a clear “not enough funds to cover this transfer” message.
- **Invalid addresses**
  - Validate early with form feedback; show “Invalid CCX/EVM address”.
- **Backend unavailable**
  - Show a top-level error and a “Start over” path.
- **Clipboard unavailable**
  - Provide fallback messaging when copy fails.

## Security & privacy considerations

- **Do not store secrets** in local storage (only a “disconnected by user” flag is acceptable).
- **Never ask users for seed phrases** or wallet private info.
- **Display addresses and hashes in copyable form**; avoid truncating in places where copy would be ambiguous.
- **Email is optional** and should be treated as PII:
  - Document usage (“notifications/support only”)
  - Ensure it is not logged client-side.

## Accessibility & quality requirements (non-functional)

- **Accessibility**
  - Must pass **AXE** checks and meet **WCAG AA** (focus, contrast, semantics).
  - All interactive elements need accessible names; menus should be keyboard navigable.

- **Performance**
  - Keep initial bundle within budget (Angular production budget is configured).
  - Prefer lazy routes and small, focused components.

- **Reliability**
  - App should not hard-fail on wallet hydration or metadata fetch failures.
  - All network operations need user-visible status and safe recovery paths.

## Observability (what we should log/measure)

If/when analytics is added, track only minimal, privacy-preserving events:
- `wallet_connect_clicked`, `wallet_connected`, `wallet_switch_requested`, `wallet_switch_success`, `wallet_switch_error`
- `swap_started` (direction, network), `swap_step_completed` (step id)
- `swap_completed` (direction, network), `swap_failed` (error category)

Avoid logging addresses, payment IDs, or emails to analytics by default.

## Acceptance criteria (definition of done)

- **Routing**
  - Home leads to swap route; legacy routes redirect correctly.
- **Flow correctness**
  - CCX → wCCX: gas fee tx → init → deposit instructions → poll → completion.
  - wCCX → CCX: token transfer → init+exec → poll → completion.
- **Validation**
  - Amount min/max and liquidity checks block invalid swaps with clear messages.
  - Address validation prevents obvious mistakes.
- **Wallet handling**
  - Connect, switch network, and common wallet error codes are handled gracefully.
- **A11y**
  - Passes AXE on main flows (home + swap).

## Roadmap (suggested milestones)

- **M1 — Spec alignment**
  - Confirm copy, terminology, and error messages with stakeholders.
  - Confirm which networks are “production” vs “coming soon”.

- **M2 — UX hardening**
  - Add explicit progress UI for confirmations and polling.
  - Add “resume swap by paymentId” entry point (optional enhancement).

- **M3 — Supportability**
  - Add a “Help” panel that includes links to docs, explorers, and support contact.
  - Add non-invasive analytics (optional).



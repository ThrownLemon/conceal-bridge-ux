# Security Guide — conceal Bridge UX (AI Agent)

This guide defines **security requirements and safe implementation rules** for the conceal Bridge UX frontend. It is written to inform AI-assisted changes so features remain safe-by-default.

Core references in this repo:

- Swap flow + validations: [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:400)
- Wallet integration: [`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:34)
- Wallet UI: [`WalletButtonComponent`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:309)
- Backend API client: [`BridgeApiService`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:13)
- Backend-provided chain config shape: [`BridgeChainConfig`](conceal-bridge-ux/src/app/core/bridge-types.ts:8)
- Hosting security (CSP/headers): [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1)

---

## 1) Threat model (what we defend against)

The frontend must assume:

- The browser is a hostile environment (extensions, injected scripts, malicious iframes).
- Users can be tricked (phishing / spoofed UI / wrong network).
- Remote dependencies can be unavailable or compromised (supply chain).
- Backend data is **not inherently trustworthy** (it can be misconfigured or attacked). Treat it as untrusted input even if it’s “our” backend.

We mainly defend user funds and user privacy by:

- validating inputs
- minimizing signing surface
- preventing unsafe retries / double actions
- reducing injection/XSS risk via CSP and safe Angular patterns

---

## 2) Security principles for this codebase

1. **Never handle secrets**
   - Never request, store, log, or transmit private keys / seed phrases.
   - The app only interacts with wallets through providers and viem clients (see [`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:34)).

2. **Validate before you act**
   - Validate addresses/amounts and config-derived addresses before sending txs or making irreversible backend calls (see validation patterns in [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:598)).

3. **Minimize signature/transaction requests**
   - Only request exactly the permissions and RPC methods needed.
   - Do not add message signing or typed-data signing flows unless required and clearly documented.

4. **Prefer explicit user confirmation**
   - Make the user aware of network, recipient, and amounts before triggering wallet actions.

5. **No dangerous DOM patterns**
   - Do not introduce raw HTML rendering or bypass sanitization in templates. Keep Angular template binding and default escaping.

---

## 3) Input validation (addresses, amounts, config-derived values)

### 3.1 User-provided addresses

Current patterns:

- CCX address: validated via [`CCX_ADDRESS_RE`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:19) and [`Validators.pattern()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:449)
- EVM address: validated via [`isAddress()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:9) and [`Validators.pattern()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:453)

Rules:

- Always validate addresses at **two layers**:
  1. form validation (Angular validators) and
  2. runtime checks before use (see runtime checks in [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:637) and [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:759)).
- Never “auto-correct” CCX addresses. If invalid, fail with a clear message and require user correction.
- For EVM addresses, prefer strict viem validation via [`isAddress()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:9) prior to:
  - backend init calls
  - contract transfers
  - token watch/add operations

### 3.2 Amount validation (numeric parsing, bounds, decimals)

Current rules already implemented:

- numeric input is parsed and checked: [`Number.parseFloat()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:618)
- bounds are enforced via backend config: [`BridgeChainConfig.common.minSwapAmount`](conceal-bridge-ux/src/app/core/bridge-types.ts:10) / [`BridgeChainConfig.common.maxSwapAmount`](conceal-bridge-ux/src/app/core/bridge-types.ts:10)
- token decimals are inferred from config “units”: [`inferDecimalsFromUnits()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:30)

Rules:

- Keep min/max enforcement aligned to [`BridgeChainConfig.common`](conceal-bridge-ux/src/app/core/bridge-types.ts:9).
- Do not accept NaN, infinity, negative, or zero.
- When converting to on-chain units, always use config-derived decimals/units (example: [`parseUnits()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:779)).
- Avoid floating-point arithmetic for on-chain values; only parse floats for UI input, then convert via [`parseUnits()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:779) or [`parseEther()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:9).

### 3.3 Config-derived values are untrusted input

The frontend receives chain config from the backend via [`BridgeApiService.getChainConfig()`](conceal-bridge-ux/src/app/core/bridge-api.service.ts:26). This config includes:

- contract addresses: [`BridgeChainConfig.wccx.contractAddress`](conceal-bridge-ux/src/app/core/bridge-types.ts:18)
- bridge recipient addresses: [`BridgeChainConfig.wccx.accountAddress`](conceal-bridge-ux/src/app/core/bridge-types.ts:15)
- chainId: [`BridgeChainConfig.wccx.chainId`](conceal-bridge-ux/src/app/core/bridge-types.ts:16)

Rules:

- Before using config addresses in wallet operations, validate them with viem address checks:
  - Example of validating a config address already exists: [`isAddress()` check for `bridgeEvmAccount`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:672).
- If config is missing or invalid, treat it as a page-blocking issue and fail safe (see how config load errors set [`pageError`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:445)).

---

## 4) Transaction signing & on-chain interactions (EVM)

### 4.1 Never sign arbitrary data by default

This app’s primary actions are:

- send a native transfer for gas fee payment: [`EvmWalletService.sendNativeTransaction()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:245)
- transfer ERC-20 wCCX: [`walletClient.writeContract()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:794)

Rules:

- Do not introduce “sign message” authentication or typed-data signing unless explicitly required and reviewed.
- If you must add signing, scope it tightly and document:
  - exact message format
  - replay protections (nonce, domain, expiry)
  - how the backend verifies it

### 4.2 Chain safety (network switching)

Before any transaction, ensure the wallet is on the correct chain:

- the project uses [`EvmWalletService.ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:205) in swap flows.

Rules:

- Always call [`EvmWalletService.ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:205) using the chain from [`EVM_NETWORKS`](conceal-bridge-ux/src/app/core/evm-networks.ts:11) before sending txs or contract writes.
- Handle chain-add behavior safely (MetaMask missing chain code `4902` is already handled in [`EvmWalletService.ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:213)).

### 4.3 Confirmation and finality

The swap uses confirmation waiting:

- [`EvmWalletService.waitForReceipt()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:265)
- configured confirmations: [`BridgeChainConfig.wccx.confirmations`](conceal-bridge-ux/src/app/core/bridge-types.ts:17)

Rules:

- Never treat “transaction hash returned” as final.
- Wait for configured confirmations before calling backend init/exec endpoints (current pattern in [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:686) and [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:804)).

---

## 5) Secrets & storage rules

### 5.1 Private keys / seed phrases

Absolute rules:

- Never ask for or accept seed phrases or private keys in UI or logs.
- Never store secrets in:
  - local storage
  - session storage
  - query params
  - analytics/telemetry payloads

Wallet connection uses providers; any wallet secrets remain inside the wallet.

### 5.2 Local storage usage must remain non-sensitive

The app stores a single non-sensitive flag:

- [`EvmWalletService.DISCONNECTED_STORAGE_KEY`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:38)
- reads via [`window.localStorage.getItem()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:392)
- writes via [`window.localStorage.setItem()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:402)

Rules:

- Never store wallet addresses, tx hashes, payment IDs, emails, or amounts in storage unless there’s a strong product requirement and it’s reviewed.
- Treat any persisted user data as potentially exfiltratable.

### 5.3 Don’t leak sensitive config in logs

Runtime config includes:

- backend base URL: [`AppConfig.apiBaseUrl`](conceal-bridge-ux/src/app/core/app-config.ts:8)

Rules:

- Avoid logging config values in production builds.
- Never log full error objects that might include request URLs with tokens (if added in the future).

---

## 6) Phishing prevention & safe UX

### 6.1 External links must not enable tab-nabbing

External links in the UI already follow good practice:

- `target="_blank"` + `rel="noopener"` as used in [`HomePage`](conceal-bridge-ux/src/app/pages/home/home.page.ts:169)

Rules:

- Any new external link must include the same protections as in [`HomePage`](conceal-bridge-ux/src/app/pages/home/home.page.ts:169).
- Prefer linking to official wallet download pages used in [`WalletButtonComponent.connectorInstallUrl()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:495).

### 6.2 Never ask users to “verify wallet” by sharing secrets

Rules:

- Never show instructions that request:
  - seed phrase
  - private key
  - remote desktop access
- Wallet support guidance should instead point users to:
  - verifying domain
  - checking wallet prompts
  - checking explorer links for tx hashes

### 6.3 Display critical transaction details for user verification

In swap flows, the user should always be able to verify:

- recipient addresses (bridge deposit address, recipient)
- payment ID
- transaction hash

Current UI displays:

- payment ID and QR code: [`paymentId`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:441)
- CCX deposit address from config: [`BridgeChainConfig.ccx.accountAddress`](conceal-bridge-ux/src/app/core/bridge-types.ts:25)

Rules:

- Any new flow that triggers a wallet prompt must ensure the user can see what they are signing (network + destination + value).

---

## 7) Contract verification requirements (wCCX interactions)

The app interacts with:

- token contract address from backend config: [`BridgeChainConfig.wccx.contractAddress`](conceal-bridge-ux/src/app/core/bridge-types.ts:18)
- transfer call uses a minimal ERC-20 ABI: [`erc20Abi`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:39)

Rules:

- Validate contract address from config before:
  - adding token: [`SwapPage.addTokenToWallet()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:540)
  - reading balance: [`publicClient.readContract()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:782)
  - transferring: [`walletClient.writeContract()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:794)
- Ensure chain matches config before contract interactions:
  - use [`EvmWalletService.ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:205) with the chain selected from [`EVM_NETWORKS`](conceal-bridge-ux/src/app/core/evm-networks.ts:11)
- Do not dynamically execute untrusted ABIs:
  - backend config includes an optional ABI field [`BridgeChainConfig.wccx.contractAbi`](conceal-bridge-ux/src/app/core/bridge-types.ts:19); if used in the future, it must be treated as untrusted and verified against a known allowlist.

---

## 8) “Slippage protection” in this project (what it means here)

This bridge is not a DEX swap, so classic AMM slippage protection does not directly apply. The analogous protections are:

- enforce min/max amount bounds from config: [`BridgeChainConfig.common`](conceal-bridge-ux/src/app/core/bridge-types.ts:9)
- prevent decimal/units mistakes via [`inferDecimalsFromUnits()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:30) and unit conversion via [`parseUnits()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:779)
- prevent bridge liquidity mismatch:
  - CCX→EVM checks wCCX liquidity: [`SwapPage.startCcxToEvm()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:629)
  - EVM→CCX checks CCX liquidity: [`SwapPage.startEvmToCcx()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:751)

Rules:

- Never silently adjust user-entered amounts.
- Never proceed when liquidity checks indicate insufficient bridge funds.

---

## 9) Web security headers & CSP (deployment requirement)

This app is a static Angular SPA (bootstrapped via [`bootstrapApplication()`](conceal-bridge-ux/src/main.ts:1)) and must rely on hosting/CDN headers for baseline hardening.

Rules:

- Follow the deployment spec in [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1).
- Keep CSP tight and iterate using report-only rollout as described in [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:41).
- Minimize external asset hosts:
  - prefer local assets in [`conceal-bridge-ux/public/`](conceal-bridge-ux/public:1)
  - be deliberate about `connect-src` allowlists for:
    - backend base URL from [`AppConfig.apiBaseUrl`](conceal-bridge-ux/src/app/core/app-config.ts:8)
    - chain metadata API host used by [`EvmChainMetadataService`](conceal-bridge-ux/src/app/core/evm-chain-metadata.service.ts:43)

---

## 10) AI agent checklist before merging security-sensitive changes

Before finalizing any change that touches wallet, transactions, config, or external connectivity, verify:

- Input validation remains strict (see [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:400)).
- Wallet operations remain scoped to required actions (see [`EvmWalletService.sendNativeTransaction()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:245) and [`walletClient.writeContract()`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:794)).
- No new secret-handling was introduced (see storage usage in [`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:389)).
- External links are safe (see [`HomePage`](conceal-bridge-ux/src/app/pages/home/home.page.ts:169)).
- CSP/headers implications are updated if new external hosts are used (see [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:150)).

---

## Related docs/specs in this repo

- Error taxonomy and safe user messaging: [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:1)
- Backend endpoint behavior and response shapes: [`backend_api.md`](conceal-bridge-ux/docs/backend_api.md:1)
- Wallet security constraints and provider behavior: [`wallets.md`](conceal-bridge-ux/docs/wallets.md:1)
- Smart contract (wCCX ERC-20) trust boundaries and tx verification: [`smart_conctracts.md`](conceal-bridge-ux/docs/smart_conctracts.md:1)
- HTTP error-handling roadmap (timeouts/retries/interceptor plan): [`http_and_error_handling.md`](conceal-bridge-ux/ai_spec/http_and_error_handling.md:1)
- CSP + security headers deployment plan: [`security_headers_and_csp.md`](conceal-bridge-ux/ai_spec/security_headers_and_csp.md:1)
- Testing strategy for security- and wallet-sensitive flows: [`testing.md`](conceal-bridge-ux/docs/testing.md:1)

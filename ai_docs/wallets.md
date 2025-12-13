# Wallets Guide — Concael Bridge UX (AI Agent)

This guide documents **how wallet integration works in this repo** and the conventions the AI agent must follow when implementing wallet-related changes.

Primary implementation references:
- Wallet integration service: [`EvmWalletService`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:34)
- Wallet UI + connect modal: [`WalletButtonComponent`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:309)
- Supported networks: [`EVM_NETWORKS`](concael-bridge-ux/src/app/core/evm-networks.ts:11)
- Config (WalletConnect project ID): [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17)

Upstream docs used (Context7):
- WalletConnect supported methods/events (WalletConnect docs, see list summarized below).

---

## 1) Supported wallets (current project behavior)

The app supports these connectors (see [`WalletConnectorId`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:23)):

- **Injected wallets**
  - MetaMask (detected via `window.ethereum.isMetaMask`, see [`isConnectorAvailable()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:77))
  - Trust Wallet (detected via Trust flags OR “not MetaMask”, see [`isConnectorAvailable()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:86))
- **Binance Wallet**
  - detected via `window.BinanceChain` (see [`hasBinanceProvider`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:58) and [`#binanceProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:292))
- **WalletConnect v2**
  - using `@walletconnect/ethereum-provider` (see [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:298))

**Rule:** do not add “random injected wallets” as separate connectors unless there is a concrete detection mechanism and a UX reason. The current UX is intentionally simple: MetaMask, Trust, Binance, WalletConnect.

---

## 2) WalletConnect setup & configuration

### 2.1 WalletConnect Project ID
WalletConnect v2 requires a project ID. In this repo it is read from [`AppConfig.walletConnectProjectId`](concael-bridge-ux/src/app/core/app-config.ts:11) and exposed via [`walletConnectConfigured`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:62).

- UI disables WalletConnect when missing (see button disable logic around [`wallet.walletConnectConfigured()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:289)).
- Service throws a clear error when missing (see [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:300)).

**Rule:** never hardcode project IDs in code changes; treat the config as deployment-owned and allow override.

### 2.2 WalletConnect provider initialization (what we do)
WalletConnect provider is initialized here:
- [`EthereumProvider.init()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:308)

Current init options in this repo:
- `projectId`: from [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17)
- `chains`: `[1, 56, 137]` (Ethereum, BSC, Polygon) (see [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:311))
- `showQrModal: true` (WalletConnect will show a QR modal) (see [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:312))
- requested `methods` and `events` (see [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:315))

WalletConnect docs (via Context7) list common supported methods and events; the project’s list is deliberately smaller. Keep it that way.

**Rule:** keep WalletConnect `methods` **minimal** and aligned with what the app actually uses.

---

## 3) Connection flows (UI ↔ service)

### 3.1 Hydration (no prompts)
On app startup the wallet state is hydrated without prompting:
- [`hydrate()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:114)
- uses `eth_accounts` and `eth_chainId` through viem clients (see comment at [`hydrate()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:110))

Hydration failures are swallowed by design (see `catch {}` in [`hydrate()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:118)).

**Rule:** never introduce wallet permission prompts during hydration or app bootstrap.

### 3.2 Connect (default injected)
The “default” connect path (legacy behavior) is:
- [`connect()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:134)

It:
- selects the injected provider (`window.ethereum`)
- calls [`walletClient.requestAddresses()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:142)
- stores the selected address and refreshes chainId

If there’s no injected provider, it throws a user-readable error:
- “No injected EVM wallet detected.” (see [`connect()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:138))

### 3.3 Connect with a specific connector (MetaMask/Trust/Binance/WalletConnect)
The UI generally uses:
- [`WalletButtonComponent.connect()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:449)

Which calls:
- [`connectWith()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:152)

Key behavior:
- WalletConnect providers require `connect()` before `request()` calls:
  - see the explicit step in [`connectWith()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:157)

**Rule:** preserve this WalletConnect ordering; do not assume `requestAddresses()` will work without an established session.

---

## 4) Disconnection flows (and why they are tricky)

Disconnect behavior is implemented in:
- [`disconnect()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:173)

Current best-effort behavior:
1. Try to perform an ERC-7846 disconnect (if supported) via:
   - dynamic import [`import('viem/experimental')`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:182)
2. Call provider-level disconnect (if the provider supports it) (see [`provider?.disconnect?.()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:189))
3. Clear local state (`address`, `chainId`, `connector`)
4. Special-case WalletConnect: fully clear provider/session (see the WalletConnect branch in [`disconnect()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:197))

Additionally, we persist a “user disconnected” flag in localStorage:
- key: [`DISCONNECTED_STORAGE_KEY`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:38)
- written in [`#setDisconnectedFlag()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:398)

This prevents automatic re-hydration of accounts after a user explicitly disconnects (see conditional in [`hydrate()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:120)).

**Rule:** do not remove the disconnect flag behavior; it is user-respecting and avoids “mysterious reconnects.”

---

## 5) Account switching handling

The wallet service subscribes to provider events in:
- [`#setProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:359)

It listens for:
- `accountsChanged` → updates address (see handler at [`onAccountsChanged`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:366))
- `chainChanged` → updates `chainId` (see handler at [`onChainChanged`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:375))

Important nuance:
- If the user explicitly disconnected in-app, we ignore account changes and keep address `null` (see guard in [`onAccountsChanged`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:367)).

**Rule:** account switching should update UI immediately, but must respect the “disconnected by user” flag.

---

## 6) Network switching logic (EVM chains)

The app supports switching among:
- Ethereum Mainnet (1)
- BNB Smart Chain (56)
- Polygon (137)

These are defined in [`EVM_NETWORKS`](concael-bridge-ux/src/app/core/evm-networks.ts:11).

Network switching is performed via:
- [`ensureChain()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:205)

This:
- calls `wallet_switchEthereumChain` through viem’s wallet client
- if it fails with MetaMask “unknown chain” error `4902`, it calls `wallet_addEthereumChain` then retries (see branch in [`ensureChain()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:213))
- refreshes `chainId` in `finally` (see [`refreshChainId()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:220))

The header wallet UI includes a network menu that calls:
- [`WalletButtonComponent.switchNetwork()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:403)

**Rule:** always use [`ensureChain()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:205) for network switching; do not reimplement RPC calls in components.

---

## 7) Error handling conventions for wallet flows

Wallet errors are often provider-specific; we normalize user-facing messages in the wallet UI:
- [`friendlyError()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466)

Recognize these key codes across the app:
- `4001`: user rejected/cancelled (see handling in [`friendlyError()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:468))
- `-32002`: request already pending (see handling in [`friendlyError()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:469))

Network switching in the header follows the same conventions:
- see catch mapping in [`switchNetwork()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:411)

**Rule:** do not scatter wallet error string parsing across the app. Extend [`friendlyError()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466) and reuse it where possible.

---

## 8) WalletConnect QR behavior vs “our QR code generation”

There are two separate “QR” concepts:

### 8.1 WalletConnect QR (for mobile wallets)
WalletConnect QR is handled by WalletConnect itself, because we set:
- `showQrModal: true` in [`EthereumProvider.init()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:312)

That QR modal is for pairing a mobile wallet with the dApp session.

**Rule:** do not replace WalletConnect’s QR modal with our own QR generator unless there is a strong product requirement and a complete pairing UX design.

### 8.2 App QR code component (for bridge/payment UX)
Our QR generator component:
- [`QrCodeComponent`](concael-bridge-ux/src/app/shared/qr-code/qr-code.component.ts:28)

This is used for things like:
- CCX deposit address QR
- payment ID QR
(see usage in [`SwapPage`](concael-bridge-ux/src/app/pages/swap/swap.page.ts:216))

**Rule:** use [`QrCodeComponent`](concael-bridge-ux/src/app/shared/qr-code/qr-code.component.ts:28) only for app-domain data (addresses/payment IDs), not WalletConnect session pairing.

---

## 9) Security notes (wallet-specific)

- Never request or handle seed phrases/private keys. Wallet access happens via provider RPC only (see provider shape in [`Eip1193Provider`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:15)).
- Keep requested WalletConnect methods minimal; avoid adding `wallet_*` capabilities unless necessary and reviewed (WalletConnect docs list many possible methods/events; we request only what we use, see list in [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:315)).

---

## 10) Troubleshooting rules (for AI agent changes)

When users report wallet issues, diagnose using these facts:

1. “Connect Wallet” does nothing:
   - likely no injected provider; error should match “No wallet extension detected…” from [`friendlyError()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:475)

2. “WalletConnect button disabled”:
   - WalletConnect not configured; see the UI disable logic in [`WalletButtonComponent`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:289) and config in [`APP_CONFIG`](concael-bridge-ux/src/app/core/app-config.ts:17)

3. Network switch fails:
   - common causes: user canceled (`4001`) or request pending (`-32002`)
   - handled in [`switchNetwork()`](concael-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:411)

4. Wallet appears to reconnect after disconnect:
   - should not happen because we persist the user disconnect flag in [`#setDisconnectedFlag()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:398)
   - if it does, check whether new code bypassed that logic.

---

## 11) Upstream WalletConnect method/event reference (for alignment)

WalletConnect docs list common supported methods and events (Context7 summary). Examples include:
- methods like `eth_accounts`, `eth_requestAccounts`, `eth_sendTransaction`, `personal_sign`, `wallet_switchEthereumChain`, `wallet_addEthereumChain`, `wallet_watchAsset`
- events like `chainChanged`, `accountsChanged`, `disconnect`, `connect`

**Rule:** the app should only request the subset it needs (see the exact method/event lists in [`#resolveProvider()`](concael-bridge-ux/src/app/core/evm-wallet.service.ts:315)).

---

## Related docs/specs in this repo

- Wallet error mapping and user-facing messaging rules: [`error_handling.md`](concael-bridge-ux/ai_docs/error_handling.md:1)
- Backend API (init/exec/poll endpoints) and response shapes that wallet flows drive: [`backend_api.md`](concael-bridge-ux/ai_docs/backend_api.md:1)
- Smart contract & on-chain verification patterns (wCCX ERC-20, calldata decoding): [`smart_conctracts.md`](concael-bridge-ux/ai_docs/smart_conctracts.md:1)
- Security constraints for wallet integration (no secrets, safe links, CSP considerations): [`security.md`](concael-bridge-ux/ai_docs/security.md:1)
- Testing strategy for wallet-heavy flows (mocking providers/viem, E2E plan): [`testing.md`](concael-bridge-ux/ai_docs/testing.md:1)
- Web3 implementation notes (viem patterns; treat as supplemental to actual code): [`web3_integrations.md`](concael-bridge-ux/ai_docs/web3_integrations.md:1)
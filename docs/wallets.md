# Wallets Guide — conceal Bridge UX (AI Agent)

This guide documents **how wallet integration works in this repo** and the conventions the AI agent must follow when implementing wallet-related changes.

Primary implementation references:
- Wallet integration service: [`EvmWalletService`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:34)
- Wallet UI + connect modal: [`WalletButtonComponent`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:309)
- Supported networks: [`EVM_NETWORKS`](conceal-bridge-ux/src/app/core/evm-networks.ts:11)
- Config: [`APP_CONFIG`](conceal-bridge-ux/src/app/core/app-config.ts:17)

---

## 1) Supported wallets (current project behavior)

The app supports these connectors (see [`WalletConnectorId`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:23)):

- **Injected wallets**
  - MetaMask (detected via `window.ethereum.isMetaMask`, see [`isConnectorAvailable()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:77))
  - Trust Wallet (detected via Trust flags OR “not MetaMask”, see [`isConnectorAvailable()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:86))
- **Binance Wallet**
  - detected via `window.BinanceChain` (see [`hasBinanceProvider`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:58) and [`#binanceProvider()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:292))

**Rule:** do not add “random injected wallets” as separate connectors unless there is a concrete detection mechanism and a UX reason. The current UX is intentionally simple: MetaMask, Trust, Binance.

---

## 2) Connection flows (UI ↔ service)

### 2.1 Hydration (no prompts)
On app startup the wallet state is hydrated without prompting:
- [`hydrate()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:114)
- uses `eth_accounts` and `eth_chainId` through viem clients (see comment at [`hydrate()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:110))

Hydration failures are swallowed by design (see `catch {}` in [`hydrate()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:118)).

**Rule:** never introduce wallet permission prompts during hydration or app bootstrap.

### 2.2 Connect (default injected)
The “default” connect path (legacy behavior) is:
- [`connect()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:134)

It:
- selects the injected provider (`window.ethereum`)
- calls [`walletClient.requestAddresses()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:142)
- stores the selected address and refreshes chainId

If there’s no injected provider, it throws a user-readable error:
- “No injected EVM wallet detected.” (see [`connect()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:138))

### 2.3 Connect with a specific connector (MetaMask/Trust/Binance)
The UI generally uses:
- [`WalletButtonComponent.connect()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:449)

Which calls:
- [`connectWith()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:152)

---

## 3) Disconnection flows (and why they are tricky)

Disconnect behavior is implemented in:
- [`disconnect()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:173)

Current best-effort behavior:
1. Try to perform an ERC-7846 disconnect (if supported) via:
   - dynamic import [`import('viem/experimental')`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:182)
2. Call provider-level disconnect (if the provider supports it) (see [`provider?.disconnect?.()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:189))
3. Clear local state (`address`, `chainId`, `connector`)

Additionally, we persist a “user disconnected” flag in localStorage:
- key: [`DISCONNECTED_STORAGE_KEY`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:38)
- written in [`#setDisconnectedFlag()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:398)

This prevents automatic re-hydration of accounts after a user explicitly disconnects (see conditional in [`hydrate()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:120)).

**Rule:** do not remove the disconnect flag behavior; it is user-respecting and avoids “mysterious reconnects.”

---

## 4) Account switching handling

The wallet service subscribes to provider events in:
- [`#setProvider()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:359)

It listens for:
- `accountsChanged` → updates address (see handler at [`onAccountsChanged`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:366))
- `chainChanged` → updates `chainId` (see handler at [`onChainChanged`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:375))

Important nuance:
- If the user explicitly disconnected in-app, we ignore account changes and keep address `null` (see guard in [`onAccountsChanged`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:367)).

**Rule:** account switching should update UI immediately, but must respect the “disconnected by user” flag.

---

## 5) Network switching logic (EVM chains)

The app supports switching among:
- Ethereum Mainnet (1)
- BNB Smart Chain (56)
- Polygon (137)

These are defined in [`EVM_NETWORKS`](conceal-bridge-ux/src/app/core/evm-networks.ts:11).

Network switching is performed via:
- [`ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:205)

This:
- calls `wallet_switchEthereumChain` through viem’s wallet client
- if it fails with MetaMask “unknown chain” error `4902`, it calls `wallet_addEthereumChain` then retries (see branch in [`ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:213))
- refreshes `chainId` in `finally` (see [`refreshChainId()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:220))

The header wallet UI includes a network menu that calls:
- [`WalletButtonComponent.switchNetwork()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:403)

**Rule:** always use [`ensureChain()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:205) for network switching; do not reimplement RPC calls in components.

---

## 6) Error handling conventions for wallet flows

Wallet errors are often provider-specific; we normalize user-facing messages in the wallet UI:
- [`friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466)

Recognize these key codes across the app:
- `4001`: user rejected/cancelled (see handling in [`friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:468))
- `-32002`: request already pending (see handling in [`friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:469))

Network switching in the header follows the same conventions:
- see catch mapping in [`switchNetwork()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:411)

**Rule:** do not scatter wallet error string parsing across the app. Extend [`friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:466) and reuse it where possible.

---

### 8.2 App QR code component (for bridge/payment UX)
Our QR generator component:
- [`QrCodeComponent`](conceal-bridge-ux/src/app/shared/qr-code/qr-code.component.ts:28)

This is used for things like:
- CCX deposit address QR
- payment ID QR
(see usage in [`SwapPage`](conceal-bridge-ux/src/app/pages/swap/swap.page.ts:216))


---

## 9) Security notes (wallet-specific)

- Never request or handle seed phrases/private keys. Wallet access happens via provider RPC only (see provider shape in [`Eip1193Provider`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:15)).

---

## 10) Troubleshooting rules (for AI agent changes)

When users report wallet issues, diagnose using these facts:

1. “Connect Wallet” does nothing:
   - likely no injected provider; error should match “No wallet extension detected…” from [`friendlyError()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:475)


3. Network switch fails:
   - common causes: user canceled (`4001`) or request pending (`-32002`)
   - handled in [`switchNetwork()`](conceal-bridge-ux/src/app/shared/wallet/wallet-button.component.ts:411)

4. Wallet appears to reconnect after disconnect:
   - should not happen because we persist the user disconnect flag in [`#setDisconnectedFlag()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:398)
   - if it does, check whether new code bypassed that logic.

---



**Rule:** the app should only request the subset it needs (see the exact method/event lists in [`#resolveProvider()`](conceal-bridge-ux/src/app/core/evm-wallet.service.ts:315)).

---

## Related docs/specs in this repo

- Wallet error mapping and user-facing messaging rules: [`error_handling.md`](conceal-bridge-ux/docs/error_handling.md:1)
- Backend API (init/exec/poll endpoints) and response shapes that wallet flows drive: [`backend_api.md`](conceal-bridge-ux/docs/backend_api.md:1)
- Smart contract & on-chain verification patterns (wCCX ERC-20, calldata decoding): [`smart_conctracts.md`](conceal-bridge-ux/docs/smart_conctracts.md:1)
- Security constraints for wallet integration (no secrets, safe links, CSP considerations): [`security.md`](conceal-bridge-ux/docs/security.md:1)
- Testing strategy for wallet-heavy flows (mocking providers/viem, E2E plan): [`testing.md`](conceal-bridge-ux/docs/testing.md:1)
- Web3 implementation notes (viem patterns; treat as supplemental to actual code): [`web3_integrations.md`](conceal-bridge-ux/docs/web3_integrations.md:1)
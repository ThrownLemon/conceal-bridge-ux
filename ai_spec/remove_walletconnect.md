# Spec: Remove WalletConnect Integration

## 1. Context & Rationale
The project is experiencing build issues related to the `@walletconnect/ethereum-provider` dependency in the Angular environment. To ensure stability and simplify the maintenance burden, we will remove WalletConnect support entirely. The app will rely on injected providers (MetaMask, Trust Wallet, Binance Wallet, etc.) for EVM connectivity.

## 2. Architecture Changes

### A. Dependencies
- **Remove** `@walletconnect/ethereum-provider` from `package.json`.

### B. Configuration (`AppConfig`)
- **Remove** `walletConnectProjectId` from `AppConfig` interface and `APP_CONFIG` token factory in `src/app/core/app-config.ts`.
- **Remove** any build-time replacement logic (if it exists) related to this key.

### C. Wallet Service (`EvmWalletService`)
- **Remove** `walletconnect` from `WalletConnectorId` type.
- **Remove** `walletConnectConfigured` computed signal.
- **Remove** `#resolveProvider` case for `walletconnect` (and the dynamic import).
- **Remove** specific conditional logic for WalletConnect in `disconnect` (clearing session/listeners).
- **Refactor** `isConnectorAvailable` to remove the WalletConnect check.

### D. UI Components (`WalletButtonComponent`)
- **Remove** WalletConnect button/option from the "Connect Wallet" modal.
- **Remove** WalletConnect-specific error mapping (`friendlyError`).
- **Remove** QR code hint logic related to WalletConnect pairing.
- **Remove** `connectorConnectingHint` for WalletConnect.
- **Remove** `connectorInstallUrl` check for WalletConnect.

### E. Documentation
- **Update** `ai_docs/wallets.md` to reflect that WalletConnect is no longer supported.
- **Update** `ai_docs/security.md` if it references WalletConnect project IDs or secrets.

## 3. Impact Analysis

- **User Experience**: Users on mobile devices without an injected browser (like MetaMask browser) may lose easy connectivity if they relied solely on WC. However, most mobile users use dApp browsers (injected) anyway. Desktop users are unaffected if they use extensions.
- **Build**: Should resolve the Angular build errors associated with the WC dependency.
- **Code Size**: Significant reduction in bundle size by dropping the heavy WC provider.

## 4. Migration Steps
1. Uninstall npm package.
2. Strip config.
3. Refactor Service (fix type errors).
4. Refactor Component (fix template/logic).
5. Verify build and tests.

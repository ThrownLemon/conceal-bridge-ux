# Web3 Expert Mental Model

> **Context**: This file represents the "expert knowledge" for Web3/Blockchain interactions within the Conceal Bridge project.

## Library Stack

- **Primary Lib**: `viem` (Type-safe, lightweight).
- **Secondary**: `wagmi` (If React hooks were used, but since we are Angular, we mostly use direct Viem clients or a wrapper service).
- **Wallet Connection**: We manage this via a dedicated service (e.g., `EvmWalletService`).

## Patterns

### 1. BigInt Handling

- **Problem**: JavaScript `JSON.stringify` crashes on `BigInt` (returned by most ETH APIs).
- **Solution**: Always serialize/deserialize BigInts manually when logging or storing.
- **Helper**:

  ```typescript
  export function bigIntReplacer(key: string, value: any): any {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }
  ```

### 2. Provider Management

- **Rule**: Do NOT store the Provider object directly in a Signal without wrapping it or treating it as immutable.
- **Pattern**: Use RxJS `BehaviorSubject` for the active Provider/Signer, then expose as `toSignal` for views.

### 3. Error Handling

- **Common Errors**:
  - `User rejected request`: Handle gracefully (don't show a red error toast, maybe a warning or info).
  - `Insufficient funds`: Check balance _before_ initiating transaction to save gas estimates.

### 4. Contract Interactions

- **Safe Read**: Wrap read calls in try-catch blocks. Networks can be flaky.
- **Write Flows**:
  1. Estimate Gas.
  2. Send Transaction.
  3. **Wait for Receipt** (`waitForTransactionReceipt`). DO NOT assume success after 'send'.

## Security

- **Rule**: NEVER hardcode private keys.
- **Rule**: Validate all addresses using `isAddress` from viem before using.

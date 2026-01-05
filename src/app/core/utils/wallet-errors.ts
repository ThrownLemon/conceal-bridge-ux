/**
 * Wallet error code mapping utilities.
 *
 * Maps common wallet error codes (EIP-1193, JSON-RPC) to user-friendly messages.
 * Centralizes error handling logic for wallet interactions across the application.
 */

/** Standard wallet error structure as defined by EIP-1193 and JSON-RPC. */
export interface WalletError {
  /** Error code (e.g., 4001, -32002, 4902). */
  code?: number;
  /** Error message from the wallet/provider. */
  message?: string;
}

/** Known wallet error codes and their meanings. */
export enum WalletErrorCode {
  /** User rejected the request in their wallet. */
  USER_REJECTED = 4001,
  /** A request is already pending in the wallet (user needs to open wallet). */
  PENDING_REQUEST = -32002,
  /** Chain/network not found in the wallet. */
  CHAIN_NOT_FOUND = 4902,
  /** Internal JSON-RPC error (often indicates unsupported method). */
  INTERNAL_ERROR = -32603,
}

/**
 * Maps a wallet error code to a user-friendly message.
 *
 * Handles common wallet error codes from EIP-1193 (Ethereum Provider API)
 * and JSON-RPC 2.0 specifications. Falls back to a generic message or the
 * error's own message if the code is unknown.
 *
 * @param error - The error object from wallet interaction (unknown type for flexibility)
 * @param fallbackMessage - Optional custom message when error code is unrecognized
 * @returns User-friendly error message string
 *
 * @example
 * ```typescript
 * try {
 *   await wallet.ensureChain(chain);
 * } catch (e: unknown) {
 *   const message = getWalletErrorMessage(e, 'Failed to switch network.');
 *   this.statusMessage.set(message);
 * }
 * ```
 */
export function getWalletErrorMessage(
  error: unknown,
  fallbackMessage = 'Operation failed.',
): string {
  const walletError = error as WalletError;
  const code = walletError.code;

  switch (code) {
    case WalletErrorCode.USER_REJECTED:
      return 'Request was cancelled in your wallet.';

    case WalletErrorCode.PENDING_REQUEST:
      return 'A wallet request is already pending. Please open your wallet.';

    case WalletErrorCode.CHAIN_NOT_FOUND:
      return 'The requested network was not found in your wallet.';

    case WalletErrorCode.INTERNAL_ERROR:
      // -32603 often indicates unsupported method/operation
      // Check message for common patterns
      if (walletError.message && /not supported/i.test(walletError.message)) {
        return 'This operation is not supported by your wallet.';
      }
      return walletError.message || fallbackMessage;

    default:
      // Return the error's message if it's an Error instance, otherwise use fallback
      return error instanceof Error ? error.message : fallbackMessage;
  }
}

/**
 * Utilities for consistent error handling across the application.
 */

/**
 * Extracts a user-friendly error message from an unknown error value.
 *
 * @param error - The error value (can be Error, string, or unknown)
 * @param fallback - Default message if error cannot be parsed
 * @returns A string message suitable for display
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (e) {
 *   const message = getErrorMessage(e, 'Operation failed');
 *   this.statusMessage.set(message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Wallet error interface for typed error handling.
 * Wallet providers often include a `code` property for user cancellation (4001)
 * or other standard errors (-32603 for unsupported operations).
 */
export interface WalletError {
  code?: number;
  message?: string;
}

/**
 * Type guard to check if an error has a wallet error code.
 * Handles both Error instances with code property and plain objects with code.
 */
export function isWalletError(error: unknown): error is WalletError {
  if (error === null || typeof error !== 'object') {
    return false;
  }
  return 'code' in error && typeof (error as WalletError).code === 'number';
}

/**
 * Common wallet error codes.
 */
export const WALLET_ERROR_CODES = {
  /** User rejected the request in their wallet */
  USER_REJECTED: 4001,
  /** Operation not supported by wallet */
  UNSUPPORTED: -32603,
} as const;

import type { ZardToastService } from '@/shared/components/toast/toast.service';

export interface CopyToClipboardOptions {
  /** Success message to display in toast. Defaults to "Copied!". */
  successMessage?: string;
  /** Error message to display in toast. Defaults to "Copy failed (clipboard unavailable).". */
  errorMessage?: string;
  /** Context string for console warning on error (e.g., component name). */
  context?: string;
}

/**
 * Copies text to the clipboard with toast feedback.
 *
 * This utility centralizes clipboard copy logic used across SwapPage,
 * TransactionHistoryComponent, and WalletButtonComponent. It handles
 * text trimming, validation, clipboard API interaction, and user feedback
 * via toast notifications.
 *
 * @param text - The text to copy to clipboard
 * @param toast - Toast service instance for showing feedback
 * @param options - Optional configuration for messages and context
 * @returns Promise that resolves to true if copy succeeded, false otherwise
 *
 * @example
 * ```ts
 * const success = await copyToClipboard(
 *   'CCX7abc...',
 *   this.#toast,
 *   { successMessage: 'Address copied!', context: 'SwapPage' }
 * );
 * ```
 */
export async function copyToClipboard(
  text: string,
  toast: ZardToastService,
  options: CopyToClipboardOptions = {},
): Promise<boolean> {
  const value = text.trim();

  if (!value) {
    return false;
  }

  const {
    successMessage = 'Copied!',
    errorMessage = 'Copy failed (clipboard unavailable).',
    context = 'copyToClipboard',
  } = options;

  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
    return true;
  } catch (err) {
    console.warn(`[${context}] Clipboard copy failed:`, {
      err,
    });
    toast.error(errorMessage);
    return false;
  }
}

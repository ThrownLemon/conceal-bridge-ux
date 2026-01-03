import { Injectable, signal } from '@angular/core';

export interface ClipboardConfig {
  /** Message to display on successful copy. Default: 'Copied!' */
  successMessage?: string;
  /** Message to display on failed copy. Default: 'Copy failed' */
  errorMessage?: string;
  /** Timeout in milliseconds before clearing success status. Default: 1000 */
  successTimeout?: number;
  /** Timeout in milliseconds before clearing error status. Default: 3000 */
  errorTimeout?: number;
}

/**
 * Service for copying text to clipboard with auto-reset status feedback.
 *
 * @example
 * ```typescript
 * readonly #clipboard = inject(ClipboardService);
 *
 * async copyAddress(): Promise<void> {
 *   const success = await this.#clipboard.copy(this.wallet.address());
 *   if (!success) {
 *     console.error('Failed to copy address');
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  /** Current copy status message, or null if no status to display. */
  readonly status = signal<string | null>(null);

  /**
   * Copies text to the clipboard and sets status with auto-reset.
   *
   * @param text - The text to copy to clipboard
   * @param config - Optional configuration for messages and timeouts
   * @returns Promise that resolves to true on success, false on failure
   */
  async copy(text: string, config?: ClipboardConfig): Promise<boolean> {
    const value = text.trim();
    if (!value) return false;

    const successMessage = config?.successMessage ?? 'Copied!';
    const errorMessage = config?.errorMessage ?? 'Copy failed';
    const successTimeout = config?.successTimeout ?? 1000;
    const errorTimeout = config?.errorTimeout ?? 3000;

    try {
      await navigator.clipboard.writeText(value);
      this.status.set(successMessage);

      // Auto-reset after timeout, but only if status hasn't changed
      setTimeout(() => {
        if (this.status() === successMessage) {
          this.status.set(null);
        }
      }, successTimeout);

      return true;
    } catch {
      this.status.set(errorMessage);

      // Auto-reset after timeout, but only if status hasn't changed
      setTimeout(() => {
        if (this.status() === errorMessage) {
          this.status.set(null);
        }
      }, errorTimeout);

      return false;
    }
  }
}

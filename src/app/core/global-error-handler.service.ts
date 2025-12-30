import { ErrorHandler, Injectable, NgZone, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Represents an error that has been captured by the global error handler.
 */
export interface CapturedError {
  /** Unique identifier for the error instance */
  id: string;
  /** User-friendly error message */
  message: string;
  /** Original error object for debugging */
  originalError: unknown;
  /** Timestamp when the error occurred */
  timestamp: Date;
  /** Whether this is a chunk load error (lazy loading failure) */
  isChunkError: boolean;
  /** Whether this is a network-related error */
  isNetworkError: boolean;
}

/**
 * Global error handler that captures uncaught exceptions and provides
 * user-friendly error states for the application.
 *
 * This service implements Angular's ErrorHandler interface to:
 * - Catch and normalize all uncaught exceptions
 * - Detect chunk loading errors (lazy load failures)
 * - Detect network-related errors
 * - Provide recovery options (reload, navigate home)
 * - Log errors appropriately for debugging
 * - Rate-limit rapid error floods to prevent UI thrashing
 *
 * @example
 * ```typescript
 * // In app.config.ts, use useExisting to ensure the same singleton
 * // instance is used for both injection and Angular's error handling:
 * providers: [
 *   GlobalErrorHandler,
 *   { provide: ErrorHandler, useExisting: GlobalErrorHandler },
 * ]
 * ```
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  readonly #zone = inject(NgZone);
  readonly #router = inject(Router);

  /** Minimum milliseconds between displaying error UI to prevent flooding */
  static readonly ERROR_THROTTLE_MS = 1000;

  /** Timestamp of the last error that was displayed to the user */
  #lastErrorTime = 0;

  /**
   * Signal indicating whether the application is in an error state.
   * Used by the error boundary component to show the error UI.
   */
  readonly #hasError = signal(false);
  readonly hasError = this.#hasError.asReadonly();

  /**
   * Signal containing the current captured error details.
   * Null when no error is active.
   */
  readonly #currentError = signal<CapturedError | null>(null);
  readonly currentError = this.#currentError.asReadonly();

  /**
   * Handles an error caught by Angular's error handling mechanism.
   * This method is called automatically for uncaught exceptions.
   *
   * Protected by try-catch to prevent infinite recursion if internal
   * operations fail. Rate-limited to prevent UI thrashing from error floods.
   *
   * @param error - The error that was thrown
   */
  handleError(error: unknown): void {
    try {
      // Rate limit error display to prevent flooding
      const now = Date.now();
      if (now - this.#lastErrorTime < GlobalErrorHandler.ERROR_THROTTLE_MS) {
        // Still log the error even if we don't display it
        console.error('[GlobalErrorHandler] Error throttled:', error);
        return;
      }
      this.#lastErrorTime = now;

      // Extract the actual error from wrapped errors
      const unwrapped = this.#unwrapError(error);

      // Create a captured error object
      const captured = this.#createCapturedError(unwrapped);

      // Log the error for debugging
      this.#logError(captured, unwrapped);

      // Update the error state (run inside NgZone to trigger change detection)
      this.#zone.run(() => {
        this.#hasError.set(true);
        this.#currentError.set(captured);
      });
    } catch (internalError) {
      // Last-resort fallback: log to console without triggering handleError again
      console.error('[GlobalErrorHandler] Failed to handle error:', {
        originalError: error,
        internalError,
      });
    }
  }

  /**
   * Clears the current error state, allowing the application to continue.
   * Called when the user dismisses the error or navigates away.
   */
  clearError(): void {
    this.#hasError.set(false);
    this.#currentError.set(null);
  }

  /**
   * Reloads the current page to attempt recovery from the error.
   * Useful for chunk loading errors where a fresh load may succeed.
   */
  reload(): void {
    window.location.reload();
  }

  /**
   * Navigates to the home page and clears the error state.
   * Provides a way to recover from errors on specific pages.
   * Falls back to a hard redirect if router navigation fails.
   */
  goHome(): void {
    this.clearError();
    this.#zone.run(() => {
      this.#router.navigate(['/']).catch(() => {
        // Router navigation failed (guard blocked, router in bad state, etc.)
        // Fall back to a hard redirect which will reload the app
        window.location.href = '/';
      });
    });
  }

  /**
   * Unwraps nested error objects to get the root cause.
   * Angular sometimes wraps errors in additional objects.
   *
   * @param error - The potentially wrapped error
   * @returns The unwrapped root error
   */
  #unwrapError(error: unknown): unknown {
    // Handle Angular's ErrorEvent wrapper
    if (error instanceof ErrorEvent) {
      return error.error ?? error;
    }

    // Handle promise rejection events
    if (typeof error === 'object' && error !== null && 'rejection' in error) {
      return (error as { rejection: unknown }).rejection;
    }

    return error;
  }

  /**
   * Creates a normalized CapturedError object from the raw error.
   *
   * @param error - The raw error to capture
   * @returns A normalized CapturedError object
   */
  #createCapturedError(error: unknown): CapturedError {
    const isChunkError = this.#isChunkLoadError(error);
    const isNetworkError = this.#isNetworkError(error);

    let message: string;
    if (isChunkError) {
      message =
        'Failed to load part of the application. This usually means your connection was interrupted or the app was updated.';
    } else if (isNetworkError) {
      message =
        'Unable to connect to the server. Please check your internet connection and try again.';
    } else {
      message = 'An unexpected error occurred. Please try reloading the page.';
    }

    return {
      id: this.#generateErrorId(),
      message,
      originalError: error,
      timestamp: new Date(),
      isChunkError,
      isNetworkError,
    };
  }

  /**
   * Checks if the error is a chunk loading error (lazy load failure).
   * These occur when dynamic imports fail due to network issues or app updates.
   *
   * @param error - The error to check
   * @returns True if this is a chunk loading error
   */
  #isChunkLoadError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('loading chunk') ||
        message.includes('chunkloaderror') ||
        message.includes('failed to fetch dynamically imported module') ||
        error.name === 'ChunkLoadError'
      );
    }
    return false;
  }

  /**
   * Checks if the error is network-related.
   *
   * @param error - The error to check
   * @returns True if this is a network error
   */
  #isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('offline') ||
        error.name === 'NetworkError' ||
        error.name === 'TimeoutError'
      );
    }
    return false;
  }

  /**
   * Logs the error for debugging purposes.
   * In development, logs to console. Could be extended for production reporting.
   *
   * @param captured - The captured error object
   * @param originalError - The original unwrapped error
   */
  #logError(captured: CapturedError, originalError: unknown): void {
    console.error('[GlobalErrorHandler] Uncaught error:', {
      id: captured.id,
      message: captured.message,
      isChunkError: captured.isChunkError,
      isNetworkError: captured.isNetworkError,
      timestamp: captured.timestamp.toISOString(),
      error: originalError,
    });
  }

  /**
   * Generates a unique identifier for an error instance.
   * Useful for logging and tracking error reports.
   *
   * @returns A unique error ID
   */
  #generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

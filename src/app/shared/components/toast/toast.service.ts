import { inject, Injectable, signal } from '@angular/core';

/**
 * Supported toast notification types.
 *
 * Each type has a distinct visual style for immediate user recognition:
 * - `success`: Green with checkmark (completed actions, successful operations)
 * - `error`: Red with X (failed operations, validation errors)
 * - `info`: Blue with info icon (general information, helpful hints)
 */
export type ToastType = 'success' | 'error' | 'info';

/**
 * Configuration options for a toast notification.
 */
export interface ToastOptions {
  /** The message text to display in the toast. */
  message: string;
  /** The type/style of the toast. Defaults to 'info'. */
  type?: ToastType;
  /** Duration in milliseconds before auto-dismissing. Defaults to 3000ms. */
  duration?: number;
  /** Optional unique identifier. If not provided, one will be generated. */
  id?: string;
}

/**
 * Internal representation of a toast notification.
 */
export interface Toast extends ToastOptions {
  /** Unique identifier for the toast. */
  id: string;
  /** The type/style of the toast. */
  type: ToastType;
}

/**
 * Service for managing toast notifications throughout the application.
 *
 * Provides a simple, consistent API for displaying transient notifications
 * that auto-dismiss after a configurable duration. Uses Angular signals for
 * reactive state management.
 *
 * @example
 * ```typescript
 * const toast = inject(ZardToastService);
 *
 * // Show a success toast (auto-dismisses after 3s)
 * toast.success('Copied to clipboard!');
 *
 * // Show an error toast with custom duration
 * toast.error('Operation failed', { duration: 5000 });
 *
 * // Show an info toast
 * toast.info('New feature available');
 *
 * // Access current toasts (for container component)
 * const toasts = toast.toasts();
 * ```
 *
 * @example
 * ```typescript
 * // In a component, copy to clipboard with feedback
 * async copyAddress(address: string) {
 *   try {
 *     await navigator.clipboard.writeText(address);
 *     this.toast.success('Address copied to clipboard!');
 *   } catch (err) {
 *     this.toast.error('Failed to copy address');
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ZardToastService {
  /** Current active toast notifications. Updated reactively via signal. */
  readonly toasts = signal<Toast[]>([]);

  /** Default duration for toast notifications (milliseconds). */
  readonly #defaultDuration = 3000;

  /** Counter for generating unique toast IDs. */
  #idCounter = 0;

  /**
   * Generates a unique identifier for a toast notification.
   * @returns A unique ID string.
   */
  #generateId(): string {
    return `toast-${++this.#idCounter}-${Date.now()}`;
  }

  /**
   * Shows a toast notification with the specified options.
   *
   * The toast will be added to the toasts signal and automatically
   * dismissed after the specified duration.
   *
   * @param options - The toast configuration options.
   * @returns The unique ID of the created toast (can be used for manual dismissal).
   *
   * @example
   * ```typescript
   * const toastId = toast.show({
   *   message: 'File uploaded successfully',
   *   type: 'success',
   *   duration: 5000
   * });
   * ```
   */
  show(options: ToastOptions): string {
    const id = options.id || this.#generateId();
    const toast: Toast = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || this.#defaultDuration,
    };

    // Add the toast to the list
    this.toasts.update((current) => [...current, toast]);

    // Schedule auto-dismissal
    const duration = toast.duration;
    setTimeout(() => {
      this.dismiss(id);
    }, duration);

    return id;
  }

  /**
   * Shows a success toast notification.
   *
   * Convenience method for showing success messages with green styling.
   * Uses default duration of 3000ms.
   *
   * @param message - The success message to display.
   * @param options - Optional configuration (e.g., custom duration).
   * @returns The unique ID of the created toast.
   *
   * @example
   * ```typescript
   * toast.success('Settings saved successfully!');
   * toast.success('Item deleted', { duration: 2000 });
   * ```
   */
  success(message: string, options?: Partial<Omit<ToastOptions, 'message' | 'type'>>): string {
    return this.show({
      message,
      type: 'success',
      duration: options?.duration,
      id: options?.id,
    });
  }

  /**
   * Shows an error toast notification.
   *
   * Convenience method for error messages with red styling.
   * Uses default duration of 3000ms.
   *
   * @param message - The error message to display.
   * @param options - Optional configuration (e.g., custom duration).
   * @returns The unique ID of the created toast.
   *
   * @example
   * ```typescript
   * toast.error('Failed to save changes');
   * toast.error('Network error', { duration: 5000 });
   * ```
   */
  error(message: string, options?: Partial<Omit<ToastOptions, 'message' | 'type'>>): string {
    return this.show({
      message,
      type: 'error',
      duration: options?.duration,
      id: options?.id,
    });
  }

  /**
   * Shows an info toast notification.
   *
   * Convenience method for informational messages with blue styling.
   * Uses default duration of 3000ms.
   *
   * @param message - The info message to display.
   * @param options - Optional configuration (e.g., custom duration).
   * @returns The unique ID of the created toast.
   *
   * @example
   * ```typescript
   * toast.info('New updates available');
   * toast.info('Changes auto-saved', { duration: 2000 });
   * ```
   */
  info(message: string, options?: Partial<Omit<ToastOptions, 'message' | 'type'>>): string {
    return this.show({
      message,
      type: 'info',
      duration: options?.duration,
      id: options?.id,
    });
  }

  /**
   * Dismisses a toast notification by ID.
   *
   * Removes the specified toast from the toasts signal.
   * If the toast doesn't exist, this method does nothing.
   *
   * @param id - The unique ID of the toast to dismiss.
   *
   * @example
   * ```typescript
   * const toastId = toast.success('Message');
   * // Later, manually dismiss before timeout
   * toast.dismiss(toastId);
   * ```
   */
  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }

  /**
   * Dismisses all active toast notifications.
   *
   * Clears the entire toasts signal. Useful for cleanup
   * during component destruction or route changes.
   *
   * @example
   * ```typescript
   * // Clear all toasts when navigating away
   * router.events.pipe(
   *   filter(e => e instanceof NavigationStart)
   * ).subscribe(() => toast.clear());
   * ```
   */
  clear(): void {
    this.toasts.set([]);
  }
}

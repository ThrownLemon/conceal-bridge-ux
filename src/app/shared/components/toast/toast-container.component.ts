import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { ZardToastComponent } from '@/shared/components/toast/toast.component';
import { ZardToastService } from '@/shared/components/toast/toast.service';
import { TOAST_ANIMATION_DURATION } from '@/shared/components/toast/toast.constants';

import { mergeClasses } from '@/shared/utils/merge-classes';

/**
 * Container component for managing multiple toast notifications.
 *
 * This component is responsible for:
 * - Subscribing to the toast service's toasts signal
 * - Rendering multiple toast components in a fixed position
 * - Managing toast dismissal (both manual and auto-dismiss)
 *
 * Should be placed once in the application root (typically app.html).
 *
 * @example
 * ```html
 * <!-- In app.html -->
 * <z-toast-container />
 * ```
 *
 * @example
 * ```typescript
 * // In app.ts or app.config.ts
 * // The toast service is already provided in 'root', so no additional setup needed
 * // Just add the container to the template:
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   selector: 'app-root',
 *   template: `
 *     <router-outlet />
 *     <z-toast-container />
 *   `,
 *   standalone: true,
 *   imports: [ZardToastContainerComponent],
 * })
 * export class AppComponent {}
 * ```
 */
@Component({
  selector: 'z-toast-container',
  imports: [ZardToastComponent],
  standalone: true,
  template: `
    <div [class]="containerClasses()">
      @for (toast of toasts(); track toast.id) {
        <z-toast
          [id]="toast.id"
          [message]="toast.message"
          [type]="toast.type"
          [state]="getToastState(toast.id)"
          [class]="toastItemClasses()"
          (closeToast)="handleDismiss(toast.id)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ZardToastContainerComponent {
  /** Toast service for managing toast state. */
  readonly #toastService = inject(ZardToastService);

  /** DestroyRef for cleanup on component destruction. */
  readonly #destroyRef = inject(DestroyRef);

  /** Set of toast IDs that are in the process of being dismissed (for exit animation). */
  readonly #dismissingToasts = signal<Set<string>>(new Set());

  /** Set of toast IDs that are in the process of entering (for entrance animation). */
  readonly #enteringToasts = new Set<string>();

  /** Map of toast IDs to their pending timeout handles for cleanup. */
  readonly #pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Current active toasts from the toast service.
   * This signal is automatically updated when toasts are added/removed.
   */
  readonly toasts = this.#toastService.toasts;

  constructor() {
    /**
     * Effect to track newly added toasts and manage their entrance animation state.
     *
     * When a toast is added:
     * 1. Add it to the entering set (triggers entrance animation)
     * 2. Wait for entrance animation duration
     * 3. Remove it from the entering set (transitions to 'visible' state)
     */
    effect(() => {
      const currentToasts = this.toasts();
      const currentIds = new Set(currentToasts.map((t) => t.id));

      // Find newly added toasts by comparing current IDs with entering and visible toasts
      currentIds.forEach((id) => {
        if (!this.#enteringToasts.has(id) && !this.#dismissingToasts().has(id)) {
          // This is a new toast, add it to entering set
          this.#enteringToasts.add(id);

          // Remove from entering set after entrance animation completes (matches TOAST_ANIMATION_DURATION)
          setTimeout(() => {
            this.#enteringToasts.delete(id);
          }, TOAST_ANIMATION_DURATION);
        }
      });

      // Clean up entering toasts that are no longer in the list
      this.#enteringToasts.forEach((id) => {
        if (!currentIds.has(id)) {
          this.#enteringToasts.delete(id);
        }
      });
    });

    // Clean up pending timeouts on component destruction to prevent memory leaks
    this.#destroyRef.onDestroy(() => {
      this.#pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      this.#pendingTimeouts.clear();
    });
  }

  /**
   * Gets the animation state for a specific toast.
   *
   * Toasts transition through three states:
   * - 'entering': When first added (triggers entrance animation)
   * - 'visible': After entrance animation completes (stable state)
   * - 'exiting': When being dismissed (triggers exit animation)
   *
   * @param id - The toast ID to check.
   * @returns The animation state ('entering', 'visible', or 'exiting').
   */
  protected getToastState(id: string): 'entering' | 'visible' | 'exiting' {
    if (this.#dismissingToasts().has(id)) {
      return 'exiting';
    }
    if (this.#enteringToasts.has(id)) {
      return 'entering';
    }
    // If not in either set, check if it's a known toast (should be entering)
    const currentToasts = this.toasts();
    const isKnownToast = currentToasts.some((toast) => toast.id === id);
    return isKnownToast ? 'entering' : 'visible';
  }

  /**
   * Handles toast dismissal triggered by the close button.
   *
   * When a toast is dismissed:
   * 1. Add it to the dismissing set (triggers exit animation)
   * 2. Wait for animation duration
   * 3. Remove it from the toast service
   * 4. Remove it from the dismissing set
   *
   * @param id - The ID of the toast to dismiss.
   */
  protected handleDismiss(id: string): void {
    // Don't process if already being dismissed
    if (this.#dismissingToasts().has(id)) {
      return;
    }

    // Remove from entering set if present (toast may be dismissed during entrance animation)
    this.#enteringToasts.delete(id);

    // Add to dismissing set to trigger exit animation
    this.#dismissingToasts.update((set) => new Set(set).add(id));

    // Wait for exit animation (matches TOAST_ANIMATION_DURATION)
    const timeoutId = setTimeout(() => {
      this.#toastService.dismiss(id);
      this.#dismissingToasts.update((set) => {
        const newSet = new Set(set);
        newSet.delete(id);
        return newSet;
      });
      this.#pendingTimeouts.delete(id);
    }, TOAST_ANIMATION_DURATION);

    this.#pendingTimeouts.set(id, timeoutId);
  }

  /**
   * Host element classes for fixed positioning and z-index.
   *
   * Positions the container in the bottom-right corner of the viewport,
   * above other content (z-index 50), with pointer-events-none to allow
   * clicks to pass through empty space.
   */
  protected readonly hostClasses = computed(() =>
    mergeClasses(
      'fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 pointer-events-none max-w-screen-sm w-full',
    ),
  );

  /**
   * Container classes for the wrapper div.
   *
   * Enables pointer events for the toast container itself while the host
   * has pointer-events-none (allows toasts to be interactive while empty
   * space doesn't block clicks).
   */
  protected readonly containerClasses = computed(() =>
    mergeClasses('flex flex-col-reverse gap-2 pointer-events-auto'),
  );

  /**
   * Individual toast item classes.
   *
   * Each toast gets pointer-events-auto to ensure it's interactive,
   * allowing the close button and any other interactions to work properly.
   */
  protected readonly toastItemClasses = computed(() => mergeClasses('pointer-events-auto'));
}

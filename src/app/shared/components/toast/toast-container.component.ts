import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { ZardToastComponent } from '@/shared/components/toast/toast.component';
import { ZardToastService } from '@/shared/components/toast/toast.service';

import { mergeClasses } from '@/shared/utils/merge-classes';

/**
 * Container component for managing multiple toast notifications.
 *
 * This component is responsible for:
 * - Subscribing to the toast service's toasts signal
 * - Rendering multiple toast components in a fixed position
 * - Managing toast dismissal (both manual and auto-dismiss)
 * - Providing ARIA live region for screen reader accessibility
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
    <div
      [attr.role]="'status'"
      [attr.aria-live]="'polite'"
      [attr.aria-atomic]="'true'"
      [class]="containerClasses()"
    >
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

  /** Set of toast IDs that are in the process of being dismissed (for exit animation). */
  readonly #dismissingToasts = inject(() => new Set<string>());

  /**
   * Current active toasts from the toast service.
   * This signal is automatically updated when toasts are added/removed.
   */
  readonly toasts = this.#toastService.toasts;

  /**
   * Gets the animation state for a specific toast.
   *
   * Toasts are in 'visible' state by default, and move to 'exiting' state
   * when the dismiss handler is called (before being removed from the array).
   *
   * @param id - The toast ID to check.
   * @returns The animation state ('entering', 'visible', or 'exiting').
   */
  protected getToastState(id: string): 'entering' | 'visible' | 'exiting' {
    return this.#dismissingToasts().has(id) ? 'exiting' : 'visible';
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

    // Add to dismissing set to trigger exit animation
    this.#dismissingToasts().add(id);

    // Wait for exit animation (300ms matches toast component CSS)
    setTimeout(() => {
      this.#toastService.dismiss(id);
      this.#dismissingToasts().delete(id);
    }, 300);
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

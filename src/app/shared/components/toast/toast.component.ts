import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';

import { mergeClasses } from '@/shared/utils/merge-classes';

/**
 * Supported toast notification types.
 */
type ToastType = 'success' | 'error' | 'info';

/**
 * Maps toast types to their corresponding icons.
 */
const TOAST_ICONS: Record<ToastType, ZardIcon> = {
  success: 'circle-check',
  error: 'circle-x',
  info: 'info',
};

/**
 * Maps toast types to their color variants.
 */
const TOAST_VARIANTS: Record<ToastType, string> = {
  success:
    'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100 dark:border-green-700',
  error:
    'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 dark:border-red-700',
  info: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-700',
};

/**
 * Individual toast notification component.
 *
 * Displays a single toast with an icon and message.
 * Supports success, error, and info variants with distinct styling.
 * Animates in from the bottom-right and fades out on removal.
 *
 * @example
 * ```typescript
 * @for (toast of toasts(); track toast.id) {
 *   <z-toast
 *     [message]="toast.message"
 *     [type]="toast.type"
 *     [id]="toast.id"
 *   />
 * }
 * ```
 */
@Component({
  selector: 'z-toast',
  imports: [ZardIconComponent],
  standalone: true,
  template: `
    <div
      [attr.role]="'status'"
      [attr.aria-live]="'polite'"
      [attr.data-toast-id]="id()"
      [class]="containerClasses()"
    >
      <span [class]="iconWrapperClasses()" data-slot="toast-icon">
        <z-icon [zType]="iconName()" [zSize]="'sm'" />
      </span>
      <span [class]="messageClasses()" data-slot="toast-message">
        {{ message() }}
      </span>
      <button
        type="button"
        [attr.aria-label]="'Close notification'"
        [class]="closeButtonClasses()"
        (click)="onClose()"
        data-slot="toast-close"
      >
        <z-icon [zType]="'x'" [zSize]="'sm'" />
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[attr.data-state]': 'dataState()',
  },
})
export class ZardToastComponent {
  /** The message text to display in the toast. */
  readonly message = input.required<string>();

  /** The type/style of the toast (success, error, info). */
  readonly type = input<ToastType>('info');

  /** Unique identifier for the toast instance. */
  readonly id = input.required<string>();

  /** Optional custom CSS classes to apply. */
  readonly class = input<ClassValue>('');

  /**
   * Event emitted when the close button is clicked.
   * The parent container should handle actual dismissal.
   */
  readonly closeToast = output<void>();

  /** Current animation state for the toast. */
  readonly state = input<'entering' | 'visible' | 'exiting'>('entering');

  /** Animation state for data-state attribute. */
  protected readonly dataState = computed(() => this.state());

  /** Host element classes for positioning and animations. */
  protected readonly hostClasses = computed(() =>
    mergeClasses(
      'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all duration-300 ease-in-out',
      'data-[state=entering]:animate-in data-[state=entering]:slide-in-from-bottom-full data-[state=entering]:slide-in-from-right-4 data-[state=entering]:fade-in-0',
      'data-[state=exiting]:animate-out data-[state=exiting]:fade-out-0 data-[state=exiting]:zoom-out-95',
      TOAST_VARIANTS[this.type()],
      this.class(),
    ),
  );

  /** Container classes for internal layout. */
  protected readonly containerClasses = computed(() =>
    mergeClasses('flex items-center gap-3 flex-1'),
  );

  /** Icon wrapper classes. */
  protected readonly iconWrapperClasses = computed(() =>
    mergeClasses('flex shrink-0 items-center justify-center'),
  );

  /** Message text classes. */
  protected readonly messageClasses = computed(() => mergeClasses('text-sm font-medium flex-1'));

  /** Close button classes. */
  protected readonly closeButtonClasses = computed(() =>
    mergeClasses(
      'shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'p-1 hover:bg-black/5 dark:hover:bg-white/10',
    ),
  );

  /** The icon name to display based on toast type. */
  protected readonly iconName = computed((): ZardIcon => {
    return TOAST_ICONS[this.type()];
  });

  /** Handles close button click. */
  protected onClose(): void {
    this.closeToast.emit();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import { GlobalErrorHandler } from '@/core/global-error-handler.service';
import { ZardAlertComponent } from '@/shared/components/alert/alert.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

/**
 * Error boundary component that displays a user-friendly error UI
 * when the application encounters an uncaught exception.
 *
 * This component:
 * - Shows an overlay with error details
 * - Provides recovery options (Reload, Go Home)
 * - Maintains accessibility with proper ARIA attributes
 * - Focuses the error message for screen reader users
 *
 * @example
 * ```html
 * <!-- In app.html -->
 * <app-error-boundary />
 * <router-outlet />
 * ```
 */
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [ZardAlertComponent, ZardButtonComponent, ZardIconComponent],
  template: `
    @if (errorHandler.currentError(); as error) {
      <div
        #errorDialog
        tabindex="-1"
        class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-title"
        aria-describedby="error-description"
      >
        <div
          class="mx-4 w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6 shadow-xl"
        >
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <z-icon zType="circle-alert" class="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 id="error-title" class="text-lg font-semibold text-foreground">
                Something went wrong
              </h2>
              <p class="text-xs text-muted-foreground">Error ID: {{ error.id }}</p>
            </div>
          </div>

          <p id="error-description" class="mb-6 text-sm text-muted-foreground">
            {{ error.message }}
          </p>

          @if (error.isChunkError) {
            <z-alert
              zType="default"
              zTitle="Tip"
              zDescription="The app may have been updated. Reloading usually fixes this."
              class="mb-6"
            />
          }

          <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button z-button zType="outline" type="button" (click)="errorHandler.goHome()">
              <z-icon zType="house" class="mr-2 h-4 w-4" />
              Go Home
            </button>
            <button z-button zType="default" type="button" (click)="errorHandler.reload()">
              <z-icon zType="refresh-cw" class="mr-2 h-4 w-4" />
              Reload Page
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorBoundaryComponent {
  protected readonly errorHandler = inject(GlobalErrorHandler);

  /** Reference to the error dialog element for focus management */
  private readonly errorDialog = viewChild<ElementRef<HTMLDivElement>>('errorDialog');

  constructor() {
    // Focus the dialog when an error appears for screen reader accessibility
    effect(() => {
      const dialogRef = this.errorDialog();
      if (dialogRef) {
        dialogRef.nativeElement.focus();
      }
    });
  }
}

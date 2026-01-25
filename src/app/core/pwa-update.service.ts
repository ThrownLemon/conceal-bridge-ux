import { Injectable, signal, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ZardToastService } from '@/shared/components/toast/toast.service';

/**
 * Service for managing Progressive Web App updates.
 *
 * Monitors for new service worker versions, notifies users when updates
 * are available, and provides methods to activate pending updates.
 * Automatically checks for updates periodically when not in dev mode.
 *
 * @example
 * ```typescript
 * const pwaUpdate = inject(PwaUpdateService);
 *
 * // Check if an update is currently available
 * const hasUpdate = pwaUpdate.updateAvailable();
 *
 * // Manually check for updates
 * await pwaUpdate.checkForUpdate();
 *
 * // Activate a pending update and reload
 * await pwaUpdate.activateUpdate();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  readonly #swUpdate = inject(SwUpdate);
  readonly #toast = inject(ZardToastService);

  /**
   * Whether a service worker update is currently available.
   * Set to true when a new version is detected and ready to install.
   */
  readonly updateAvailable = signal(false);

  /**
   * Whether the service worker is enabled in this environment.
   * Service workers are only enabled in production builds.
   * @returns True if service worker is enabled, false otherwise.
   */
  readonly isEnabled = signal(this.#swUpdate.isEnabled);

  /**
   * Interval (in milliseconds) for periodic update checks.
   * Default: 6 hours (21,600,000 ms).
   */
  readonly #updateCheckInterval = 6 * 60 * 60 * 1000;

  constructor() {
    if (!this.#swUpdate.isEnabled) {
      // Service worker is not enabled (dev mode or unsupported browser)
      return;
    }

    this.#subscribeToUpdates();
    this.#schedulePeriodicUpdateChecks();
  }

  /**
   * Manually checks for service worker updates.
   *
   * Triggers an immediate check for new service worker versions.
   * If an update is available, the updateAvailable signal will be set
   * to true and a toast notification will be shown.
   *
   * @returns Promise that resolves to true if an update was found, false otherwise.
   *
   * @example
   * ```typescript
   * // Check for updates when user clicks a refresh button
   * async onRefreshClick() {
   *   const hasUpdate = await pwaUpdate.checkForUpdate();
   *   if (!hasUpdate) {
   *     toast.info('You are already on the latest version');
   *   }
   * }
   * ```
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.#swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.#swUpdate.checkForUpdate();
    } catch (error) {
      console.warn('Failed to check for updates', error);
      return false;
    }
  }

  /**
   * Activates a pending service worker update and reloads the page.
   *
   * This method should be called after the user confirms they want to
   * update the app. It activates the new service worker version and
   * immediately reloads the page to apply the changes.
   *
   * @returns Promise that resolves when the update is activated (page will reload).
   *
   * @example
   * ```typescript
   * // Activate update when user clicks "Update Now" button
   * async onUpdateClick() {
   *   await pwaUpdate.activateUpdate();
   *   // Page will reload automatically
   * }
   * ```
   */
  async activateUpdate(): Promise<void> {
    if (!this.#swUpdate.isEnabled) {
      return;
    }

    try {
      await this.#swUpdate.activateUpdate();
      // Reload the page to apply the update
      document.location.reload();
    } catch (error) {
      console.warn('Failed to activate update', error);
      this.#toast.error('Failed to update app. Please refresh manually.');
    }
  }

  /**
   * Subscribes to service worker update events.
   *
   * Listens for VERSION_READY events from the service worker and updates
   * the updateAvailable signal accordingly. Shows a toast notification
   * when a new version is ready.
   */
  #subscribeToUpdates(): void {
    this.#swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.updateAvailable.set(true);
        this.#showUpdateNotification();
      });
  }

  /**
   * Schedules periodic checks for service worker updates.
   *
   * Automatically checks for updates at regular intervals (default: 6 hours)
   * to ensure users get the latest version without manual intervention.
   */
  #schedulePeriodicUpdateChecks(): void {
    interval(this.#updateCheckInterval)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.checkForUpdate();
      });
  }

  /**
   * Shows a toast notification when an update is available.
   *
   * Displays an informational toast with a message prompting the user
   * to reload the page. The toast persists longer than usual (8 seconds)
   * to ensure the user has time to see and act on it.
   */
  #showUpdateNotification(): void {
    this.#toast.info('A new version is available! Reload to update.', {
      duration: 8000,
    });
  }
}

import { Injectable, signal } from '@angular/core';

/** LocalStorage key for persisting push subscription state. */
const SUBSCRIPTION_KEY = 'conceal_bridge_push_subscription';

/**
 * Notification permission states from the Notifications API.
 *
 * - `granted`: User has granted permission to show notifications
 * - `denied`: User has explicitly denied permission
 * - `default`: User hasn't made a decision yet (prompt will be shown)
 */
export type NotificationPermissionState = 'granted' | 'denied' | 'default';

/**
 * Configuration options for showing a push notification.
 */
export interface NotificationOptions {
  /** The notification title text. */
  title: string;
  /** The notification body text. */
  body: string;
  /** Optional icon URL to display with the notification. */
  icon?: string;
  /** Optional badge URL (shown in notification tray). */
  badge?: string;
  /** Optional tag to group/replace notifications. */
  tag?: string;
  /** Optional data to attach to the notification. */
  data?: unknown;
}

/**
 * Service for managing push notifications and subscriptions.
 *
 * Provides a comprehensive API for requesting notification permissions,
 * managing push subscriptions via Service Worker, and displaying native
 * browser notifications. Uses Angular signals for reactive state management.
 *
 * @example
 * ```typescript
 * const push = inject(PushNotificationService);
 *
 * // Check if push is supported
 * if (push.isSupported()) {
 *   // Request permission
 *   const permission = await push.requestPermission();
 *
 *   if (permission === 'granted') {
 *     // Subscribe to push notifications
 *     const subscription = await push.subscribe();
 *   }
 * }
 *
 * // Show a notification
 * await push.showNotification({
 *   title: 'Transaction Complete',
 *   body: 'Your bridge transaction has been confirmed',
 *   icon: '/assets/icons/icon-192x192.png'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // In a component, show notification after transaction
 * async onTransactionComplete(tx: Transaction) {
 *   const push = inject(PushNotificationService);
 *
 *   if (push.permission() === 'granted') {
 *     await push.showNotification({
 *       title: 'Bridge Complete',
 *       body: `Successfully bridged ${tx.amount} CCX`,
 *       tag: 'transaction'
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  /**
   * Current notification permission state.
   * Updated whenever permission is checked or requested.
   */
  readonly permission = signal<NotificationPermissionState>('default');

  /**
   * Whether the user is currently subscribed to push notifications.
   * Persisted to localStorage and restored on service initialization.
   */
  readonly isSubscribed = signal(false);

  /**
   * The current push subscription object, if one exists.
   * Null when not subscribed.
   */
  readonly #subscription = signal<PushSubscription | null>(null);

  /**
   * Public readonly accessor for the current subscription.
   * @returns ReadonlySignal of the current PushSubscription or null.
   */
  readonly subscription = this.#subscription.asReadonly();

  constructor() {
    this.#initialize();
  }

  /**
   * Initializes the service by checking permission state and loading
   * subscription status from localStorage.
   * Automatically called in constructor.
   */
  #initialize() {
    if (this.isSupported()) {
      this.permission.set(Notification.permission);
      this.#loadSubscriptionState();
    }
  }

  /**
   * Checks if push notifications are supported in the current browser.
   *
   * Verifies that the browser supports Service Workers, the Notifications API,
   * and the Push API.
   *
   * @returns True if push notifications are fully supported, false otherwise.
   *
   * @example
   * ```typescript
   * if (!push.isSupported()) {
   *   console.warn('Push notifications not supported in this browser');
   *   return;
   * }
   * ```
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window;
  }

  /**
   * Requests notification permission from the user.
   *
   * Shows the browser's native permission prompt if permission hasn't been
   * granted or denied yet. Updates the permission signal with the result.
   *
   * @returns Promise resolving to the permission state after the request.
   *
   * @example
   * ```typescript
   * const permission = await push.requestPermission();
   *
   * if (permission === 'granted') {
   *   console.log('User granted notification permission');
   * } else if (permission === 'denied') {
   *   console.log('User denied notification permission');
   * }
   * ```
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission.set(permission);
      return permission;
    } catch (error) {
      console.warn('Failed to request notification permission', error);
      return 'denied';
    }
  }

  /**
   * Subscribes to push notifications via the Service Worker.
   *
   * Creates a new push subscription using the Service Worker's Push Manager.
   * Requires notification permission to be granted first. The subscription
   * is persisted to localStorage and the service state is updated.
   *
   * @returns Promise resolving to the PushSubscription object, or null if failed.
   *
   * @example
   * ```typescript
   * // Request permission first
   * const permission = await push.requestPermission();
   *
   * if (permission === 'granted') {
   *   const subscription = await push.subscribe();
   *
   *   if (subscription) {
   *     // Send subscription to backend
   *     await api.savePushSubscription(subscription);
   *   }
   * }
   * ```
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return null;
    }

    if (this.permission() !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const applicationServerKey = this.#getApplicationServerKey();
        if (!applicationServerKey) {
          console.info(
            '[PushNotificationService] No VAPID key configured. Push subscriptions may not work in production. ' +
              'Configure vapidPublicKey in environment to enable push notifications.',
          );
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource | undefined,
        });
      }

      this.#subscription.set(subscription);
      this.isSubscribed.set(true);
      this.#saveSubscriptionState();

      return subscription;
    } catch (error) {
      console.warn('Failed to subscribe to push notifications', error);
      return null;
    }
  }

  /**
   * Unsubscribes from push notifications.
   *
   * Removes the current push subscription from the Service Worker and
   * updates the service state. The subscription state is cleared from
   * localStorage.
   *
   * @returns Promise resolving to true if successfully unsubscribed, false otherwise.
   *
   * @example
   * ```typescript
   * const success = await push.unsubscribe();
   *
   * if (success) {
   *   console.log('Successfully unsubscribed from push notifications');
   *   // Optionally notify backend to remove subscription
   *   await api.removePushSubscription();
   * }
   * ```
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const success = await subscription.unsubscribe();

        if (success) {
          this.#subscription.set(null);
          this.isSubscribed.set(false);
          this.#clearSubscriptionState();
        }

        return success;
      }

      return true;
    } catch (error) {
      console.warn('Failed to unsubscribe from push notifications', error);
      return false;
    }
  }

  /**
   * Shows a notification to the user.
   *
   * Displays a native browser notification with the specified options.
   * If a Service Worker is available and active, the notification is shown
   * via the Service Worker for better reliability. Otherwise, falls back to
   * the Notifications API directly.
   *
   * Requires notification permission to be granted.
   *
   * @param options - The notification configuration options.
   * @returns Promise that resolves when the notification is shown, or rejects if failed.
   *
   * @example
   * ```typescript
   * await push.showNotification({
   *   title: 'Bridge Transaction',
   *   body: 'Your CCX has been successfully bridged',
   *   icon: '/assets/icons/icon-192x192.png',
   *   tag: 'transaction-complete',
   *   data: { transactionId: 'abc123' }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Show notification with error handling
   * try {
   *   await push.showNotification({
   *     title: 'Price Alert',
   *     body: 'CCX price has increased by 10%'
   *   });
   * } catch (error) {
   *   console.error('Failed to show notification', error);
   * }
   * ```
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported');
      return;
    }

    if (this.permission() !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Use Service Worker to show notification for better reliability
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        data: options.data,
      });
    } catch (error) {
      console.warn('Failed to show notification via Service Worker, falling back', error);

      // Fallback to direct Notification API
      try {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          data: options.data,
        });
      } catch (fallbackError) {
        console.warn('Failed to show notification', fallbackError);
      }
    }
  }

  /**
   * Gets the application server key (VAPID public key) for push subscriptions.
   *
   * In a production environment, this should be loaded from environment config.
   * For now, returns undefined to allow basic testing.
   *
   * @returns The application server key as a Uint8Array, or undefined.
   */
  #getApplicationServerKey(): Uint8Array | undefined {
    // TODO: Load from environment configuration
    // const vapidPublicKey = environment.vapidPublicKey;
    // if (vapidPublicKey) {
    //   return this.#urlBase64ToUint8Array(vapidPublicKey);
    // }
    return undefined;
  }

  /**
   * Loads subscription state from localStorage on service initialization.
   * Silently handles parse errors or missing data.
   */
  #loadSubscriptionState() {
    try {
      const raw = localStorage.getItem(SUBSCRIPTION_KEY);
      if (raw) {
        const state = JSON.parse(raw) as { isSubscribed: boolean };
        this.isSubscribed.set(state.isSubscribed);
      }
    } catch (error) {
      console.warn('Failed to load push subscription state', error);
    }
  }

  /**
   * Persists the current subscription state to localStorage.
   * Silently handles storage errors (e.g., quota exceeded).
   */
  #saveSubscriptionState() {
    try {
      const state = {
        isSubscribed: this.isSubscribed(),
      };
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save push subscription state', error);
    }
  }

  /**
   * Clears the subscription state from localStorage.
   * Called when user unsubscribes from push notifications.
   */
  #clearSubscriptionState() {
    try {
      localStorage.removeItem(SUBSCRIPTION_KEY);
    } catch (error) {
      console.warn('Failed to clear push subscription state', error);
    }
  }
}

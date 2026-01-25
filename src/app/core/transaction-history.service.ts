import { Injectable, signal, inject } from '@angular/core';
import { StoredTransaction } from './bridge-types';
import { PushNotificationService } from './push-notification.service';

/** LocalStorage key for persisting transaction history. */
const STORAGE_KEY = 'conceal_bridge_tx_history';

/**
 * Service for managing the user's bridge transaction history.
 *
 * Provides persistent storage of recent transactions in localStorage,
 * along with UI state management for the transaction history sidebar.
 * Automatically loads history on initialization and persists changes.
 *
 * @example
 * ```typescript
 * const history = inject(TransactionHistoryService);
 *
 * // Add a new transaction
 * history.addTransaction({
 *   id: 'abc123',
 *   direction: 'ccx-to-evm',
 *   amount: 1000,
 *   status: 'pending',
 *   timestamp: Date.now(),
 *   network: 'bsc'
 * });
 *
 * // Show the history sidebar
 * history.open();
 *
 * // Access transactions reactively
 * const txCount = computed(() => history.transactions().length);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class TransactionHistoryService {
  readonly #pushNotificationService = inject(PushNotificationService);
  readonly #transactions = signal<StoredTransaction[]>([]);

  /**
   * The list of stored transactions, ordered newest first.
   * Limited to the 5 most recent transactions.
   * @returns ReadonlySignal of transaction array.
   */
  readonly transactions = this.#transactions.asReadonly();

  /**
   * Whether the transaction history sidebar is currently visible.
   * Can be toggled with toggle(), open(), or close().
   */
  readonly isOpen = signal(false);

  constructor() {
    this.#loadFromStorage();
  }

  /**
   * Toggles the visibility of the transaction history sidebar.
   *
   * @example
   * ```typescript
   * // In a template: (click)="history.toggle()"
   * history.toggle();
   * ```
   */
  toggle() {
    this.isOpen.update((v) => !v);
  }

  /**
   * Opens the transaction history sidebar.
   *
   * @example
   * ```typescript
   * // Show history after completing a transaction
   * history.addTransaction(tx);
   * history.open();
   * ```
   */
  open() {
    this.isOpen.set(true);
  }

  /**
   * Closes the transaction history sidebar.
   *
   * @example
   * ```typescript
   * // Close when user clicks outside
   * history.close();
   * ```
   */
  close() {
    this.isOpen.set(false);
  }

  /**
   * Adds a new transaction to the history.
   *
   * The transaction is added at the top of the list. If there are more
   * than 5 transactions, the oldest ones are removed. Changes are
   * automatically persisted to localStorage.
   *
   * If push notifications are enabled, a notification is shown with
   * the transaction status update.
   *
   * @param tx - The transaction to add.
   *
   * @example
   * ```typescript
   * history.addTransaction({
   *   id: 'abc123',
   *   direction: 'ccx-to-evm',
   *   amount: 1000000,
   *   status: 'completed',
   *   timestamp: Date.now(),
   *   network: 'bsc'
   * });
   * ```
   */
  addTransaction(tx: StoredTransaction) {
    this.#transactions.update((current) => {
      // Add new tx to the top
      const updated = [tx, ...current];
      // Limit to 5
      return updated.slice(0, 5);
    });
    this.#saveToStorage();
    this.#showNotificationForTransaction(tx);
  }

  /**
   * Clears all transaction history.
   *
   * Removes all stored transactions and persists the empty state
   * to localStorage.
   *
   * @example
   * ```typescript
   * // Clear history button handler
   * history.clearHistory();
   * ```
   */
  clearHistory() {
    this.#transactions.set([]);
    this.#saveToStorage();
  }

  /**
   * Loads transaction history from localStorage on service initialization.
   * Silently handles parse errors or missing data.
   */
  #loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredTransaction[];
        if (Array.isArray(parsed)) {
          this.#transactions.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load transaction history', e);
    }
  }

  /**
   * Persists the current transaction history to localStorage.
   * Silently handles storage errors (e.g., quota exceeded).
   */
  #saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#transactions()));
    } catch (e) {
      console.warn('Failed to save transaction history', e);
    }
  }

  /**
   * Shows a push notification for the transaction based on its status.
   *
   * Displays different notification messages depending on whether the
   * transaction is pending or completed, and its direction (CCX to EVM
   * or EVM to CCX).
   *
   * Only shows notifications if the user has granted permission.
   *
   * @param tx - The transaction to show a notification for.
   */
  #showNotificationForTransaction(tx: StoredTransaction) {
    // Only show notifications if permission is granted
    if (this.#pushNotificationService.permission() !== 'granted') {
      return;
    }

    const directionLabel = tx.direction === 'ccx-to-evm' ? 'CCX to wCCX' : 'wCCX to CCX';
    const amountFormatted = (tx.amount / 1_000_000).toFixed(2);

    let title: string;
    let body: string;

    if (tx.status === 'completed') {
      title = 'Bridge Transaction Complete';
      body = `Successfully bridged ${amountFormatted} CCX (${directionLabel}) on ${tx.network.toUpperCase()}`;
    } else {
      title = 'Bridge Transaction Started';
      body = `Bridging ${amountFormatted} CCX (${directionLabel}) on ${tx.network.toUpperCase()}`;
    }

    // Show the notification (async, but we don't need to await)
    void this.#pushNotificationService.showNotification({
      title,
      body,
      icon: '/android-chrome-192x192.png',
      tag: 'bridge-transaction',
      data: { transactionId: tx.id },
    });
  }
}

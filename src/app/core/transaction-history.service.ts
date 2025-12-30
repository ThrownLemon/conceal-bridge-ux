import { Injectable, signal } from '@angular/core';
import { StoredTransaction } from './bridge-types';

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
 *   paymentId: 'abc123',
 *   direction: 'ccx-to-wccx',
 *   amount: 1000,
 *   status: 'pending',
 *   timestamp: Date.now()
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
   * @param tx - The transaction to add.
   *
   * @example
   * ```typescript
   * history.addTransaction({
   *   paymentId: 'abc123',
   *   direction: 'ccx-to-wccx',
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
}

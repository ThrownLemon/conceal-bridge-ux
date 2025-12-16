import { Injectable, signal, effect, computed } from '@angular/core';
import { StoredTransaction } from './bridge-types';

const STORAGE_KEY = 'conceal_bridge_tx_history';

@Injectable({
  providedIn: 'root',
})
export class TransactionHistoryService {
  readonly #transactions = signal<StoredTransaction[]>([]);

  // Public signal for components to consume
  readonly transactions = this.#transactions.asReadonly();

  // Visibility state for the sidebar
  readonly isOpen = signal(false);

  constructor() {
    this.#loadFromStorage();
  }

  toggle() {
    this.isOpen.update((v) => !v);
  }

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  addTransaction(tx: StoredTransaction) {
    this.#transactions.update((current) => {
      // Add new tx to the top
      const updated = [tx, ...current];
      // Limit to 5
      return updated.slice(0, 5);
    });
    this.#saveToStorage();
  }

  clearHistory() {
    this.#transactions.set([]);
    this.#saveToStorage();
  }

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

  #saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#transactions()));
    } catch (e) {
      console.warn('Failed to save transaction history', e);
    }
  }
}

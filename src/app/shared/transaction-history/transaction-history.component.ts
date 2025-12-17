import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { formatDistanceToNow } from 'date-fns';
import { TransactionHistoryService } from '../../core/transaction-history.service';

@Component({
  selector: 'app-transaction-history',
  imports: [DecimalPipe],
  template: `
    <!-- Backdrop -->
    @if (service.isOpen()) {
      <div
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        (click)="service.close()"
        (keydown.escape)="service.close()"
        tabindex="0"
        role="button"
        aria-label="Close history"
      ></div>
    }

    <!-- Sidebar -->
    <div
      class="fixed top-0 right-0 z-50 h-full w-full max-w-md transform border-l border-[var(--cb-color-border)] bg-[var(--cb-color-bg)] p-6 shadow-2xl transition-transform duration-300 ease-in-out sm:w-[400px]"
      [class.translate-x-0]="service.isOpen()"
      [class.translate-x-full]="!service.isOpen()"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-[var(--cb-color-text)]">Recent Activity</h2>
        <button
          (click)="service.close()"
          class="rounded-full p-2 text-[var(--cb-color-muted)] hover:bg-[var(--cb-color-surface)] hover:text-[var(--cb-color-text)] transition-colors"
        >
          <span class="sr-only">Close</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      @if (service.transactions().length === 0) {
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <div class="rounded-full bg-[var(--cb-color-surface)] p-4 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-[var(--cb-color-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-[var(--cb-color-text-secondary)]">No recent transactions</p>
        </div>
      } @else {
        <div class="space-y-4 overflow-y-auto max-h-[calc(100vh-100px)]">
          @for (tx of service.transactions(); track tx.id) {
            <div
              class="rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-4 transition-all hover:border-[var(--cb-color-accent)]/30"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div
                    class="rounded-full p-1.5"
                    [class]="
                      tx.direction === 'ccx-to-evm'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-purple-500/10 text-purple-500'
                    "
                  >
                    @if (tx.direction === 'ccx-to-evm') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    } @else {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    }
                  </div>
                  <span class="font-medium text-[var(--cb-color-text)]">
                    {{ tx.direction === 'ccx-to-evm' ? 'CCX → wCCX' : 'wCCX → CCX' }}
                  </span>
                </div>
                <div class="text-xs text-[var(--cb-color-muted)] whitespace-nowrap">
                  {{ getRelativeTime(tx.timestamp) }}
                </div>
              </div>

              <div class="mb-3">
                <div class="text-2xl font-bold text-[var(--cb-color-text)]">
                  {{ tx.amount | number: '1.0-6' }}
                  <span class="text-sm font-normal text-[var(--cb-color-muted)]">
                    {{ tx.direction === 'ccx-to-evm' ? 'CCX' : 'wCCX' }}
                  </span>
                </div>
              </div>

              <div
                class="space-y-2 text-xs text-[var(--cb-color-text-secondary)] border-t border-[var(--cb-color-border)]/50 pt-3"
              >
                <div class="flex justify-between">
                  <span>Status</span>
                  <span class="font-medium text-green-500">Completed</span>
                </div>

                @if (tx.depositHash) {
                  <div class="flex justify-between items-center group">
                    <span>Deposit Hash</span>
                    <div class="flex items-center gap-1">
                      <span class="font-mono text-[var(--cb-color-muted)]">
                        {{ tx.depositHash.slice(0, 6) }}...{{ tx.depositHash.slice(-4) }}
                      </span>
                      <button
                        (click)="copy(tx.depositHash)"
                        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--cb-color-accent)] hover:bg-[var(--cb-color-accent)]/10 rounded"
                        title="Copy Hash"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012 2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                }

                @if (tx.swapHash) {
                  <div class="flex justify-between items-center group">
                    <span>Swap Hash</span>
                    <div class="flex items-center gap-1">
                      <span class="font-mono text-[var(--cb-color-muted)]">
                        {{ tx.swapHash.slice(0, 6) }}...{{ tx.swapHash.slice(-4) }}
                      </span>
                      <button
                        (click)="copy(tx.swapHash)"
                        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--cb-color-accent)] hover:bg-[var(--cb-color-accent)]/10 rounded"
                        title="Copy Hash"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012 2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class TransactionHistoryComponent {
  readonly service = inject(TransactionHistoryService);

  getRelativeTime(timestamp: number): string {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  }

  async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: Toast notification here if desired
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}

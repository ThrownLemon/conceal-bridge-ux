import { A11yModule } from '@angular/cdk/a11y';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';

import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { TransactionHistoryService } from '../../core/transaction-history.service';

@Component({
  selector: 'app-transaction-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    A11yModule,
    DecimalPipe,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
  ],
  template: `
    <!-- Backdrop -->
    @if (service.isOpen()) {
      <div
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        (click)="service.close()"
        (keydown.escape)="service.close()"
        tabindex="-1"
        aria-hidden="true"
      ></div>
    }

    <!-- Sidebar -->
    <aside
      class="fixed top-0 right-0 z-50 h-full w-full max-w-md transform border-l border-border bg-background p-6 shadow-2xl transition-transform duration-300 ease-in-out sm:w-[400px]"
      [class.translate-x-0]="service.isOpen()"
      [class.translate-x-full]="!service.isOpen()"
      [attr.aria-hidden]="!service.isOpen()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-history-title"
      [cdkTrapFocus]="service.isOpen()"
      [cdkTrapFocusAutoCapture]="service.isOpen()"
    >
      <!-- ARIA live region for copy status -->
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        @if (copyStatus(); as status) {
          {{ status.status === 'copied' ? 'Hash copied to clipboard' : 'Failed to copy hash' }}
        }
      </div>

      <div class="flex items-center justify-between mb-6">
        <h2 id="transaction-history-title" class="text-xl font-bold">Recent Activity</h2>
        <button
          z-button
          zType="ghost"
          zSize="sm"
          (click)="service.close()"
          aria-label="Close transaction history"
        >
          <span class="sr-only">Close</span>
          <z-icon zType="x" />
        </button>
      </div>

      @if (service.transactions().length === 0) {
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <div class="rounded-full bg-muted p-4 mb-4">
            <z-icon zType="clock" zSize="lg" class="text-muted-foreground" />
          </div>
          <p class="text-muted-foreground">No recent transactions</p>
        </div>
      } @else {
        <div class="space-y-4 overflow-y-auto max-h-[calc(100vh-100px)]">
          @for (tx of service.transactions(); track tx.id) {
            <z-card class="transition-all hover:border-primary/30">
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
                      <z-icon zType="arrow-down" zSize="sm" />
                    } @else {
                      <z-icon zType="arrow-up" zSize="sm" />
                    }
                  </div>
                  <span class="font-medium">
                    {{ tx.direction === 'ccx-to-evm' ? 'CCX → wCCX' : 'wCCX → CCX' }}
                  </span>
                </div>
                <div class="text-xs text-muted-foreground whitespace-nowrap">
                  {{ getRelativeTime(tx.timestamp) }}
                </div>
              </div>

              <div class="mb-3">
                <div class="text-2xl font-bold">
                  {{ tx.amount | number: '1.0-6' }}
                  <span class="text-sm font-normal text-muted-foreground">
                    {{ tx.direction === 'ccx-to-evm' ? 'CCX' : 'wCCX' }}
                  </span>
                </div>
              </div>

              <div class="space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                <div class="flex justify-between">
                  <span>Status</span>
                  <z-badge zType="outline" class="text-green-500 border-green-500/30">
                    Completed
                  </z-badge>
                </div>

                @if (tx.depositHash) {
                  <div class="flex justify-between items-center group">
                    <span>Deposit Hash</span>
                    <div class="flex items-center gap-1">
                      <span class="font-mono">
                        {{ tx.depositHash.slice(0, 6) }}...{{ tx.depositHash.slice(-4) }}
                      </span>
                      <button
                        z-button
                        zType="ghost"
                        zSize="sm"
                        class="opacity-0 group-hover:opacity-100 transition-opacity !p-1 !h-auto"
                        (click)="copy(tx.depositHash)"
                        [title]="getCopyLabel(tx.depositHash)"
                      >
                        <z-icon zType="copy" zSize="sm" />
                      </button>
                    </div>
                  </div>
                }

                @if (tx.swapHash) {
                  <div class="flex justify-between items-center group">
                    <span>Swap Hash</span>
                    <div class="flex items-center gap-1">
                      <span class="font-mono">
                        {{ tx.swapHash.slice(0, 6) }}...{{ tx.swapHash.slice(-4) }}
                      </span>
                      <button
                        z-button
                        zType="ghost"
                        zSize="sm"
                        class="opacity-0 group-hover:opacity-100 transition-opacity !p-1 !h-auto"
                        (click)="copy(tx.swapHash)"
                        [title]="getCopyLabel(tx.swapHash)"
                      >
                        <z-icon zType="copy" zSize="sm" />
                      </button>
                    </div>
                  </div>
                }
              </div>
            </z-card>
          }
        </div>
      }
    </aside>
  `,
})
export class TransactionHistoryComponent {
  readonly service = inject(TransactionHistoryService);
  readonly copyStatus = signal<{ hash: string; status: 'copied' | 'failed' } | null>(null);

  getRelativeTime(timestamp: number): string {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  }

  async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copyStatus.set({ hash: text, status: 'copied' });
    } catch {
      this.copyStatus.set({ hash: text, status: 'failed' });
    }
    setTimeout(() => {
      if (this.copyStatus()?.hash === text) {
        this.copyStatus.set(null);
      }
    }, 2000);
  }

  getCopyLabel(hash: string): string {
    const status = this.copyStatus();
    if (status?.hash === hash) {
      return status.status === 'copied' ? 'Copied!' : 'Copy failed';
    }
    return 'Copy Hash';
  }
}

import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { formatDistanceToNow } from 'date-fns';

import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { TransactionHistoryService } from '../../core/transaction-history.service';

@Component({
  selector: 'app-transaction-history',
  imports: [DecimalPipe, ZardBadgeComponent, ZardButtonComponent, ZardCardComponent, ZardIconComponent],
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
      class="fixed top-0 right-0 z-50 h-full w-full max-w-md transform border-l border-border bg-background p-6 shadow-2xl transition-transform duration-300 ease-in-out sm:w-[400px]"
      [class.translate-x-0]="service.isOpen()"
      [class.translate-x-full]="!service.isOpen()"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Recent Activity</h2>
        <button z-button zType="ghost" zSize="sm" (click)="service.close()">
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
                        title="Copy Hash"
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
                        title="Copy Hash"
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

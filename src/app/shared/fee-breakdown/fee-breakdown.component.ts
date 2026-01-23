import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import type { FeeBreakdown } from '../../core/bridge-types';
import { formatNativeAmount, formatTokenAmount } from '../../core/utils/format.utils';

/**
 * Displays a breakdown of transaction fees before a swap.
 *
 * Shows:
 * - Input amount (what user sends)
 * - Gas fee (in native token)
 * - Bridge fee (if applicable)
 * - Output amount (what user receives)
 *
 * @example
 * ```html
 * <app-fee-breakdown
 *   [breakdown]="feeBreakdown()"
 *   [tokenSymbol]="'wCCX'"
 * />
 * ```
 */
@Component({
  selector: 'app-fee-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZardIconComponent],
  template: `
    <div class="rounded-lg border border-border bg-muted/50 p-4">
      <div class="mb-3 text-sm font-medium text-muted-foreground">Transaction Summary</div>

      <div class="grid gap-2 text-sm">
        <!-- You send -->
        <div class="flex justify-between">
          <span class="text-muted-foreground">You send</span>
          <span class="font-mono font-medium">{{ formattedInput() }}</span>
        </div>

        <!-- Gas fee -->
        <div class="flex justify-between">
          <span class="text-muted-foreground">Gas fee</span>
          <span class="font-mono text-orange-500">−{{ formattedGasFee() }}</span>
        </div>

        <!-- Bridge fee (conditional) -->
        @if (hasBridgeFee()) {
          <div class="flex justify-between">
            <span class="text-muted-foreground">Bridge fee</span>
            <span class="font-mono text-orange-500">−{{ formattedBridgeFee() }}</span>
          </div>
        }

        <div class="my-1 border-t border-border"></div>

        <!-- You receive -->
        <div class="flex justify-between">
          <span class="font-medium">You receive</span>
          <span class="font-mono font-semibold text-emerald-500">
            {{ formattedOutput() }}
          </span>
        </div>
      </div>

      @if (isEstimate()) {
        <div class="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <z-icon zType="info" zSize="sm" />
          Estimated. Actual amounts may vary.
        </div>
      }
    </div>
  `,
})
export class FeeBreakdownComponent {
  /** The fee breakdown data to display */
  readonly breakdown = input.required<FeeBreakdown>();

  /** Whether to show the estimate disclaimer (default: true) */
  readonly isEstimate = input(true);

  /** Token symbol for display (e.g., 'CCX', 'wCCX') */
  readonly tokenSymbol = input('CCX');

  protected readonly formattedInput = computed(() => {
    const b = this.breakdown();
    return `${formatTokenAmount(b.inputAmount, b.inputDecimals)} ${this.tokenSymbol()}`;
  });

  protected readonly formattedGasFee = computed(() => {
    const b = this.breakdown();
    return formatNativeAmount(b.gasFee, b.nativeSymbol);
  });

  protected readonly hasBridgeFee = computed(() => this.breakdown().bridgeFee > 0n);

  protected readonly formattedBridgeFee = computed(() => {
    const b = this.breakdown();
    return `${formatTokenAmount(b.bridgeFee, b.outputDecimals)} ${this.tokenSymbol()}`;
  });

  protected readonly formattedOutput = computed(() => {
    const b = this.breakdown();
    return `${formatTokenAmount(b.outputAmount, b.outputDecimals)} ${this.tokenSymbol()}`;
  });
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Hash } from 'viem';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';

@Component({
  selector: 'app-step1-evm-to-ccx',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZardButtonComponent, ZardCardComponent],
  template: `
    <z-card zTitle="Processing" zDescription="Deposit accepted. We're processing your swap.">
      <div class="grid gap-3 text-sm">
        <div>
          Payment ID:
          <span class="font-mono text-xs text-muted-foreground">{{ paymentId() }}</span>
        </div>
        <div>
          EVM TX:
          <span class="font-mono text-xs text-muted-foreground">{{ evmTxHash() }}</span>
        </div>
      </div>

      <div card-footer class="mt-6">
        <button
          z-button
          zType="outline"
          zSize="sm"
          type="button"
          (click)="resetSwap.emit()"
          [zDisabled]="isBusy()"
          aria-label="Start over"
        >
          Start over
        </button>
      </div>
    </z-card>
  `,
})
export class Step1EvmToCcxComponent {
  readonly paymentId = input('');
  readonly evmTxHash = input<Hash | ''>('');
  readonly isBusy = input(false);

  readonly resetSwap = output<void>();
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';

import type { BridgeSwapStateResponse } from '../../../core/bridge-types';

@Component({
  selector: 'app-step2-complete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZardButtonComponent, ZardCardComponent],
  template: `
    <z-card zTitle="Complete" zDescription="Your swap has been processed.">
      @if (swapState(); as s) {
        <div class="grid gap-3 text-sm">
          <div>
            Swapped: <span class="font-semibold">{{ s.txdata?.swaped }}</span>
          </div>
          <div>
            Recipient:
            <span class="font-mono text-xs text-muted-foreground">{{ s.txdata?.address }}</span>
          </div>
          <div>
            Swap TX:
            <span class="font-mono text-xs text-muted-foreground">{{ s.txdata?.swapHash }}</span>
          </div>
          <div>
            Deposit TX:
            <span class="font-mono text-xs text-muted-foreground">{{ s.txdata?.depositHash }}</span>
          </div>
        </div>
      }
      <div card-footer class="mt-6">
        <button z-button type="button" (click)="resetSwap.emit()" aria-label="Start a new swap">
          New swap
        </button>
      </div>
    </z-card>
  `,
})
export class Step2CompleteComponent {
  readonly swapState = input<BridgeSwapStateResponse | null>(null);

  readonly resetSwap = output<void>();
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { QrCodeComponent } from '../../../shared/qr-code/qr-code.component';
import type { SwapContext } from '../swap-types';

@Component({
  selector: 'app-step1-ccx-to-evm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QrCodeComponent, ZardButtonComponent, ZardCardComponent, ZardIconComponent],
  template: `
    <z-card
      zTitle="Step 2 — Send CCX with payment ID"
      zDescription="Send your CCX to the bridge address and include the payment ID shown below. We'll keep checking until it's received."
    >
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="grid gap-3">
          <div class="text-sm font-medium">CCX deposit address</div>
          @if (ctx(); as c) {
            <div class="rounded-xl border border-border bg-muted p-3 font-mono text-xs">
              {{ c.config.ccx.accountAddress }}
            </div>
            <button
              z-button
              zType="outline"
              zSize="sm"
              type="button"
              (click)="copyAddress.emit(c.config.ccx.accountAddress)"
              aria-label="Copy CCX deposit address"
            >
              <z-icon zType="copy" zSize="sm" />
              Copy address
            </button>
            <app-qr-code [data]="c.config.ccx.accountAddress" alt="CCX deposit address QR" />
          } @else {
            <div class="text-sm text-muted-foreground">Loading…</div>
          }
        </div>

        <div class="grid gap-3">
          <div class="text-sm font-medium">Payment ID</div>
          <div class="rounded-xl border border-border bg-muted p-3 font-mono text-xs">
            {{ paymentId() }}
          </div>
          <button
            z-button
            zType="outline"
            zSize="sm"
            type="button"
            (click)="copyPaymentId.emit(paymentId())"
            [zDisabled]="!paymentId()"
            aria-label="Copy payment ID"
          >
            <z-icon zType="copy" zSize="sm" />
            Copy payment ID
          </button>
          <app-qr-code [data]="paymentId()" alt="Payment ID QR" />
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
export class Step1CcxToEvmComponent {
  readonly ctx = input<SwapContext | null>(null);
  readonly paymentId = input('');
  readonly isBusy = input(false);

  readonly copyAddress = output<string>();
  readonly copyPaymentId = output<string>();
  readonly resetSwap = output<void>();
}

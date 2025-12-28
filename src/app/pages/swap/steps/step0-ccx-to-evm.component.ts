import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';

import { EvmWalletService } from '../../../core/evm-wallet.service';
import { SwapFormService } from '../swap-form.service';
import type { SwapContext } from '../swap-types';

@Component({
  selector: 'app-step0-ccx-to-evm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCardComponent, ZardInputDirective],
  template: `
    <z-card
      zTitle="Step 1 — Pay gas & initialize"
      zDescription="We'll estimate the required gas fee for your selected network and ask your wallet to send it."
    >
      <div class="grid gap-4" [formGroup]="formService.ccxToEvmForm">
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="ccxFrom">Your CCX address</label>
          <input
            zInput
            id="ccxFrom"
            class="font-mono text-sm"
            formControlName="ccxFromAddress"
            placeholder="ccx…"
            autocomplete="off"
            spellcheck="false"
            aria-label="Your CCX address"
            [attr.aria-invalid]="
              (formService.ccxToEvmForm.controls.ccxFromAddress.invalid &&
                formService.ccxToEvmForm.controls.ccxFromAddress.touched) ||
              null
            "
            [attr.aria-describedby]="
              formService.ccxToEvmForm.controls.ccxFromAddress.invalid &&
              formService.ccxToEvmForm.controls.ccxFromAddress.touched
                ? 'ccxFrom-error'
                : 'ccxFrom-hint'
            "
          />
          @if (
            formService.ccxToEvmForm.controls.ccxFromAddress.invalid &&
            formService.ccxToEvmForm.controls.ccxFromAddress.touched
          ) {
            <p id="ccxFrom-error" class="text-xs text-destructive" role="alert">
              Please enter a valid CCX address (starts with ccx or CCX).
            </p>
          }
          <p id="ccxFrom-hint" class="text-xs text-muted-foreground">
            Used by the backend to associate the payment ID to your swap.
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium" for="evmTo">Your EVM address</label>
          <input
            zInput
            id="evmTo"
            class="font-mono text-sm"
            formControlName="evmToAddress"
            placeholder="0x…"
            autocomplete="off"
            spellcheck="false"
            aria-label="Your EVM address"
            [attr.aria-invalid]="
              (formService.ccxToEvmForm.controls.evmToAddress.invalid &&
                formService.ccxToEvmForm.controls.evmToAddress.touched) ||
              null
            "
            [attr.aria-describedby]="
              formService.ccxToEvmForm.controls.evmToAddress.invalid &&
              formService.ccxToEvmForm.controls.evmToAddress.touched
                ? 'evmTo-error'
                : null
            "
          />
          @if (
            formService.ccxToEvmForm.controls.evmToAddress.invalid &&
            formService.ccxToEvmForm.controls.evmToAddress.touched
          ) {
            <p id="evmTo-error" class="text-xs text-destructive" role="alert">
              Please enter a valid EVM address (starts with 0x).
            </p>
          }
          <div class="flex flex-wrap gap-2">
            <button
              z-button
              zType="outline"
              zSize="sm"
              type="button"
              (click)="useConnectedWallet()"
              [zDisabled]="!wallet.isConnected()"
              aria-label="Use connected wallet address"
            >
              Use connected wallet
            </button>
            <button
              z-button
              zType="outline"
              zSize="sm"
              type="button"
              (click)="addToken.emit()"
              [zDisabled]="!wallet.isConnected() || !ctx()"
              aria-label="Add wCCX token to wallet"
            >
              Add wCCX token
            </button>
          </div>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="amount1">Amount</label>
            <input
              zInput
              id="amount1"
              formControlName="amount"
              placeholder="0.0"
              inputmode="decimal"
              aria-label="Amount"
              [attr.aria-invalid]="
                (formService.ccxToEvmForm.controls.amount.invalid &&
                  formService.ccxToEvmForm.controls.amount.touched) ||
                null
              "
              [attr.aria-describedby]="
                formService.ccxToEvmForm.controls.amount.invalid &&
                formService.ccxToEvmForm.controls.amount.touched
                  ? 'amount1-error'
                  : 'amount1-hint'
              "
            />
            @if (
              formService.ccxToEvmForm.controls.amount.invalid &&
              formService.ccxToEvmForm.controls.amount.touched
            ) {
              <p id="amount1-error" class="text-xs text-destructive" role="alert">
                Please enter a valid amount.
              </p>
            }
            <div id="amount1-hint">
              @if (ctx(); as c) {
                <p class="text-xs text-muted-foreground">
                  Min {{ c.config.common.minSwapAmount }} · Max {{ c.config.common.maxSwapAmount }}
                </p>
              }
              @if (wccxLiquidity() !== null) {
                <p class="text-xs text-muted-foreground">
                  Available wCCX liquidity: {{ wccxLiquidity() }}
                </p>
              }
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium" for="email1">Email (optional)</label>
            <input
              zInput
              id="email1"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
              aria-label="Email (optional)"
              [attr.aria-invalid]="
                (formService.ccxToEvmForm.controls.email.invalid &&
                  formService.ccxToEvmForm.controls.email.touched) ||
                null
              "
              [attr.aria-describedby]="
                formService.ccxToEvmForm.controls.email.invalid &&
                formService.ccxToEvmForm.controls.email.touched
                  ? 'email1-error'
                  : 'email1-hint'
              "
            />
            @if (
              formService.ccxToEvmForm.controls.email.invalid &&
              formService.ccxToEvmForm.controls.email.touched
            ) {
              <p id="email1-error" class="text-xs text-destructive" role="alert">
                Please enter a valid email address.
              </p>
            }
            <p id="email1-hint" class="text-xs text-muted-foreground">
              Used only for notifications/support.
            </p>
          </div>
        </div>

        <button
          z-button
          type="button"
          class="mt-2"
          (click)="startSwap.emit()"
          [zLoading]="isBusy()"
          [zDisabled]="isBusy()"
          aria-label="Start swap"
        >
          Start swap
        </button>
      </div>
    </z-card>
  `,
})
export class Step0CcxToEvmComponent {
  readonly formService = inject(SwapFormService);
  readonly wallet = inject(EvmWalletService);

  readonly ctx = input<SwapContext | null>(null);
  readonly wccxLiquidity = input<number | null>(null);
  readonly isBusy = input(false);

  readonly startSwap = output<void>();
  readonly addToken = output<void>();

  useConnectedWallet(): void {
    const addr = this.wallet.address();
    if (addr) {
      this.formService.setEvmToAddress(addr);
    }
  }
}

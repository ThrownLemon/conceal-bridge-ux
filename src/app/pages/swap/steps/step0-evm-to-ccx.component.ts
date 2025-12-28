import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';

import { EvmWalletService } from '../../../core/evm-wallet.service';
import { SwapFormService } from '../swap-form.service';
import type { SwapContext } from '../swap-types';

@Component({
  selector: 'app-step0-evm-to-ccx',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCardComponent, ZardInputDirective],
  template: `
    <z-card
      zTitle="Step 1 — Send wCCX"
      zDescription="You'll send wCCX from your connected wallet to the bridge address."
    >
      <div class="grid gap-4" [formGroup]="formService.evmToCcxForm">
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="ccxTo">Your CCX address</label>
          <input
            zInput
            id="ccxTo"
            class="font-mono text-sm"
            formControlName="ccxToAddress"
            placeholder="ccx…"
            autocomplete="off"
            spellcheck="false"
            aria-label="Your CCX address"
            [attr.aria-invalid]="
              (formService.evmToCcxForm.controls.ccxToAddress.invalid &&
                formService.evmToCcxForm.controls.ccxToAddress.touched) ||
              null
            "
            [attr.aria-describedby]="
              formService.evmToCcxForm.controls.ccxToAddress.invalid &&
              formService.evmToCcxForm.controls.ccxToAddress.touched
                ? 'ccxTo-error'
                : null
            "
          />
          @if (
            formService.evmToCcxForm.controls.ccxToAddress.invalid &&
            formService.evmToCcxForm.controls.ccxToAddress.touched
          ) {
            <p id="ccxTo-error" class="text-xs text-destructive" role="alert">
              Please enter a valid CCX address (starts with ccx or CCX).
            </p>
          }
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="amount2">Amount</label>
            <input
              zInput
              id="amount2"
              formControlName="amount"
              placeholder="0.0"
              inputmode="decimal"
              aria-label="Amount"
              [attr.aria-invalid]="
                (formService.evmToCcxForm.controls.amount.invalid &&
                  formService.evmToCcxForm.controls.amount.touched) ||
                null
              "
              [attr.aria-describedby]="
                formService.evmToCcxForm.controls.amount.invalid &&
                formService.evmToCcxForm.controls.amount.touched
                  ? 'amount2-error'
                  : 'amount2-hint'
              "
            />
            @if (
              formService.evmToCcxForm.controls.amount.invalid &&
              formService.evmToCcxForm.controls.amount.touched
            ) {
              <p id="amount2-error" class="text-xs text-destructive" role="alert">
                Please enter a valid amount.
              </p>
            }
            <div id="amount2-hint">
              @if (ctx(); as c) {
                <p class="text-xs text-muted-foreground">
                  Min {{ c.config.common.minSwapAmount }} · Max {{ c.config.common.maxSwapAmount }}
                </p>
              }
              @if (ccxLiquidity() !== null) {
                <p class="text-xs text-muted-foreground">
                  Available CCX liquidity: {{ ccxLiquidity() }}
                </p>
              }
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium" for="email2">Email (optional)</label>
            <input
              zInput
              id="email2"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
              aria-label="Email (optional)"
              [attr.aria-invalid]="
                (formService.evmToCcxForm.controls.email.invalid &&
                  formService.evmToCcxForm.controls.email.touched) ||
                null
              "
              [attr.aria-describedby]="
                formService.evmToCcxForm.controls.email.invalid &&
                formService.evmToCcxForm.controls.email.touched
                  ? 'email2-error'
                  : null
              "
            />
            @if (
              formService.evmToCcxForm.controls.email.invalid &&
              formService.evmToCcxForm.controls.email.touched
            ) {
              <p id="email2-error" class="text-xs text-destructive" role="alert">
                Please enter a valid email address.
              </p>
            }
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
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
export class Step0EvmToCcxComponent {
  readonly formService = inject(SwapFormService);
  readonly wallet = inject(EvmWalletService);

  readonly ctx = input<SwapContext | null>(null);
  readonly ccxLiquidity = input<number | null>(null);
  readonly isBusy = input(false);

  readonly startSwap = output<void>();
  readonly addToken = output<void>();
}

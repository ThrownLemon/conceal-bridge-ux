import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, filter, map, of, Subject, switchMap, take, takeUntil, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { firstValueFrom } from 'rxjs';
import { isAddress, parseEther, parseUnits, type Hash } from 'viem';

import { ZardAlertComponent } from '@/shared/components/alert/alert.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';

import { BridgeApiService } from '../../core/bridge-api.service';
import type {
  BridgeChainConfig,
  BridgeSwapStateResponse,
  EvmNetworkKey,
  SwapDirection,
} from '../../core/bridge-types';
import { EVM_NETWORK_KEYS } from '../../core/bridge-types';
import { EVM_NETWORKS } from '../../core/evm-networks';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { TransactionHistoryService } from '../../core/transaction-history.service';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { BackoffManager, type BackoffConfig } from '../../core/utils/backoff';
import { WalletButtonComponent } from '../../shared/wallet/wallet-button.component';

/** Polling configuration with exponential backoff on errors. */
const POLLING_CONFIG = {
  /** Interval between successful polls in milliseconds. */
  successInterval: 10_000,
  /** Backoff configuration for retry after errors. */
  backoff: {
    baseDelay: 2_000,
    maxDelay: 30_000,
    maxRetries: 5,
    jitter: true,
    jitterFactor: 0.2,
  } satisfies Partial<BackoffConfig>,
};

const CCX_ADDRESS_RE = /^[Cc][Cc][Xx][a-zA-Z0-9]{95}$/;
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function isEvmNetworkKey(value: string | null): value is EvmNetworkKey {
  return !!value && (EVM_NETWORK_KEYS as readonly string[]).includes(value);
}

function isSwapDirection(value: string | null): value is SwapDirection {
  return value === 'ccx-to-evm' || value === 'evm-to-ccx';
}

function inferDecimalsFromUnits(units: number): number | null {
  if (!Number.isFinite(units) || units <= 0) return null;
  const decimals = Math.round(Math.log10(units));
  if (decimals < 0 || decimals > 18) return null;
  // Ensure it's an exact power of 10.
  if (10 ** decimals !== units) return null;
  return decimals;
}

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

@Component({
  selector: 'app-swap-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    QrCodeComponent,
    WalletButtonComponent,
    ZardAlertComponent,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardInputDirective,
  ],
  template: `
    <div class="mx-auto max-w-3xl">
      <!-- Screen reader live region for loading announcements -->
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {{ loadingAnnouncement() }}
      </div>

      <a z-button zType="ghost" zSize="sm" routerLink="/" class="!px-0" aria-label="Back to home">
        <z-icon zType="arrow-left" zSize="sm" />
        Back
      </a>

      <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="grid gap-1">
          <h1 class="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            @if (direction(); as d) {
              @if (d === 'ccx-to-evm') {
                CCX → wCCX
              } @else {
                wCCX → CCX
              }
            } @else {
              Swap
            }
          </h1>
          <div class="text-sm text-muted-foreground">
            @if (networkInfo(); as info) {
              Network: {{ info.label }}
            } @else {
              Unknown network
            }
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <app-wallet-button />
        </div>
      </div>

      @if (pageError(); as err) {
        <z-alert class="mt-6" zType="destructive" [zTitle]="err" />
      }

      @if (statusMessage(); as msg) {
        <z-alert class="mt-6" [zTitle]="msg" />
      }

      @if (balanceFetchError(); as err) {
        <z-alert class="mt-6" zType="destructive" [zTitle]="err" zIcon="triangle-alert" />
      }

      @if (pollingError(); as err) {
        <z-alert class="mt-6" zType="destructive" [zTitle]="err" zIcon="triangle-alert" />
      }

      @if (direction(); as d) {
        @if (d === 'ccx-to-evm') {
          <ng-container [formGroup]="ccxToEvmForm">
            @if (step() === 0) {
              <z-card
                class="mt-6"
                zTitle="Step 1 — Pay gas & initialize"
                zDescription="We'll estimate the required gas fee for your selected network and ask your wallet to send it."
              >
                <div class="grid gap-4">
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
                        (ccxToEvmForm.controls.ccxFromAddress.invalid &&
                          ccxToEvmForm.controls.ccxFromAddress.touched) ||
                        null
                      "
                      [attr.aria-describedby]="
                        ccxToEvmForm.controls.ccxFromAddress.invalid &&
                        ccxToEvmForm.controls.ccxFromAddress.touched
                          ? 'ccxFrom-error'
                          : 'ccxFrom-hint'
                      "
                    />
                    @if (
                      ccxToEvmForm.controls.ccxFromAddress.invalid &&
                      ccxToEvmForm.controls.ccxFromAddress.touched
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
                        (ccxToEvmForm.controls.evmToAddress.invalid &&
                          ccxToEvmForm.controls.evmToAddress.touched) ||
                        null
                      "
                      [attr.aria-describedby]="
                        ccxToEvmForm.controls.evmToAddress.invalid &&
                        ccxToEvmForm.controls.evmToAddress.touched
                          ? 'evmTo-error'
                          : null
                      "
                    />
                    @if (
                      ccxToEvmForm.controls.evmToAddress.invalid &&
                      ccxToEvmForm.controls.evmToAddress.touched
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
                        (click)="useConnectedWalletAsEvmTo()"
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
                        (click)="addTokenToWallet()"
                        [zDisabled]="!wallet.isConnected() || !config()"
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
                          (ccxToEvmForm.controls.amount.invalid &&
                            ccxToEvmForm.controls.amount.touched) ||
                          null
                        "
                        [attr.aria-describedby]="
                          ccxToEvmForm.controls.amount.invalid &&
                          ccxToEvmForm.controls.amount.touched
                            ? 'amount1-error'
                            : 'amount1-hint'
                        "
                      />
                      @if (
                        ccxToEvmForm.controls.amount.invalid && ccxToEvmForm.controls.amount.touched
                      ) {
                        <p id="amount1-error" class="text-xs text-destructive" role="alert">
                          Please enter a valid amount.
                        </p>
                      }
                      <div id="amount1-hint">
                        @if (config(); as cfg) {
                          <p class="text-xs text-muted-foreground">
                            Min {{ cfg.common.minSwapAmount }} · Max {{ cfg.common.maxSwapAmount }}
                          </p>
                        }
                        @if (wccxSwapBalance() !== null) {
                          <p class="text-xs text-muted-foreground">
                            Available wCCX liquidity: {{ wccxSwapBalance() }}
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
                          (ccxToEvmForm.controls.email.invalid &&
                            ccxToEvmForm.controls.email.touched) ||
                          null
                        "
                        [attr.aria-describedby]="
                          ccxToEvmForm.controls.email.invalid && ccxToEvmForm.controls.email.touched
                            ? 'email1-error'
                            : 'email1-hint'
                        "
                      />
                      @if (
                        ccxToEvmForm.controls.email.invalid && ccxToEvmForm.controls.email.touched
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
                    (click)="startCcxToEvm()"
                    [zLoading]="isBusy()"
                    [zDisabled]="isBusy()"
                    aria-label="Start swap"
                  >
                    Start swap
                  </button>
                </div>
              </z-card>
            } @else if (step() === 1) {
              <z-card
                class="mt-6"
                zTitle="Step 2 — Send CCX with payment ID"
                zDescription="Send your CCX to the bridge address and include the payment ID shown below. We'll keep checking until it's received."
              >
                <div class="grid gap-6 sm:grid-cols-2">
                  <div class="grid gap-3">
                    <div class="text-sm font-medium">CCX deposit address</div>
                    @if (config(); as cfg) {
                      <div class="rounded-xl border border-border bg-muted p-3 font-mono text-xs">
                        {{ cfg.ccx.accountAddress }}
                      </div>
                      <button
                        z-button
                        zType="outline"
                        zSize="sm"
                        type="button"
                        (click)="copy(cfg.ccx.accountAddress)"
                        aria-label="Copy CCX deposit address"
                      >
                        <z-icon zType="copy" zSize="sm" />
                        Copy address
                      </button>
                      <app-qr-code [data]="cfg.ccx.accountAddress" alt="CCX deposit address QR" />
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
                      (click)="copy(paymentId())"
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
                    (click)="reset()"
                    [zDisabled]="isBusy()"
                    aria-label="Start over"
                  >
                    Start over
                  </button>
                </div>
              </z-card>
            } @else {
              <z-card class="mt-6" zTitle="Complete" zDescription="Your swap has been processed.">
                @if (swapState(); as s) {
                  <div class="grid gap-3 text-sm">
                    <div>
                      Swapped: <span class="font-semibold">{{ s.txdata?.swaped }}</span>
                    </div>
                    <div>
                      Recipient:
                      <span class="font-mono text-xs text-muted-foreground">{{
                        s.txdata?.address
                      }}</span>
                    </div>
                    <div>
                      Swap TX:
                      <span class="font-mono text-xs text-muted-foreground">{{
                        s.txdata?.swapHash
                      }}</span>
                    </div>
                    <div>
                      Deposit TX:
                      <span class="font-mono text-xs text-muted-foreground">{{
                        s.txdata?.depositHash
                      }}</span>
                    </div>
                  </div>
                }
                <div card-footer class="mt-6">
                  <button z-button type="button" (click)="reset()" aria-label="Start a new swap">
                    New swap
                  </button>
                </div>
              </z-card>
            }
          </ng-container>
        } @else {
          <ng-container [formGroup]="evmToCcxForm">
            @if (step() === 0) {
              <z-card
                class="mt-6"
                zTitle="Step 1 — Send wCCX"
                zDescription="You'll send wCCX from your connected wallet to the bridge address."
              >
                <div class="grid gap-4">
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
                        (evmToCcxForm.controls.ccxToAddress.invalid &&
                          evmToCcxForm.controls.ccxToAddress.touched) ||
                        null
                      "
                      [attr.aria-describedby]="
                        evmToCcxForm.controls.ccxToAddress.invalid &&
                        evmToCcxForm.controls.ccxToAddress.touched
                          ? 'ccxTo-error'
                          : null
                      "
                    />
                    @if (
                      evmToCcxForm.controls.ccxToAddress.invalid &&
                      evmToCcxForm.controls.ccxToAddress.touched
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
                          (evmToCcxForm.controls.amount.invalid &&
                            evmToCcxForm.controls.amount.touched) ||
                          null
                        "
                        [attr.aria-describedby]="
                          evmToCcxForm.controls.amount.invalid &&
                          evmToCcxForm.controls.amount.touched
                            ? 'amount2-error'
                            : 'amount2-hint'
                        "
                      />
                      @if (
                        evmToCcxForm.controls.amount.invalid && evmToCcxForm.controls.amount.touched
                      ) {
                        <p id="amount2-error" class="text-xs text-destructive" role="alert">
                          Please enter a valid amount.
                        </p>
                      }
                      <div id="amount2-hint">
                        @if (config(); as cfg) {
                          <p class="text-xs text-muted-foreground">
                            Min {{ cfg.common.minSwapAmount }} · Max {{ cfg.common.maxSwapAmount }}
                          </p>
                        }
                        @if (ccxSwapBalance() !== null) {
                          <p class="text-xs text-muted-foreground">
                            Available CCX liquidity: {{ ccxSwapBalance() }}
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
                          (evmToCcxForm.controls.email.invalid &&
                            evmToCcxForm.controls.email.touched) ||
                          null
                        "
                        [attr.aria-describedby]="
                          evmToCcxForm.controls.email.invalid && evmToCcxForm.controls.email.touched
                            ? 'email2-error'
                            : null
                        "
                      />
                      @if (
                        evmToCcxForm.controls.email.invalid && evmToCcxForm.controls.email.touched
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
                      (click)="addTokenToWallet()"
                      [zDisabled]="!wallet.isConnected() || !config()"
                      aria-label="Add wCCX token to wallet"
                    >
                      Add wCCX token
                    </button>
                  </div>

                  <button
                    z-button
                    type="button"
                    class="mt-2"
                    (click)="startEvmToCcx()"
                    [zLoading]="isBusy()"
                    [zDisabled]="isBusy()"
                    aria-label="Start swap"
                  >
                    Start swap
                  </button>
                </div>
              </z-card>
            } @else if (step() === 1) {
              <z-card
                class="mt-6"
                zTitle="Processing"
                zDescription="Deposit accepted. We're processing your swap."
              >
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
                    (click)="reset()"
                    [zDisabled]="isBusy()"
                    aria-label="Start over"
                  >
                    Start over
                  </button>
                </div>
              </z-card>
            } @else {
              <z-card class="mt-6" zTitle="Complete" zDescription="Your swap has been processed.">
                @if (swapState(); as s) {
                  <div class="grid gap-3 text-sm">
                    <div>
                      Swapped: <span class="font-semibold">{{ s.txdata?.swaped }}</span>
                    </div>
                    <div>
                      Recipient:
                      <span class="font-mono text-xs text-muted-foreground">{{
                        s.txdata?.address
                      }}</span>
                    </div>
                    <div>
                      Swap TX:
                      <span class="font-mono text-xs text-muted-foreground">{{
                        s.txdata?.swapHash
                      }}</span>
                    </div>
                    <div>
                      Deposit TX:
                      <span class="font-mono text-xs text-muted-foreground">{{
                        s.txdata?.depositHash
                      }}</span>
                    </div>
                  </div>
                }
                <div card-footer class="mt-6">
                  <button z-button type="button" (click)="reset()" aria-label="Start a new swap">
                    New swap
                  </button>
                </div>
              </z-card>
            }
          </ng-container>
        }
      }
    </div>
  `,
})
export class SwapPage {
  readonly #destroyRef = inject(DestroyRef);
  readonly #route = inject(ActivatedRoute);
  readonly #fb = inject(NonNullableFormBuilder);

  readonly api = inject(BridgeApiService);
  readonly wallet = inject(EvmWalletService);
  readonly historyService = inject(TransactionHistoryService);

  readonly #directionParam = toSignal(this.#route.paramMap.pipe(map((pm) => pm.get('direction'))), {
    initialValue: null,
  });

  readonly #networkParam = toSignal(this.#route.paramMap.pipe(map((pm) => pm.get('network'))), {
    initialValue: null,
  });

  readonly direction = computed<SwapDirection | null>(() => {
    const d = this.#directionParam();
    return isSwapDirection(d) ? d : null;
  });

  readonly networkKey = computed<EvmNetworkKey | null>(() => {
    const n = this.#networkParam();
    return isEvmNetworkKey(n) ? n : null;
  });

  readonly networkInfo = computed(() => {
    const key = this.networkKey();
    return key ? EVM_NETWORKS[key] : null;
  });

  readonly config = signal<BridgeChainConfig | null>(null);
  readonly ccxSwapBalance = signal<number | null>(null);
  readonly wccxSwapBalance = signal<number | null>(null);

  readonly step = signal<0 | 1 | 2>(0);
  readonly isBusy = signal(false);

  readonly paymentId = signal('');
  readonly evmTxHash = signal<Hash | ''>('');
  readonly swapState = signal<BridgeSwapStateResponse | null>(null);

  readonly pageError = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly balanceFetchError = signal<string | null>(null);
  readonly pollingError = signal<string | null>(null);

  /** Screen reader announcement for loading states */
  readonly loadingAnnouncement = computed(() => {
    const dir = this.direction();
    if (!dir) {
      return '';
    }

    // Step 0: Initial processing (isBusy is true)
    if (this.isBusy()) {
      return dir === 'ccx-to-evm'
        ? 'Processing swap initialization, please wait.'
        : 'Processing transaction, please wait.';
    }

    // Step 1: Polling phase (isBusy is false, but still waiting)
    if (this.step() === 1) {
      return dir === 'ccx-to-evm'
        ? 'Checking for deposit confirmation, please wait.'
        : 'Processing swap, please wait.';
    }

    return '';
  });

  // Track polling subscription to cancel previous ones when starting new polling
  readonly #pollingCancel$ = new Subject<void>();
  #backoffManager: BackoffManager | null = null;

  readonly ccxToEvmForm = this.#fb.group({
    ccxFromAddress: this.#fb.control('', [Validators.required, Validators.pattern(CCX_ADDRESS_RE)]),
    evmToAddress: this.#fb.control('', [Validators.required, Validators.pattern(EVM_ADDRESS_RE)]),
    amount: this.#fb.control('', [
      Validators.required,
      Validators.pattern(/^[0-9]+\.?[0-9]*$/),
      Validators.maxLength(32),
    ]),
    email: this.#fb.control('', [Validators.email, Validators.maxLength(254)]),
  });

  readonly evmToCcxForm = this.#fb.group({
    ccxToAddress: this.#fb.control('', [Validators.required, Validators.pattern(CCX_ADDRESS_RE)]),
    amount: this.#fb.control('', [
      Validators.required,
      Validators.pattern(/^[0-9]+\.?[0-9]*$/),
      Validators.maxLength(32),
    ]),
    email: this.#fb.control('', [Validators.email, Validators.maxLength(254)]),
  });

  constructor() {
    // Best-practice: hydrate wallet state without prompting.
    void this.wallet.hydrate();

    // Load config + balances when network changes.
    const network$ = this.#route.paramMap.pipe(
      map((pm) => pm.get('network')),
      filter(isEvmNetworkKey),
    );

    network$
      .pipe(
        switchMap((network) =>
          this.api.getChainConfig(network).pipe(
            catchError((error: unknown) => {
              console.error('[SwapPage] Failed to load config:', {
                network,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              });

              const msg =
                error instanceof Error ? error.message : 'Failed to load bridge configuration.';
              this.pageError.set(msg);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((cfg) => {
        if (!cfg) return;
        this.pageError.set(null);
        this.config.set(cfg);
        this.statusMessage.set(null);
        this.reset();
      });

    network$
      .pipe(
        switchMap((network) =>
          this.api.getCcxSwapBalance(network).pipe(
            catchError((error: unknown) => {
              console.error('[SwapPage] Failed to fetch balance:', {
                network,
                error: error instanceof Error ? error.message : String(error),
              });
              this.balanceFetchError.set(
                'Unable to verify available liquidity. Proceed with caution.',
              );
              return of({ result: false, balance: 0 });
            }),
            map((r) => (r.result ? r.balance : null)),
          ),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((balance) => {
        if (balance !== null) this.balanceFetchError.set(null);
        this.ccxSwapBalance.set(balance);
      });

    network$
      .pipe(
        switchMap((network) =>
          this.api.getWccxSwapBalance(network).pipe(
            catchError((error: unknown) => {
              console.error('[SwapPage] Failed to fetch wCCX balance:', {
                network,
                error: error instanceof Error ? error.message : String(error),
              });
              this.balanceFetchError.set(
                'Unable to verify available liquidity. Proceed with caution.',
              );
              return of({ result: false, balance: 0 });
            }),
            map((r) => (r.result ? r.balance : null)),
          ),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((balance) => {
        if (balance !== null) this.balanceFetchError.set(null);
        this.wccxSwapBalance.set(balance);
      });

    // Validate direction param.
    const dir = this.direction();
    if (!dir) {
      this.pageError.set('Unknown swap direction.');
    }
  }

  // Wallet connection is handled via the shared wallet button/modal in the header/UI.

  async addTokenToWallet(): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;

    const decimals = inferDecimalsFromUnits(cfg.wccx.units) ?? 6;
    try {
      // Ensure wallet is on the same network as the token contract.
      const info = this.networkInfo();
      if (info) {
        await this.wallet.ensureChain(info.chain);
      }

      await this.wallet.watchErc20Asset({
        address: cfg.wccx.contractAddress,
        symbol: 'wCCX',
        decimals,
        image: 'https://conceal.network/images/branding/team-64x64.png',
      });
      this.statusMessage.set('Token request sent to wallet.');
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      const msg = e instanceof Error ? e.message : 'Failed to add token.';

      if (code === 4001) {
        this.statusMessage.set('Token request was cancelled in your wallet.');
        return;
      }

      // Some WalletConnect wallets throw a generic -32603 for unsupported token/watchAsset.
      if (code === -32603 || /not supported/i.test(msg)) {
        this.statusMessage.set(
          `Your wallet doesn’t support adding tokens automatically on this network. Add wCCX manually:\n` +
            `Contract: ${cfg.wccx.contractAddress}\n` +
            `Symbol: wCCX\n` +
            `Decimals: ${decimals}`,
        );
        return;
      }

      this.statusMessage.set(msg);
    }
  }

  useConnectedWalletAsEvmTo(): void {
    const addr = this.wallet.address();
    if (!addr) return;
    this.ccxToEvmForm.controls.evmToAddress.setValue(addr);
  }

  reset(): void {
    // Cancel any active polling when resetting
    this.#pollingCancel$.next();
    this.#backoffManager = null;
    this.step.set(0);
    this.isBusy.set(false);
    this.paymentId.set('');
    this.evmTxHash.set('');
    this.swapState.set(null);
    this.statusMessage.set(null);
  }

  async startCcxToEvm(): Promise<void> {
    if (this.direction() !== 'ccx-to-evm') return;

    this.statusMessage.set(null);
    this.pageError.set(null);

    this.ccxToEvmForm.markAllAsTouched();
    if (this.ccxToEvmForm.invalid) {
      this.statusMessage.set('Please fix the form errors.');
      return;
    }

    const network = this.networkKey();
    const cfg = this.config();
    const info = this.networkInfo();
    if (!network || !cfg || !info) {
      this.statusMessage.set('Missing network configuration.');
      return;
    }

    const amount = Number.parseFloat(this.ccxToEvmForm.controls.amount.value);
    if (!Number.isFinite(amount)) {
      this.statusMessage.set('Invalid amount.');
      return;
    }

    if (amount < cfg.common.minSwapAmount || amount > cfg.common.maxSwapAmount) {
      this.statusMessage.set(
        `Amount must be between ${cfg.common.minSwapAmount} and ${cfg.common.maxSwapAmount}.`,
      );
      return;
    }

    const wccxLiquidity = this.wccxSwapBalance();
    if (wccxLiquidity !== null && wccxLiquidity < amount) {
      this.statusMessage.set(
        'Due to high demand, there are not enough funds to cover this transfer. Please check back later.',
      );
      return;
    }

    const ccxFrom = this.ccxToEvmForm.controls.ccxFromAddress.value;
    if (!CCX_ADDRESS_RE.test(ccxFrom)) {
      this.statusMessage.set('Invalid CCX address.');
      return;
    }

    const evmTo = this.ccxToEvmForm.controls.evmToAddress.value;
    if (!isAddress(evmTo)) {
      this.statusMessage.set('Invalid EVM address.');
      return;
    }

    const emailRaw = this.ccxToEvmForm.controls.email.value.trim();
    const email = emailRaw.length ? emailRaw : undefined;

    this.isBusy.set(true);
    this.statusMessage.set('Connecting wallet…');

    try {
      await this.wallet.connect();
      await this.wallet.ensureChain(info.chain);

      this.statusMessage.set('Estimating gas…');
      const [estimate, gasPrice] = await Promise.all([
        firstValueFrom(this.api.estimateGasPrice(network, amount)),
        firstValueFrom(this.api.getGasPrice(network)),
      ]);

      if (!estimate?.result || !estimate.gas) {
        throw new Error('Failed to estimate gas (backend error).');
      }
      if (!gasPrice?.result || !gasPrice.gas) {
        throw new Error('Failed to get gas price (backend error).');
      }

      const bridgeEvmAccount = cfg.wccx.accountAddress;
      if (!isAddress(bridgeEvmAccount)) throw new Error('Bridge recipient address is invalid.');

      const value = parseEther(estimate.gas.toString());
      if (value <= 0n) throw new Error('Estimated gas fee is zero.');

      this.statusMessage.set('Sending gas fee transaction…');
      const hash = await this.wallet.sendNativeTransaction({
        chain: info.chain,
        to: bridgeEvmAccount,
        value,
      });
      this.evmTxHash.set(hash);

      this.statusMessage.set('Waiting for confirmations…');
      await this.wallet.waitForReceipt({
        chain: info.chain,
        hash,
        confirmations: cfg.wccx.confirmations,
      });

      this.statusMessage.set('Initializing swap…');
      const init = await firstValueFrom(
        this.api.sendCcxToWccxInit(network, {
          email,
          amount,
          toAddress: evmTo,
          fromAddress: ccxFrom,
          txfeehash: hash,
        }),
      );

      if (!init.success || !init.paymentId) {
        throw new Error(init.error || 'Swap initialization failed.');
      }

      this.paymentId.set(init.paymentId);
      this.step.set(1);
      this.isBusy.set(false);
      this.statusMessage.set('Waiting for CCX deposit…');

      this.startPolling(network, 'wccx', init.paymentId);
    } catch (e: unknown) {
      this.isBusy.set(false);
      this.statusMessage.set(e instanceof Error ? e.message : 'Swap failed.');
    }
  }

  async startEvmToCcx(): Promise<void> {
    if (this.direction() !== 'evm-to-ccx') return;

    this.statusMessage.set(null);
    this.pageError.set(null);

    this.evmToCcxForm.markAllAsTouched();
    if (this.evmToCcxForm.invalid) {
      this.statusMessage.set('Please fix the form errors.');
      return;
    }

    const network = this.networkKey();
    const cfg = this.config();
    const info = this.networkInfo();
    if (!network || !cfg || !info) {
      this.statusMessage.set('Missing network configuration.');
      return;
    }

    const amount = Number.parseFloat(this.evmToCcxForm.controls.amount.value);
    if (!Number.isFinite(amount)) {
      this.statusMessage.set('Invalid amount.');
      return;
    }

    if (amount < cfg.common.minSwapAmount || amount > cfg.common.maxSwapAmount) {
      this.statusMessage.set(
        `Amount must be between ${cfg.common.minSwapAmount} and ${cfg.common.maxSwapAmount}.`,
      );
      return;
    }

    const ccxLiquidity = this.ccxSwapBalance();
    if (ccxLiquidity !== null && ccxLiquidity < amount) {
      this.statusMessage.set(
        'Due to high demand, there are not enough funds to cover this transfer. Please check back later.',
      );
      return;
    }

    const ccxTo = this.evmToCcxForm.controls.ccxToAddress.value;
    if (!CCX_ADDRESS_RE.test(ccxTo)) {
      this.statusMessage.set('Invalid CCX address.');
      return;
    }

    const emailRaw = this.evmToCcxForm.controls.email.value.trim();
    const email = emailRaw.length ? emailRaw : undefined;

    const decimals = inferDecimalsFromUnits(cfg.wccx.units) ?? 6;

    this.isBusy.set(true);
    this.statusMessage.set('Connecting wallet…');

    try {
      const account = await this.wallet.connect();
      await this.wallet.ensureChain(info.chain);

      const { publicClient, walletClient } = this.wallet.getClients(info.chain);

      const transferAmount = parseUnits(amount.toString(), decimals);

      this.statusMessage.set('Checking wCCX balance…');
      const tokenBalance = await publicClient.readContract({
        address: cfg.wccx.contractAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
      });

      if (tokenBalance < transferAmount) {
        throw new Error('Insufficient wCCX balance for this transfer.');
      }

      this.statusMessage.set('Sending wCCX transfer…');
      const hash = await walletClient.writeContract({
        account,
        chain: info.chain,
        address: cfg.wccx.contractAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [cfg.wccx.accountAddress, transferAmount],
      });
      this.evmTxHash.set(hash);

      this.statusMessage.set('Waiting for confirmations…');
      await this.wallet.waitForReceipt({
        chain: info.chain,
        hash,
        confirmations: cfg.wccx.confirmations,
      });

      this.statusMessage.set('Initializing swap…');
      const init = await firstValueFrom(
        this.api.sendWccxToCcxInit(network, {
          fromAddress: account,
          toAddress: ccxTo,
          txHash: hash,
          amount,
          email,
        }),
      );

      if (!init.success || !init.paymentId) {
        throw new Error(init.error || 'Swap initialization failed.');
      }

      this.paymentId.set(init.paymentId);

      this.statusMessage.set('Executing swap…');
      const exec = await firstValueFrom(
        this.api.execWccxToCcxSwap(network, { paymentId: init.paymentId, email }),
      );
      if (!exec.success) {
        throw new Error(exec.error || 'Swap execution failed.');
      }

      this.step.set(1);
      this.isBusy.set(false);
      this.statusMessage.set('Processing swap…');

      this.startPolling(network, 'ccx', init.paymentId);
    } catch (e: unknown) {
      this.isBusy.set(false);
      this.statusMessage.set(e instanceof Error ? e.message : 'Swap failed.');
    }
  }

  startPolling(network: EvmNetworkKey, direction: 'wccx' | 'ccx', paymentId: string): void {
    // Cancel any previous polling before starting new one
    this.#pollingCancel$.next();
    this.#backoffManager = new BackoffManager(POLLING_CONFIG.backoff);
    this.pollingError.set(null);

    // Start with immediate poll (delay 0)
    this.#scheduleNextPoll(0, network, direction, paymentId);
  }

  /** Schedules the next poll with the given delay. */
  #scheduleNextPoll(
    delayMs: number,
    network: EvmNetworkKey,
    direction: 'wccx' | 'ccx',
    paymentId: string,
  ): void {
    timer(delayMs)
      .pipe(
        switchMap(() =>
          this.api.checkSwapState(network, direction, paymentId).pipe(
            catchError((error: unknown) => {
              console.error('[SwapPage] Polling error:', {
                network,
                direction,
                paymentId,
                error: error instanceof Error ? error.message : String(error),
                attempt: this.#backoffManager?.attempt ?? 0,
              });
              return of(null);
            }),
          ),
        ),
        take(1),
        takeUntil(this.#pollingCancel$),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((response) => this.#handlePollResponse(response, network, direction, paymentId));
  }

  /** Handles a poll response, scheduling the next poll if needed. */
  #handlePollResponse(
    response: BridgeSwapStateResponse | null,
    network: EvmNetworkKey,
    direction: 'wccx' | 'ccx',
    paymentId: string,
  ): void {
    const backoff = this.#backoffManager;
    if (!backoff) return;

    // Handle error (null response)
    if (!response) {
      // Check exhaustion BEFORE calling nextDelay to ensure all retries are scheduled
      if (backoff.isExhausted()) {
        const lastErr = backoff.lastError;
        console.error('[SwapPage] Polling exhausted after max retries:', {
          network,
          direction,
          paymentId,
          attempts: backoff.maxRetries,
          lastError: lastErr instanceof Error ? lastErr.message : String(lastErr),
        });

        this.pollingError.set(
          `Unable to check swap status after ${backoff.maxRetries} attempts. ` +
            `Your transaction may still be processing. ` +
            `Save your payment ID for support: ${paymentId}`,
        );
        return;
      }

      const nextDelay = backoff.nextDelay();
      this.pollingError.set(
        `Temporary connection issue. Retrying in ${Math.round(nextDelay / 1000)}s...`,
      );

      // Schedule retry with backoff delay
      this.#scheduleNextPoll(nextDelay, network, direction, paymentId);
      return;
    }

    // Reset backoff on successful API response
    backoff.reset();
    this.pollingError.set(null);

    // Check if swap is complete
    if (response.result === true) {
      this.swapState.set(response);
      this.step.set(2);
      this.statusMessage.set('Payment received!');

      // Add to history
      if (response.txdata) {
        this.historyService.addTransaction({
          id: paymentId,
          timestamp: Date.now(),
          amount: response.txdata.swaped,
          direction: direction === 'wccx' ? 'ccx-to-evm' : 'evm-to-ccx',
          network,
          status: 'completed',
          depositHash: response.txdata.depositHash,
          swapHash: response.txdata.swapHash,
          recipientAddress: response.txdata.address,
        });
      }
      return;
    }

    // Schedule next poll with standard interval
    this.#scheduleNextPoll(POLLING_CONFIG.successInterval, network, direction, paymentId);
  }

  async copy(text: string): Promise<void> {
    const value = text.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      this.statusMessage.set('Copied to clipboard.');
      await new Promise((r) => setTimeout(r, 1200));
      // Only clear if it wasn't replaced by another message.
      if (this.statusMessage() === 'Copied to clipboard.') this.statusMessage.set(null);
    } catch (error: unknown) {
      console.warn('[SwapPage] Clipboard copy failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.statusMessage.set('Copy failed (clipboard unavailable).');
    }
  }
}

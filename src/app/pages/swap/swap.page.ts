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
import { WalletButtonComponent } from '../../shared/wallet/wallet-button.component';

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
  imports: [ReactiveFormsModule, RouterLink, QrCodeComponent, WalletButtonComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <a
        routerLink="/"
        class="text-sm font-medium text-[var(--cb-color-text-secondary)] hover:text-[var(--cb-color-text)]"
        aria-label="Back to home"
        >← Back</a
      >

      <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="grid gap-1">
          <h1
            class="text-center text-3xl font-bold tracking-tight text-[var(--cb-color-text)] sm:text-4xl"
          >
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
          <div class="text-sm text-[var(--cb-color-muted)]">
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
        <div
          class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          role="alert"
        >
          {{ err }}
        </div>
      }

      @if (statusMessage(); as msg) {
        <div
          class="mt-6 rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-4 text-sm text-[var(--cb-color-text)]"
          aria-live="polite"
        >
          {{ msg }}
        </div>
      }

      @if (direction(); as d) {
        @if (d === 'ccx-to-evm') {
          <ng-container [formGroup]="ccxToEvmForm">
            @if (step() === 0) {
              <div
                class="mt-6 rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-5"
              >
                <h2 class="text-base font-semibold text-[var(--cb-color-text)]">
                  Step 1 — Pay gas &amp; initialize
                </h2>
                <p class="mt-1 text-sm text-[var(--cb-color-text-secondary)]">
                  We’ll estimate the required gas fee for your selected network and ask your wallet
                  to send it.
                </p>

                <div class="mt-5 grid gap-4">
                  <div class="grid gap-2">
                    <label class="text-sm font-medium text-[var(--cb-color-text)]" for="ccxFrom"
                      >Your CCX address</label
                    >
                    <input
                      id="ccxFrom"
                      class="w-full rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 font-mono text-sm text-[var(--cb-color-text)] outline-none focus:border-[var(--cb-color-accent)] focus:ring-2 focus:ring-[var(--cb-color-accent)]/30"
                      formControlName="ccxFromAddress"
                      placeholder="ccx…"
                      autocomplete="off"
                      spellcheck="false"
                      aria-label="Your CCX address"
                    />
                    <p class="text-xs text-[var(--cb-color-muted)]">
                      Used by the backend to associate the payment ID to your swap.
                    </p>
                  </div>

                  <div class="grid gap-2">
                    <label class="text-sm font-medium text-[var(--cb-color-text)]" for="evmTo"
                      >Your EVM address</label
                    >
                    <input
                      id="evmTo"
                      class="w-full rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 font-mono text-sm text-[var(--cb-color-text)] outline-none focus:border-[var(--cb-color-accent)] focus:ring-2 focus:ring-[var(--cb-color-accent)]/30"
                      formControlName="evmToAddress"
                      placeholder="0x…"
                      autocomplete="off"
                      spellcheck="false"
                      aria-label="Your EVM address"
                    />
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-medium text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                        (click)="useConnectedWalletAsEvmTo()"
                        [disabled]="!wallet.isConnected()"
                        aria-label="Use connected wallet address"
                      >
                        Use connected wallet
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-medium text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                        (click)="addTokenToWallet()"
                        [disabled]="!wallet.isConnected() || !config()"
                        aria-label="Add wCCX token to wallet"
                      >
                        Add wCCX token
                      </button>
                    </div>
                  </div>

                  <div class="grid gap-2 sm:grid-cols-2">
                    <div class="grid gap-2">
                      <label class="text-sm font-medium text-[var(--cb-color-text)]" for="amount1"
                        >Amount</label
                      >
                      <input
                        id="amount1"
                        class="w-full rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-bg)] px-3 py-2 text-[var(--cb-color-text)] outline-none focus:border-[var(--cb-color-accent)] focus:ring-2 focus:ring-[var(--cb-color-accent)]/30"
                        formControlName="amount"
                        placeholder="0.0"
                        inputmode="decimal"
                        aria-label="Amount"
                      />
                      @if (config(); as cfg) {
                        <p class="text-xs text-[var(--cb-color-muted)]">
                          Min {{ cfg.common.minSwapAmount }} · Max {{ cfg.common.maxSwapAmount }}
                        </p>
                      }
                      @if (wccxSwapBalance() !== null) {
                        <p class="text-xs text-[var(--cb-color-muted)]">
                          Available wCCX liquidity: {{ wccxSwapBalance() }}
                        </p>
                      }
                    </div>

                    <div class="grid gap-2">
                      <label class="text-sm font-medium text-[var(--cb-color-text)]" for="email1"
                        >Email (optional)</label
                      >
                      <input
                        id="email1"
                        class="w-full rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-bg)] px-3 py-2 text-[var(--cb-color-text)] outline-none focus:border-[var(--cb-color-accent)] focus:ring-2 focus:ring-[var(--cb-color-accent)]/30"
                        formControlName="email"
                        placeholder="you@example.com"
                        autocomplete="email"
                        aria-label="Email (optional)"
                      />
                      <p class="text-xs text-[var(--cb-color-muted)]">
                        Used only for notifications/support.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="mt-2 inline-flex items-center justify-center rounded-lg bg-[var(--cb-color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--cb-color-accent)]/80 disabled:opacity-50"
                    (click)="startCcxToEvm()"
                    [disabled]="isBusy()"
                    aria-label="Start swap"
                  >
                    Start swap
                  </button>
                </div>
              </div>
            } @else if (step() === 1) {
              <div
                class="mt-6 rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-5"
              >
                <h2 class="text-base font-semibold text-[var(--cb-color-text)]">
                  Step 2 — Send CCX with payment ID
                </h2>
                <p class="mt-1 text-sm text-[var(--cb-color-text-secondary)]">
                  Send your CCX to the bridge address and include the payment ID shown below. We’ll
                  keep checking until it’s received.
                </p>

                <div class="mt-6 grid gap-6 sm:grid-cols-2">
                  <div class="grid gap-3">
                    <div class="text-sm font-medium text-[var(--cb-color-text)]">
                      CCX deposit address
                    </div>
                    @if (config(); as cfg) {
                      <div
                        class="rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-3 font-mono text-xs text-[var(--cb-color-text)]"
                      >
                        {{ cfg.ccx.accountAddress }}
                      </div>
                      <button
                        type="button"
                        class="rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-medium text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                        (click)="copy(cfg.ccx.accountAddress, 'ccx-deposit')"
                        [attr.aria-label]="
                          copiedItem() === 'ccx-deposit'
                            ? 'Address copied'
                            : 'Copy CCX deposit address'
                        "
                      >
                        {{ copiedItem() === 'ccx-deposit' ? 'Copied!' : 'Copy address' }}
                      </button>
                      <app-qr-code [data]="cfg.ccx.accountAddress" alt="CCX deposit address QR" />
                    } @else {
                      <div class="text-sm text-[var(--cb-color-muted)]">Loading…</div>
                    }
                  </div>

                  <div class="grid gap-3">
                    <div class="text-sm font-medium text-[var(--cb-color-text)]">Payment ID</div>
                    <div
                      class="rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-3 font-mono text-xs text-[var(--cb-color-text)]"
                    >
                      {{ paymentId() }}
                    </div>
                    <button
                      type="button"
                      class="rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-medium text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                      (click)="copy(paymentId(), 'payment-id')"
                      [disabled]="!paymentId()"
                      [attr.aria-label]="
                        copiedItem() === 'payment-id' ? 'Payment ID copied' : 'Copy payment ID'
                      "
                    >
                      {{ copiedItem() === 'payment-id' ? 'Copied!' : 'Copy payment ID' }}
                    </button>
                    <app-qr-code [data]="paymentId()" alt="Payment ID QR" />
                  </div>
                </div>

                <div class="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-medium text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                    (click)="reset()"
                    [disabled]="isBusy()"
                    aria-label="Start over"
                  >
                    Start over
                  </button>
                </div>
              </div>
            } @else {
              <div
                class="mt-6 rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-5"
              >
                <h2 class="text-base font-semibold text-[var(--cb-color-text)]">Complete</h2>
                <p class="mt-1 text-sm text-[var(--cb-color-muted)]">
                  Your swap has been processed.
                </p>
                @if (swapState(); as s) {
                  <div class="mt-5 grid gap-3 text-sm text-[var(--cb-color-text)]">
                    <div>
                      Swapped: <span class="font-semibold">{{ s.txdata?.swaped }}</span>
                    </div>
                    <div>
                      Recipient:
                      <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                        s.txdata?.address
                      }}</span>
                    </div>
                    <div>
                      Swap TX:
                      <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                        s.txdata?.swapHash
                      }}</span>
                    </div>
                    <div>
                      Deposit TX:
                      <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                        s.txdata?.depositHash
                      }}</span>
                    </div>
                  </div>
                }
                <div class="mt-6">
                  <button
                    type="button"
                    class="rounded-lg bg-[var(--cb-color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--cb-color-accent)]/80"
                    (click)="reset()"
                    aria-label="Start a new swap"
                  >
                    New swap
                  </button>
                </div>
              </div>
            }
          </ng-container>
        } @else {
          <ng-container [formGroup]="evmToCcxForm">
            @if (step() === 0) {
              <div
                class="mt-6 rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-5"
              >
                <h2 class="text-base font-semibold text-[var(--cb-color-text)]">
                  Step 1 — Send wCCX
                </h2>
                <p class="mt-1 text-sm text-[var(--cb-color-muted)]">
                  You’ll send wCCX from your connected wallet to the bridge address.
                </p>

                <div class="mt-5 grid gap-4">
                  <div class="grid gap-2">
                    <label class="text-sm font-medium text-[var(--cb-color-text)]" for="ccxTo"
                      >Your CCX address</label
                    >
                    <input
                      id="ccxTo"
                      class="w-full rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 font-mono text-sm text-[var(--cb-color-text)] outline-none focus:border-[var(--cb-color-accent)] focus:ring-2 focus:ring-[var(--cb-color-accent)]/30"
                      formControlName="ccxToAddress"
                      placeholder="ccx…"
                      autocomplete="off"
                      spellcheck="false"
                      aria-label="Your CCX address"
                    />
                  </div>

                  <div class="grid gap-2 sm:grid-cols-2">
                    <div class="grid gap-2">
                      <label class="text-sm font-medium text-[var(--cb-color-text)]" for="amount2"
                        >Amount</label
                      >
                      <input
                        id="amount2"
                        class="w-full rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-bg)] px-3 py-2 text-[var(--cb-color-text)] outline-none focus:border-[var(--cb-color-accent)] focus:ring-2 focus:ring-[var(--cb-color-accent)]/30"
                        formControlName="amount"
                        placeholder="0.0"
                        inputmode="decimal"
                        aria-label="Amount"
                      />
                      @if (config(); as cfg) {
                        <p class="text-xs text-[var(--cb-color-muted)]">
                          Min {{ cfg.common.minSwapAmount }} · Max {{ cfg.common.maxSwapAmount }}
                        </p>
                      }
                      @if (ccxSwapBalance() !== null) {
                        <p class="text-xs text-[var(--cb-color-muted)]">
                          Available CCX liquidity: {{ ccxSwapBalance() }}
                        </p>
                      }
                    </div>

                    <div class="grid gap-2">
                      <label class="text-sm font-medium text-[var(--cb-color-text)]" for="email2"
                        >Email (optional)</label
                      >
                      <input
                        id="email2"
                        class="w-full rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-bg)] px-3 py-2 text-[var(--cb-color-text)] outline-none focus:border-[var(--cb-color-accent)] focus:ring-2 focus:ring-[var(--cb-color-accent)]/30"
                        formControlName="email"
                        placeholder="you@example.com"
                        autocomplete="email"
                        aria-label="Email (optional)"
                      />
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-medium text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                      (click)="addTokenToWallet()"
                      [disabled]="!wallet.isConnected() || !config()"
                      aria-label="Add wCCX token to wallet"
                    >
                      Add wCCX token
                    </button>
                  </div>

                  <button
                    type="button"
                    class="mt-2 inline-flex items-center justify-center rounded-lg bg-[var(--cb-color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--cb-color-accent)]/80 disabled:opacity-50"
                    (click)="startEvmToCcx()"
                    [disabled]="isBusy()"
                    aria-label="Start swap"
                  >
                    Start swap
                  </button>
                </div>
              </div>
            } @else if (step() === 1) {
              <div
                class="mt-6 rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-5"
              >
                <h2 class="text-base font-semibold text-[var(--cb-color-text)]">Processing</h2>
                <p class="mt-1 text-sm text-[var(--cb-color-muted)]">
                  Deposit accepted. We’re processing your swap.
                </p>
                <div class="mt-4 grid gap-3 text-sm text-[var(--cb-color-text)]">
                  <div>
                    Payment ID:
                    <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                      paymentId()
                    }}</span>
                  </div>
                  <div>
                    EVM TX:
                    <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                      evmTxHash()
                    }}</span>
                  </div>
                </div>

                <div class="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-medium text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                    (click)="reset()"
                    [disabled]="isBusy()"
                    aria-label="Start over"
                  >
                    Start over
                  </button>
                </div>
              </div>
            } @else {
              <div
                class="mt-6 rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-5"
              >
                <h2 class="text-base font-semibold text-[var(--cb-color-text)]">Complete</h2>
                <p class="mt-1 text-sm text-[var(--cb-color-muted)]">
                  Your swap has been processed.
                </p>
                @if (swapState(); as s) {
                  <div class="mt-5 grid gap-3 text-sm text-[var(--cb-color-text)]">
                    <div>
                      Swapped: <span class="font-semibold">{{ s.txdata?.swaped }}</span>
                    </div>
                    <div>
                      Recipient:
                      <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                        s.txdata?.address
                      }}</span>
                    </div>
                    <div>
                      Swap TX:
                      <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                        s.txdata?.swapHash
                      }}</span>
                    </div>
                    <div>
                      Deposit TX:
                      <span class="font-mono text-xs text-[var(--cb-color-muted)]">{{
                        s.txdata?.depositHash
                      }}</span>
                    </div>
                  </div>
                }
                <div class="mt-6">
                  <button
                    type="button"
                    class="rounded-lg bg-[var(--cb-color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--cb-color-accent)]/80"
                    (click)="reset()"
                    aria-label="Start a new swap"
                  >
                    New swap
                  </button>
                </div>
              </div>
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
  readonly copiedItem = signal<string | null>(null);
  readonly evmTxHash = signal<Hash | ''>('');
  readonly swapState = signal<BridgeSwapStateResponse | null>(null);

  readonly pageError = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);

  // Track polling subscription to cancel previous ones when starting new polling
  readonly #pollingCancel$ = new Subject<void>();

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
            catchError((e: unknown) => {
              const msg = e instanceof Error ? e.message : 'Failed to load bridge configuration.';
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
            catchError(() => of({ result: false, balance: 0 })),
            map((r) => (r.result ? r.balance : null)),
          ),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((balance) => this.ccxSwapBalance.set(balance));

    network$
      .pipe(
        switchMap((network) =>
          this.api.getWccxSwapBalance(network).pipe(
            catchError(() => of({ result: false, balance: 0 })),
            map((r) => (r.result ? r.balance : null)),
          ),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((balance) => this.wccxSwapBalance.set(balance));

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

    timer(0, 10_000)
      .pipe(
        switchMap(() =>
          this.api
            .checkSwapState(network, direction, paymentId)
            .pipe(catchError(() => of({ result: false } as BridgeSwapStateResponse))),
        ),
        filter((r) => r.result === true),
        take(1),
        takeUntil(this.#pollingCancel$),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((state) => {
        this.swapState.set(state);
        this.step.set(2);
        this.statusMessage.set('Payment received!');

        // Add to history
        if (state.txdata) {
          this.historyService.addTransaction({
            id: paymentId,
            timestamp: Date.now(),
            amount: state.txdata.swaped,
            direction: direction === 'wccx' ? 'ccx-to-evm' : 'evm-to-ccx',
            network,
            status: 'completed',
            depositHash: state.txdata.depositHash,
            swapHash: state.txdata.swapHash,
            recipientAddress: state.txdata.address,
          });
        }
      });
  }

  async copy(text: string, id?: string): Promise<void> {
    const value = text.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      if (id) {
        this.copiedItem.set(id);
        setTimeout(() => {
          if (this.copiedItem() === id) this.copiedItem.set(null);
        }, 1500);
      } else {
        this.statusMessage.set('Copied to clipboard.');
        await new Promise((r) => setTimeout(r, 1200));
        // Only clear if it wasn't replaced by another message.
        if (this.statusMessage() === 'Copied to clipboard.') this.statusMessage.set(null);
      }
    } catch {
      this.statusMessage.set('Copy failed (clipboard unavailable).');
    }
  }
}

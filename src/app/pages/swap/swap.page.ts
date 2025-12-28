import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, filter, map, of, switchMap } from 'rxjs';

import { ZardAlertComponent } from '@/shared/components/alert/alert.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { BridgeApiService } from '../../core/bridge-api.service';
import type { BridgeChainConfig, EvmNetworkKey, SwapDirection } from '../../core/bridge-types';
import { EVM_NETWORK_KEYS } from '../../core/bridge-types';
import { EVM_NETWORKS } from '../../core/evm-networks';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { WalletButtonComponent } from '../../shared/wallet/wallet-button.component';
import { SwapExecutionService } from './swap-execution.service';
import { SwapFormService } from './swap-form.service';
import { SwapStateService } from './swap-state.service';
import {
  Step0CcxToEvmComponent,
  Step0EvmToCcxComponent,
  Step1CcxToEvmComponent,
  Step1EvmToCcxComponent,
  Step2CompleteComponent,
} from './steps';
import { inferDecimalsFromUnits, type SwapContext } from './swap-types';

function isEvmNetworkKey(value: string | null): value is EvmNetworkKey {
  return !!value && (EVM_NETWORK_KEYS as readonly string[]).includes(value);
}

function isSwapDirection(value: string | null): value is SwapDirection {
  return value === 'ccx-to-evm' || value === 'evm-to-ccx';
}

@Component({
  selector: 'app-swap-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SwapFormService, SwapStateService, SwapExecutionService],
  imports: [
    RouterLink,
    WalletButtonComponent,
    ZardAlertComponent,
    ZardButtonComponent,
    ZardIconComponent,
    Step0CcxToEvmComponent,
    Step0EvmToCcxComponent,
    Step1CcxToEvmComponent,
    Step1EvmToCcxComponent,
    Step2CompleteComponent,
  ],
  template: `
    <div class="mx-auto max-w-3xl">
      <!-- Screen reader live region for loading announcements -->
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {{ stateService.loadingAnnouncement() }}
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

      @if (stateService.pageError(); as err) {
        <z-alert class="mt-6" zType="destructive" [zTitle]="err" />
      }

      @if (stateService.statusMessage(); as msg) {
        <z-alert class="mt-6" [zTitle]="msg" />
      }

      @if (stateService.balanceFetchError(); as err) {
        <z-alert class="mt-6" zType="destructive" [zTitle]="err" zIcon="triangle-alert" />
      }

      @if (stateService.pollingError(); as err) {
        <z-alert class="mt-6" zType="destructive" [zTitle]="err" zIcon="triangle-alert" />
      }

      @if (swapContext(); as ctx) {
        <div class="mt-6">
          @if (ctx.direction === 'ccx-to-evm') {
            @switch (stateService.step()) {
              @case (0) {
                <app-step0-ccx-to-evm
                  [ctx]="ctx"
                  [wccxLiquidity]="wccxSwapBalance()"
                  [isBusy]="stateService.isBusy()"
                  (startSwap)="startCcxToEvm()"
                  (addToken)="addTokenToWallet()"
                />
              }
              @case (1) {
                <app-step1-ccx-to-evm
                  [ctx]="ctx"
                  [paymentId]="stateService.paymentId()"
                  [isBusy]="stateService.isBusy()"
                  (copyAddress)="copy($event)"
                  (copyPaymentId)="copy($event)"
                  (resetSwap)="reset()"
                />
              }
              @case (2) {
                <app-step2-complete [swapState]="stateService.swapState()" (resetSwap)="reset()" />
              }
            }
          } @else {
            @switch (stateService.step()) {
              @case (0) {
                <app-step0-evm-to-ccx
                  [ctx]="ctx"
                  [ccxLiquidity]="ccxSwapBalance()"
                  [isBusy]="stateService.isBusy()"
                  (startSwap)="startEvmToCcx()"
                  (addToken)="addTokenToWallet()"
                />
              }
              @case (1) {
                <app-step1-evm-to-ccx
                  [paymentId]="stateService.paymentId()"
                  [evmTxHash]="stateService.evmTxHash()"
                  [isBusy]="stateService.isBusy()"
                  (resetSwap)="reset()"
                />
              }
              @case (2) {
                <app-step2-complete [swapState]="stateService.swapState()" (resetSwap)="reset()" />
              }
            }
          }
        </div>
      }
    </div>
  `,
})
export class SwapPage {
  readonly #destroyRef = inject(DestroyRef);
  readonly #route = inject(ActivatedRoute);

  readonly api = inject(BridgeApiService);
  readonly wallet = inject(EvmWalletService);
  readonly formService = inject(SwapFormService);
  readonly stateService = inject(SwapStateService);
  readonly #executionService = inject(SwapExecutionService);

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

  readonly swapContext = computed<SwapContext | null>(() => {
    const dir = this.direction();
    const key = this.networkKey();
    const info = this.networkInfo();
    const cfg = this.config();

    if (!dir || !key || !info || !cfg) return null;

    return { direction: dir, networkKey: key, networkInfo: info, config: cfg };
  });

  // Expose forms for test compatibility
  get ccxToEvmForm() {
    return this.formService.ccxToEvmForm;
  }

  get evmToCcxForm() {
    return this.formService.evmToCcxForm;
  }

  constructor() {
    void this.wallet.hydrate();

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
              this.stateService.setPageError(msg);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((cfg) => {
        if (!cfg) return;
        this.stateService.setPageError(null);
        this.config.set(cfg);
        this.stateService.setStatusMessage(null);
        this.reset();
      });

    network$
      .pipe(
        switchMap((network) =>
          this.api.getCcxSwapBalance(network).pipe(
            catchError(() => {
              this.stateService.setBalanceFetchError(
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
        if (balance !== null) this.stateService.setBalanceFetchError(null);
        this.ccxSwapBalance.set(balance);
      });

    network$
      .pipe(
        switchMap((network) =>
          this.api.getWccxSwapBalance(network).pipe(
            catchError(() => {
              this.stateService.setBalanceFetchError(
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
        if (balance !== null) this.stateService.setBalanceFetchError(null);
        this.wccxSwapBalance.set(balance);
      });

    const dir = this.direction();
    if (!dir) {
      this.stateService.setPageError('Unknown swap direction.');
    }
  }

  async addTokenToWallet(): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;

    const decimals = inferDecimalsFromUnits(cfg.wccx.units) ?? 6;
    try {
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
      this.stateService.setStatusMessage('Token request sent to wallet.');
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      const msg = e instanceof Error ? e.message : 'Failed to add token.';

      if (code === 4001) {
        this.stateService.setStatusMessage('Token request was cancelled in your wallet.');
        return;
      }

      if (code === -32603 || /not supported/i.test(msg)) {
        this.stateService.setStatusMessage(
          `Your wallet doesn't support adding tokens automatically on this network. Add wCCX manually:\n` +
            `Contract: ${cfg.wccx.contractAddress}\n` +
            `Symbol: wCCX\n` +
            `Decimals: ${decimals}`,
        );
        return;
      }

      this.stateService.setStatusMessage(msg);
    }
  }

  reset(): void {
    this.stateService.reset();
  }

  startCcxToEvm(): void {
    if (this.direction() !== 'ccx-to-evm') return;

    const network = this.networkKey();
    const cfg = this.config();
    const info = this.networkInfo();
    if (!network || !cfg || !info) {
      this.stateService.setStatusMessage('Missing network configuration.');
      return;
    }

    void this.#executionService.executeCcxToEvm(
      { network, config: cfg, networkInfo: info },
      this.wccxSwapBalance(),
    );
  }

  startEvmToCcx(): void {
    if (this.direction() !== 'evm-to-ccx') return;

    const network = this.networkKey();
    const cfg = this.config();
    const info = this.networkInfo();
    if (!network || !cfg || !info) {
      this.stateService.setStatusMessage('Missing network configuration.');
      return;
    }

    void this.#executionService.executeEvmToCcx(
      { network, config: cfg, networkInfo: info },
      this.ccxSwapBalance(),
    );
  }

  async copy(text: string): Promise<void> {
    const value = text.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      this.stateService.setStatusMessage('Copied to clipboard.');
      await new Promise((r) => setTimeout(r, 1200));
      if (this.stateService.statusMessage() === 'Copied to clipboard.') {
        this.stateService.setStatusMessage(null);
      }
    } catch {
      this.stateService.setStatusMessage('Copy failed (clipboard unavailable).');
    }
  }
}

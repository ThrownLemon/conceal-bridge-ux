import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, filter, of, switchMap, take, takeUntil, timer } from 'rxjs';
import type { Hash } from 'viem';

import { BridgeApiService } from '../../core/bridge-api.service';
import type {
  BridgeSwapStateResponse,
  EvmNetworkKey,
  SwapDirection,
} from '../../core/bridge-types';
import { TransactionHistoryService } from '../../core/transaction-history.service';

export type SwapStep = 0 | 1 | 2;

@Injectable()
export class SwapStateService {
  readonly #destroyRef = inject(DestroyRef);
  readonly #api = inject(BridgeApiService);
  readonly #historyService = inject(TransactionHistoryService);

  readonly step = signal<SwapStep>(0);
  readonly isBusy = signal(false);

  readonly paymentId = signal('');
  readonly evmTxHash = signal<Hash | ''>('');
  readonly swapState = signal<BridgeSwapStateResponse | null>(null);

  readonly pageError = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly balanceFetchError = signal<string | null>(null);
  readonly pollingError = signal<string | null>(null);

  readonly #pollingCancel$ = new Subject<void>();
  #pollingErrorCount = 0;

  readonly loadingAnnouncement = computed(() => {
    const step = this.step();
    const busy = this.isBusy();

    if (busy) {
      return 'Processing, please wait.';
    }

    if (step === 1) {
      return 'Checking for confirmation, please wait.';
    }

    return '';
  });

  setStep(step: SwapStep): void {
    this.step.set(step);
  }

  setBusy(busy: boolean): void {
    this.isBusy.set(busy);
  }

  setPaymentId(id: string): void {
    this.paymentId.set(id);
  }

  setEvmTxHash(hash: Hash | ''): void {
    this.evmTxHash.set(hash);
  }

  setStatusMessage(msg: string | null): void {
    this.statusMessage.set(msg);
  }

  setPageError(err: string | null): void {
    this.pageError.set(err);
  }

  setBalanceFetchError(err: string | null): void {
    this.balanceFetchError.set(err);
  }

  reset(): void {
    this.#pollingCancel$.next();
    this.step.set(0);
    this.isBusy.set(false);
    this.paymentId.set('');
    this.evmTxHash.set('');
    this.swapState.set(null);
    this.statusMessage.set(null);
  }

  startPolling(network: EvmNetworkKey, direction: 'wccx' | 'ccx', paymentId: string): void {
    this.#pollingCancel$.next();
    this.#pollingErrorCount = 0;
    this.pollingError.set(null);

    timer(0, 10_000)
      .pipe(
        switchMap(() =>
          this.#api.checkSwapState(network, direction, paymentId).pipe(
            catchError(() => {
              this.#pollingErrorCount++;
              if (this.#pollingErrorCount >= 3) {
                this.pollingError.set(
                  `Unable to check swap status. Your transaction may still be processing. ` +
                    `Save your payment ID for support: ${paymentId}`,
                );
              }
              return of({ result: false } as BridgeSwapStateResponse);
            }),
          ),
        ),
        filter((r) => {
          if (r.result === true) {
            this.#pollingErrorCount = 0;
            this.pollingError.set(null);
            return true;
          }
          return false;
        }),
        take(1),
        takeUntil(this.#pollingCancel$),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((state) => {
        this.swapState.set(state);
        this.step.set(2);
        this.statusMessage.set('Payment received!');

        if (state.txdata) {
          const swapDirection: SwapDirection = direction === 'wccx' ? 'ccx-to-evm' : 'evm-to-ccx';
          this.#historyService.addTransaction({
            id: paymentId,
            timestamp: Date.now(),
            amount: state.txdata.swaped,
            direction: swapDirection,
            network,
            status: 'completed',
            depositHash: state.txdata.depositHash,
            swapHash: state.txdata.swapHash,
            recipientAddress: state.txdata.address,
          });
        }
      });
  }

  cancelPolling(): void {
    this.#pollingCancel$.next();
  }
}

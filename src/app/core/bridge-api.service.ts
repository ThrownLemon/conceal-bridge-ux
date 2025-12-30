import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';

import { APP_CONFIG } from './app-config';
import type {
  BridgeBalanceResponse,
  BridgeChainConfig,
  BridgeInitSwapResponse,
  BridgeSwapStateResponse,
  EvmNetworkKey,
} from './bridge-types';

/**
 * Service for communicating with the Conceal Bridge backend API.
 *
 * Provides methods for bridge operations including swap initiation,
 * status checking, balance queries, and gas estimation across
 * supported EVM networks (Ethereum, BSC, Polygon).
 *
 * @example
 * ```typescript
 * const bridge = inject(BridgeApiService);
 *
 * // Get chain configuration
 * bridge.getChainConfig('bsc').subscribe(config => {
 *   console.log('wCCX contract:', config.wrappedCcxContract);
 * });
 *
 * // Initiate a CCX → wCCX swap
 * bridge.sendCcxToWccxInit('bsc', {
 *   amount: 1000,
 *   toAddress: '0x...',
 *   fromAddress: 'ccx...',
 *   txfeehash: '...'
 * }).subscribe(response => {
 *   console.log('Swap initiated:', response.paymentId);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class BridgeApiService {
  readonly #http = inject(HttpClient);
  readonly #config = inject(APP_CONFIG);

  readonly #jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  /** Cache for chain config responses to avoid redundant API requests. */
  readonly #configCache = new Map<EvmNetworkKey, Observable<BridgeChainConfig>>();

  /**
   * Constructs the full API URL for a given network and path.
   * @param network - The target EVM network ('eth', 'bsc', 'plg').
   * @param path - The API endpoint path.
   * @returns The complete URL string.
   */
  #url(network: EvmNetworkKey, path: string): string {
    const base = this.#config.apiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    return `${base}/${network}/${normalizedPath}`;
  }

  /**
   * Retrieves the chain configuration for a specific network.
   *
   * Returns cached data if available; otherwise fetches from the API.
   * Configuration includes contract addresses, token decimals, and network details.
   *
   * @param network - The target EVM network ('eth', 'bsc', 'plg').
   * @returns Observable emitting the chain configuration.
   *
   * @example
   * ```typescript
   * bridge.getChainConfig('bsc').subscribe(config => {
   *   console.log('Contract:', config.wrappedCcxContract);
   *   console.log('Decimals:', config.units);
   * });
   * ```
   */
  getChainConfig(network: EvmNetworkKey): Observable<BridgeChainConfig> {
    if (this.#configCache.has(network)) {
      return this.#configCache.get(network)!;
    }

    const request$ = this.#http.get<BridgeChainConfig>(this.#url(network, '/config/chain')).pipe(
      catchError((error) => {
        this.#configCache.delete(network);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.#configCache.set(network, request$);
    return request$;
  }

  /**
   * Estimates the gas price for a CCX → wCCX swap.
   *
   * @param network - The target EVM network ('eth', 'bsc', 'plg').
   * @param amount - The swap amount in CCX atomic units.
   * @returns Observable emitting the gas estimation result.
   *
   * @example
   * ```typescript
   * bridge.estimateGasPrice('eth', 1000000).subscribe(result => {
   *   console.log('Estimated gas:', result.gas);
   * });
   * ```
   */
  estimateGasPrice(network: EvmNetworkKey, amount: number) {
    return this.#http.post<{ result: boolean; gas: number }>(
      this.#url(network, '/api/ccx/wccx/estimateGas'),
      { amount },
      { headers: this.#jsonHeaders },
    );
  }

  /**
   * Gets the current gas price for the specified network.
   *
   * @param network - The target EVM network ('eth', 'bsc', 'plg').
   * @returns Observable emitting the current gas price.
   *
   * @example
   * ```typescript
   * bridge.getGasPrice('bsc').subscribe(result => {
   *   console.log('Gas price:', result.gas);
   * });
   * ```
   */
  getGasPrice(network: EvmNetworkKey) {
    return this.#http.get<{ result: boolean; gas: number }>(
      this.#url(network, '/api/ccx/wccx/getGasPrice'),
    );
  }

  /**
   * Gets the available CCX balance in the bridge pool for a network.
   *
   * This represents the maximum amount that can be swapped from wCCX to CCX.
   *
   * @param network - The target EVM network ('eth', 'bsc', 'plg').
   * @returns Observable emitting the CCX balance response.
   *
   * @example
   * ```typescript
   * bridge.getCcxSwapBalance('bsc').subscribe(response => {
   *   console.log('Available CCX:', response.balance);
   * });
   * ```
   */
  getCcxSwapBalance(network: EvmNetworkKey) {
    return this.#http.get<BridgeBalanceResponse>(this.#url(network, '/api/balance/ccx'));
  }

  /**
   * Gets the available wCCX balance in the bridge pool for a network.
   *
   * This represents the maximum amount that can be swapped from CCX to wCCX.
   *
   * @param network - The target EVM network ('eth', 'bsc', 'plg').
   * @returns Observable emitting the wCCX balance response.
   *
   * @example
   * ```typescript
   * bridge.getWccxSwapBalance('plg').subscribe(response => {
   *   console.log('Available wCCX:', response.balance);
   * });
   * ```
   */
  getWccxSwapBalance(network: EvmNetworkKey) {
    return this.#http.get<BridgeBalanceResponse>(this.#url(network, '/api/balance/wccx'));
  }

  /**
   * Initiates a CCX → wCCX swap.
   *
   * After calling this, the user should send CCX to the provided payment address,
   * then poll checkSwapState() until the swap is complete.
   *
   * @param network - The target EVM network where wCCX will be minted ('eth', 'bsc', 'plg').
   * @param body - The swap initialization parameters.
   * @param body.email - Optional email for notifications.
   * @param body.amount - The amount of CCX to swap (in atomic units).
   * @param body.toAddress - The EVM address to receive wCCX.
   * @param body.fromAddress - The CCX wallet address sending funds.
   * @param body.txfeehash - The transaction hash of the gas fee payment.
   * @returns Observable emitting the swap initialization response with paymentId.
   *
   * @example
   * ```typescript
   * bridge.sendCcxToWccxInit('bsc', {
   *   amount: 1000000,
   *   toAddress: '0xAbc...',
   *   fromAddress: 'ccxAddress...',
   *   txfeehash: '0x123...'
   * }).subscribe(response => {
   *   console.log('Payment ID:', response.paymentId);
   *   console.log('Send CCX to:', response.paymentAddress);
   * });
   * ```
   */
  sendCcxToWccxInit(
    network: EvmNetworkKey,
    body: {
      email?: string;
      amount: number;
      toAddress: string;
      fromAddress: string;
      txfeehash: string;
    },
  ) {
    return this.#http.post<BridgeInitSwapResponse>(
      this.#url(network, '/api/ccx/wccx/swap/init'),
      body,
      { headers: this.#jsonHeaders },
    );
  }

  /**
   * Initiates a wCCX → CCX swap.
   *
   * Called after the user has sent wCCX to the bridge contract.
   * The backend will verify the transaction and prepare the CCX payout.
   *
   * @param network - The EVM network where wCCX was burned ('eth', 'bsc', 'plg').
   * @param body - The swap initialization parameters.
   * @param body.fromAddress - The EVM address that sent wCCX.
   * @param body.toAddress - The CCX wallet address to receive funds.
   * @param body.txHash - The transaction hash of the wCCX transfer.
   * @param body.amount - The amount of wCCX swapped (in atomic units).
   * @param body.email - Optional email for notifications.
   * @returns Observable emitting the swap initialization response with paymentId.
   *
   * @example
   * ```typescript
   * bridge.sendWccxToCcxInit('bsc', {
   *   fromAddress: '0xAbc...',
   *   toAddress: 'ccxAddress...',
   *   txHash: '0x456...',
   *   amount: 1000000
   * }).subscribe(response => {
   *   console.log('Payment ID:', response.paymentId);
   * });
   * ```
   */
  sendWccxToCcxInit(
    network: EvmNetworkKey,
    body: {
      fromAddress: string;
      toAddress: string;
      txHash: string;
      amount: number;
      email?: string;
    },
  ) {
    return this.#http.post<BridgeInitSwapResponse>(
      this.#url(network, '/api/wccx/ccx/swap/init'),
      body,
      { headers: this.#jsonHeaders },
    );
  }

  /**
   * Executes a pending wCCX → CCX swap.
   *
   * Called to trigger the actual CCX payout after the wCCX transfer
   * has been verified by the backend.
   *
   * @param network - The EVM network of the original wCCX transfer ('eth', 'bsc', 'plg').
   * @param body - The execution parameters.
   * @param body.paymentId - The payment ID from sendWccxToCcxInit().
   * @param body.email - Optional email for notifications.
   * @returns Observable emitting the swap execution response.
   *
   * @example
   * ```typescript
   * bridge.execWccxToCcxSwap('bsc', {
   *   paymentId: 'abc123...'
   * }).subscribe(response => {
   *   console.log('Swap executed:', response.result);
   * });
   * ```
   */
  execWccxToCcxSwap(network: EvmNetworkKey, body: { paymentId: string; email?: string }) {
    return this.#http.post<BridgeInitSwapResponse>(
      this.#url(network, '/api/wccx/ccx/swap/exec'),
      body,
      { headers: this.#jsonHeaders },
    );
  }

  /**
   * Checks the current state of a swap transaction.
   *
   * Poll this method to track swap progress until completion.
   * The response includes status, confirmations, and transaction details.
   *
   * @param network - The EVM network of the swap ('eth', 'bsc', 'plg').
   * @param direction - The swap direction: 'wccx' for CCX→wCCX, 'ccx' for wCCX→CCX.
   * @param paymentId - The payment ID from the swap initialization.
   * @returns Observable emitting the current swap state.
   *
   * @example
   * ```typescript
   * // Poll every 10 seconds until complete
   * interval(10000).pipe(
   *   switchMap(() => bridge.checkSwapState('bsc', 'wccx', paymentId)),
   *   takeWhile(state => state.status !== 'completed', true)
   * ).subscribe(state => {
   *   console.log('Status:', state.status);
   *   console.log('Confirmations:', state.confirmations);
   * });
   * ```
   */
  checkSwapState(network: EvmNetworkKey, direction: 'wccx' | 'ccx', paymentId: string) {
    const path = direction === 'wccx' ? '/api/ccx/wccx/tx' : '/api/wccx/ccx/tx';
    return this.#http.post<BridgeSwapStateResponse>(
      this.#url(network, path),
      { paymentId },
      { headers: this.#jsonHeaders },
    );
  }
}

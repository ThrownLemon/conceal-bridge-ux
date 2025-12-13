import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { APP_CONFIG } from './app-config';
import type {
  BridgeBalanceResponse,
  BridgeChainConfig,
  BridgeInitSwapResponse,
  BridgeSwapStateResponse,
  EvmNetworkKey,
} from './bridge-types';

@Injectable({ providedIn: 'root' })
export class BridgeApiService {
  readonly #http = inject(HttpClient);
  readonly #config = inject(APP_CONFIG);

  readonly #jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  #url(network: EvmNetworkKey, path: string): string {
    const base = this.#config.apiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    return `${base}/${network}/${normalizedPath}`;
  }

  getChainConfig(network: EvmNetworkKey) {
    return this.#http.get<BridgeChainConfig>(this.#url(network, '/config/chain'));
  }

  estimateGasPrice(network: EvmNetworkKey, amount: number) {
    return this.#http.post<{ result: boolean; gas: number }>(
      this.#url(network, '/api/ccx/wccx/estimateGas'),
      { amount },
      { headers: this.#jsonHeaders },
    );
  }

  getGasPrice(network: EvmNetworkKey) {
    return this.#http.get<{ result: boolean; gas: number }>(this.#url(network, '/api/ccx/wccx/getGasPrice'));
  }

  getCcxSwapBalance(network: EvmNetworkKey) {
    return this.#http.get<BridgeBalanceResponse>(this.#url(network, '/api/balance/ccx'));
  }

  getWccxSwapBalance(network: EvmNetworkKey) {
    return this.#http.get<BridgeBalanceResponse>(this.#url(network, '/api/balance/wccx'));
  }

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

  execWccxToCcxSwap(network: EvmNetworkKey, body: { paymentId: string; email?: string }) {
    return this.#http.post<BridgeInitSwapResponse>(
      this.#url(network, '/api/wccx/ccx/swap/exec'),
      body,
      { headers: this.#jsonHeaders },
    );
  }

  checkSwapState(network: EvmNetworkKey, direction: 'wccx' | 'ccx', paymentId: string) {
    const path =
      direction === 'wccx' ? '/api/ccx/wccx/tx' : '/api/wccx/ccx/tx';
    return this.#http.post<BridgeSwapStateResponse>(
      this.#url(network, path),
      { paymentId },
      { headers: this.#jsonHeaders },
    );
  }
}



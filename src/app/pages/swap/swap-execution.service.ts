import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { isAddress, parseEther, parseUnits } from 'viem';

import { BridgeApiService } from '../../core/bridge-api.service';
import type { BridgeChainConfig, EvmNetworkKey } from '../../core/bridge-types';
import type { EvmNetworkInfo } from '../../core/evm-networks';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { SwapFormService } from './swap-form.service';
import { SwapStateService } from './swap-state.service';
import { CCX_ADDRESS_RE, erc20Abi, inferDecimalsFromUnits } from './swap-types';

export interface SwapExecutionContext {
  network: EvmNetworkKey;
  config: BridgeChainConfig;
  networkInfo: EvmNetworkInfo;
}

@Injectable()
export class SwapExecutionService {
  readonly #api = inject(BridgeApiService);
  readonly #wallet = inject(EvmWalletService);
  readonly #formService = inject(SwapFormService);
  readonly #stateService = inject(SwapStateService);

  async executeCcxToEvm(ctx: SwapExecutionContext, wccxLiquidity: number | null): Promise<void> {
    this.#stateService.setStatusMessage(null);
    this.#stateService.setPageError(null);

    if (!this.#formService.validateCcxToEvmForm()) {
      this.#stateService.setStatusMessage('Please fix the form errors.');
      return;
    }

    const { network, config: cfg, networkInfo: info } = ctx;
    const values = this.#formService.getCcxToEvmValues();
    const amount = Number.parseFloat(values.amount);

    if (!Number.isFinite(amount)) {
      this.#stateService.setStatusMessage('Invalid amount.');
      return;
    }

    if (amount < cfg.common.minSwapAmount || amount > cfg.common.maxSwapAmount) {
      this.#stateService.setStatusMessage(
        `Amount must be between ${cfg.common.minSwapAmount} and ${cfg.common.maxSwapAmount}.`,
      );
      return;
    }

    if (wccxLiquidity !== null && wccxLiquidity < amount) {
      this.#stateService.setStatusMessage(
        'Due to high demand, there are not enough funds to cover this transfer. Please check back later.',
      );
      return;
    }

    if (!CCX_ADDRESS_RE.test(values.ccxFromAddress)) {
      this.#stateService.setStatusMessage('Invalid CCX address.');
      return;
    }

    if (!isAddress(values.evmToAddress)) {
      this.#stateService.setStatusMessage('Invalid EVM address.');
      return;
    }

    this.#stateService.setBusy(true);
    this.#stateService.setStatusMessage('Connecting wallet…');

    try {
      await this.#wallet.connect();
      await this.#wallet.ensureChain(info.chain);

      this.#stateService.setStatusMessage('Estimating gas…');
      const [estimate, gasPrice] = await Promise.all([
        firstValueFrom(this.#api.estimateGasPrice(network, amount)),
        firstValueFrom(this.#api.getGasPrice(network)),
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

      this.#stateService.setStatusMessage('Sending gas fee transaction…');
      const hash = await this.#wallet.sendNativeTransaction({
        chain: info.chain,
        to: bridgeEvmAccount,
        value,
      });
      this.#stateService.setEvmTxHash(hash);

      this.#stateService.setStatusMessage('Waiting for confirmations…');
      await this.#wallet.waitForReceipt({
        chain: info.chain,
        hash,
        confirmations: cfg.wccx.confirmations,
      });

      this.#stateService.setStatusMessage('Initializing swap…');
      const init = await firstValueFrom(
        this.#api.sendCcxToWccxInit(network, {
          email: values.email,
          amount,
          toAddress: values.evmToAddress,
          fromAddress: values.ccxFromAddress,
          txfeehash: hash,
        }),
      );

      if (!init.success || !init.paymentId) {
        throw new Error(init.error || 'Swap initialization failed.');
      }

      this.#stateService.setPaymentId(init.paymentId);
      this.#stateService.setStep(1);
      this.#stateService.setBusy(false);
      this.#stateService.setStatusMessage('Waiting for CCX deposit…');

      this.#stateService.startPolling(network, 'wccx', init.paymentId);
    } catch (e: unknown) {
      this.#stateService.setBusy(false);
      this.#stateService.setStatusMessage(e instanceof Error ? e.message : 'Swap failed.');
    }
  }

  async executeEvmToCcx(ctx: SwapExecutionContext, ccxLiquidity: number | null): Promise<void> {
    this.#stateService.setStatusMessage(null);
    this.#stateService.setPageError(null);

    if (!this.#formService.validateEvmToCcxForm()) {
      this.#stateService.setStatusMessage('Please fix the form errors.');
      return;
    }

    const { network, config: cfg, networkInfo: info } = ctx;
    const values = this.#formService.getEvmToCcxValues();
    const amount = Number.parseFloat(values.amount);

    if (!Number.isFinite(amount)) {
      this.#stateService.setStatusMessage('Invalid amount.');
      return;
    }

    if (amount < cfg.common.minSwapAmount || amount > cfg.common.maxSwapAmount) {
      this.#stateService.setStatusMessage(
        `Amount must be between ${cfg.common.minSwapAmount} and ${cfg.common.maxSwapAmount}.`,
      );
      return;
    }

    if (ccxLiquidity !== null && ccxLiquidity < amount) {
      this.#stateService.setStatusMessage(
        'Due to high demand, there are not enough funds to cover this transfer. Please check back later.',
      );
      return;
    }

    if (!CCX_ADDRESS_RE.test(values.ccxToAddress)) {
      this.#stateService.setStatusMessage('Invalid CCX address.');
      return;
    }

    const decimals = inferDecimalsFromUnits(cfg.wccx.units) ?? 6;

    this.#stateService.setBusy(true);
    this.#stateService.setStatusMessage('Connecting wallet…');

    try {
      const account = await this.#wallet.connect();
      await this.#wallet.ensureChain(info.chain);

      const { publicClient, walletClient } = this.#wallet.getClients(info.chain);

      const transferAmount = parseUnits(amount.toString(), decimals);

      this.#stateService.setStatusMessage('Checking wCCX balance…');
      const tokenBalance = await publicClient.readContract({
        address: cfg.wccx.contractAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
      });

      if (tokenBalance < transferAmount) {
        throw new Error('Insufficient wCCX balance for this transfer.');
      }

      this.#stateService.setStatusMessage('Sending wCCX transfer…');
      const hash = await walletClient.writeContract({
        account,
        chain: info.chain,
        address: cfg.wccx.contractAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [cfg.wccx.accountAddress, transferAmount],
      });
      this.#stateService.setEvmTxHash(hash);

      this.#stateService.setStatusMessage('Waiting for confirmations…');
      await this.#wallet.waitForReceipt({
        chain: info.chain,
        hash,
        confirmations: cfg.wccx.confirmations,
      });

      this.#stateService.setStatusMessage('Initializing swap…');
      const init = await firstValueFrom(
        this.#api.sendWccxToCcxInit(network, {
          fromAddress: account,
          toAddress: values.ccxToAddress,
          txHash: hash,
          amount,
          email: values.email,
        }),
      );

      if (!init.success || !init.paymentId) {
        throw new Error(init.error || 'Swap initialization failed.');
      }

      this.#stateService.setPaymentId(init.paymentId);

      this.#stateService.setStatusMessage('Executing swap…');
      const exec = await firstValueFrom(
        this.#api.execWccxToCcxSwap(network, { paymentId: init.paymentId, email: values.email }),
      );
      if (!exec.success) {
        throw new Error(exec.error || 'Swap execution failed.');
      }

      this.#stateService.setStep(1);
      this.#stateService.setBusy(false);
      this.#stateService.setStatusMessage('Processing swap…');

      this.#stateService.startPolling(network, 'ccx', init.paymentId);
    } catch (e: unknown) {
      this.#stateService.setBusy(false);
      this.#stateService.setStatusMessage(e instanceof Error ? e.message : 'Swap failed.');
    }
  }
}

import type { Abi, Address } from 'viem';

export const EVM_NETWORK_KEYS = ['eth', 'bsc', 'plg'] as const;
export type EvmNetworkKey = (typeof EVM_NETWORK_KEYS)[number];

export type SwapDirection = 'ccx-to-evm' | 'evm-to-ccx';

export interface BridgeChainConfig {
  common: {
    maxSwapAmount: number;
    minSwapAmount: number;
  };
  /** "wCCX-side" config (EVM chain) */
  wccx: {
    accountAddress: Address;
    chainId: number;
    confirmations: number;
    contractAddress: Address;
    contractAbi?: Abi;
    provider?: string;
    /** Multiplier used by the legacy app as a "units" scalar (e.g. 1_000_000 for 6 decimals). */
    units: number;
  };
  /** "CCX-side" config (Conceal chain) */
  ccx: {
    accountAddress: string;
    units: number;
  };
  tx: {
    gasMultiplier: number;
  };
}

export interface BridgeBalanceResponse {
  result: boolean;
  balance: number;
}

export interface BridgeInitSwapResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export interface BridgeSwapStateResponse {
  result: boolean;
  txdata?: {
    swaped: number;
    address: string;
    swapHash: string;
    depositHash: string;
  };
}

export interface StoredTransaction {
  id: string; // paymentId
  timestamp: number;
  amount: number;
  direction: SwapDirection;
  network: EvmNetworkKey;
  status: 'pending' | 'completed';
  depositHash?: string;
  swapHash?: string;
  recipientAddress?: string;
}

/**
 * Fee breakdown for displaying transaction cost summary to users.
 * All amounts are in their smallest units (wei for gas, atomic units for tokens).
 */
export interface FeeBreakdown {
  /** Amount user is sending (in atomic units) */
  inputAmount: bigint;
  /** Gas fee in native token's smallest unit (wei) */
  gasFee: bigint;
  /** Bridge fee deducted from transfer (in atomic units), 0n if none */
  bridgeFee: bigint;
  /** Amount user will receive after fees (in atomic units) */
  outputAmount: bigint;
  /** Decimals for input amount display */
  inputDecimals: number;
  /** Decimals for output amount display */
  outputDecimals: number;
  /** Native token symbol (ETH, BNB, MATIC) for gas fee display */
  nativeSymbol: string;
}

import type { Abi, Address } from 'viem';

export const EVM_NETWORK_KEYS = ['eth', 'bsc', 'plg'] as const;

/**
 * Network identifier for supported EVM-compatible chains in the Conceal Bridge.
 *
 * The bridge supports swapping ₡CCX (Conceal Network) to/from $wCCX (Wrapped CCX)
 * on three EVM chains. Each key maps to a specific chain configuration in the
 * {@link EVM_NETWORKS} registry (see evm-networks.ts).
 *
 * **Supported Networks:**
 * - `'eth'` - Ethereum (Mainnet or Sepolia Testnet depending on environment)
 * - `'bsc'` - BNB Smart Chain (Mainnet or Testnet depending on environment)
 * - `'plg'` - Polygon (Mainnet or Amoy Testnet depending on environment)
 *
 * @see {@link EVM_NETWORK_KEYS} for the canonical array of valid keys
 * @see {@link EVM_NETWORKS} in evm-networks.ts for full chain configurations
 *
 * @example
 * ```typescript
 * const network: EvmNetworkKey = 'eth';
 * const config = getChainConfig(network);
 * ```
 */
export type EvmNetworkKey = (typeof EVM_NETWORK_KEYS)[number];

/**
 * Direction of a bridge swap operation between Conceal Network and EVM chains.
 *
 * The Conceal Bridge facilitates bidirectional swaps between the native ₡CCX token
 * (on Conceal Network) and its wrapped equivalent $wCCX (on EVM-compatible chains).
 * This type specifies the direction of value transfer.
 *
 * **Supported Directions:**
 * - `'ccx-to-evm'` - Swap from ₡CCX (Conceal Network) to $wCCX (EVM chain)
 *   - User sends CCX to a Conceal address
 *   - Backend mints/transfers equivalent wCCX on selected EVM chain
 * - `'evm-to-ccx'` - Swap from $wCCX (EVM chain) to ₡CCX (Conceal Network)
 *   - User locks wCCX in smart contract on EVM chain
 *   - Backend releases equivalent CCX to Conceal address
 *
 * @see {@link StoredTransaction} interface which uses this type to track swap history
 * @see {@link BridgeInitSwapResponse} returned when initiating a swap
 * @see {@link BridgeSwapStateResponse} for monitoring swap progress
 *
 * @example
 * ```typescript
 * // Set up a CCX to wCCX swap
 * const direction: SwapDirection = 'ccx-to-evm';
 *
 * // Check direction in routing
 * if (direction === 'ccx-to-evm') {
 *   // Handle CCX -> wCCX flow
 * } else {
 *   // Handle wCCX -> CCX flow
 * }
 * ```
 */
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

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

/**
 * Chain configuration for a specific EVM network in the Conceal Bridge.
 *
 * This configuration is returned by the backend's `GET /config/chain` endpoint
 * and contains all necessary parameters for bridge operations between Conceal Network
 * and a specific EVM chain (Ethereum, BSC, or Polygon). It includes swap limits,
 * contract addresses, confirmation requirements, and token decimal configurations.
 *
 * The frontend caches this configuration via {@link BridgeApiService.getChainConfig}
 * to avoid redundant API requests.
 *
 * **Configuration Sections:**
 * - `common` - Global swap limits (min/max amounts)
 * - `wccx` - EVM chain configuration (contract address, decimals, confirmations)
 * - `ccx` - Conceal Network configuration (bridge wallet address, decimals)
 * - `tx` - Transaction settings (gas multiplier for fee estimation)
 *
 * @see {@link BridgeApiService.getChainConfig} for retrieving this configuration
 * @see {@link EvmNetworkKey} for supported network identifiers
 * @see backend_api.md section 5.4 for endpoint details
 *
 * @example
 * ```typescript
 * const bridge = inject(BridgeApiService);
 *
 * // Fetch configuration for BSC
 * bridge.getChainConfig('bsc').subscribe(config => {
 *   // Access swap limits
 *   console.log('Min swap:', config.common.minSwapAmount);
 *   console.log('Max swap:', config.common.maxSwapAmount);
 *
 *   // Access wCCX contract details
 *   console.log('Contract:', config.wccx.contractAddress);
 *   console.log('Chain ID:', config.wccx.chainId); // 56 for BSC mainnet
 *   console.log('Confirmations:', config.wccx.confirmations);
 *
 *   // Use units for token amount conversion
 *   const amount = parseUnits('100', Math.log10(config.wccx.units));
 *
 *   // Access Conceal bridge wallet
 *   console.log('CCX bridge wallet:', config.ccx.accountAddress);
 * });
 * ```
 */
export interface BridgeChainConfig {
  /**
   * Common swap configuration shared across both directions.
   */
  common: {
    /**
     * Maximum amount (in base units) allowed for a single swap operation.
     *
     * Attempts to swap more than this amount will be rejected by the backend.
     * This limit applies to both CCX → wCCX and wCCX → CCX swaps.
     */
    maxSwapAmount: number;

    /**
     * Minimum amount (in base units) required for a swap operation.
     *
     * Swaps below this threshold will be rejected by the backend to ensure
     * economic viability (gas costs, processing overhead).
     */
    minSwapAmount: number;
  };

  /**
   * EVM chain configuration for the wCCX (Wrapped CCX) token.
   *
   * Contains all parameters needed to interact with the wCCX ERC-20 contract
   * on the target EVM chain (Ethereum, BSC, or Polygon).
   */
  wccx: {
    /**
     * Bridge wallet address on the EVM chain.
     *
     * This is the backend-controlled address that:
     * - Receives wCCX deposits for unwrap (wCCX → CCX) operations
     * - Sends wCCX to users for wrap (CCX → wCCX) operations
     */
    accountAddress: Address;

    /**
     * EVM chain ID for the target network.
     *
     * **Common values:**
     * - `1` - Ethereum Mainnet
     * - `11155111` - Sepolia Testnet
     * - `56` - BNB Smart Chain Mainnet
     * - `97` - BNB Smart Chain Testnet
     * - `137` - Polygon Mainnet
     * - `80002` - Polygon Amoy Testnet
     *
     * This value is used to ensure users are connected to the correct network
     * before initiating transactions.
     */
    chainId: number;

    /**
     * Number of block confirmations required before processing a deposit.
     *
     * Higher values provide stronger finality guarantees but increase wait time.
     * The backend waits for this many confirmations before:
     * - Minting/transferring wCCX for CCX deposits (wrap flow)
     * - Releasing CCX for wCCX deposits (unwrap flow)
     *
     * **Typical values:**
     * - Ethereum: 12-20 confirmations (~2.5-4 minutes)
     * - BSC: 15-20 confirmations (~45-60 seconds)
     * - Polygon: 128-256 confirmations (~4.5-9 minutes)
     */
    confirmations: number;

    /**
     * Address of the wCCX ERC-20 token contract on the EVM chain.
     *
     * Users interact with this contract to:
     * - Check their wCCX balance
     * - Approve token transfers to the bridge
     * - Transfer wCCX to the bridge for unwrap operations
     */
    contractAddress: Address;

    /**
     * Optional ABI (Application Binary Interface) for the wCCX contract.
     *
     * While the frontend typically uses a hardcoded ABI, this field allows
     * the backend to provide contract interface definitions dynamically.
     * May be undefined if not provided by the backend.
     */
    contractAbi?: Abi;

    /**
     * Optional RPC provider URL for the EVM chain.
     *
     * If provided, this can be used as a fallback or alternative RPC endpoint.
     * The frontend typically uses providers from Viem's chain definitions instead.
     * May be undefined if not provided by the backend.
     */
    provider?: string;

    /**
     * Decimal multiplier for token amounts (e.g., 1_000_000 for 6 decimals).
     *
     * **CRITICAL:** This is NOT the number of decimals - it's the multiplier.
     * - 6 decimals → `units = 1_000_000` (10^6)
     * - 18 decimals → `units = 1_000_000_000_000_000_000` (10^18)
     *
     * Used to convert between human-readable amounts and base units:
     * ```typescript
     * // Convert user input to base units
     * const decimals = Math.log10(config.wccx.units);
     * const baseUnits = parseUnits(userInput, decimals);
     * ```
     *
     * **Warning:** Never use floating-point math with this value. Always use
     * BigInt operations and Viem's `parseUnits`/`formatUnits` utilities.
     */
    units: number;
  };

  /**
   * Conceal Network configuration for the native ₡CCX token.
   *
   * Contains parameters for the bridge's Conceal wallet and token decimals.
   */
  ccx: {
    /**
     * Bridge wallet address on the Conceal Network.
     *
     * This is the backend-controlled Conceal address that:
     * - Receives CCX deposits for wrap (CCX → wCCX) operations
     * - Sends CCX to users for unwrap (wCCX → CCX) operations
     *
     * Users send CCX to this address when initiating a wrap swap.
     */
    accountAddress: string;

    /**
     * Decimal multiplier for CCX amounts (typically 1_000_000 for 6 decimals).
     *
     * Similar to `wccx.units`, this is the multiplier, not the decimal count.
     * CCX uses 6 decimals, so this value is typically `1_000_000` (10^6).
     *
     * @see {@link wccx.units} for usage patterns and conversion examples
     */
    units: number;
  };

  /**
   * Transaction configuration for gas estimation and fee calculation.
   */
  tx: {
    /**
     * Multiplier applied to gas estimates for safety margin.
     *
     * Gas estimates from the RPC are multiplied by this value to ensure
     * transactions have sufficient gas even if network conditions change
     * between estimation and submission.
     *
     * **Typical values:**
     * - `1.1` - 10% buffer (conservative)
     * - `1.2` - 20% buffer (standard)
     * - `1.5` - 50% buffer (aggressive, for volatile networks)
     *
     * @example
     * ```typescript
     * const estimatedGas = await estimateGas(tx);
     * const safeGasLimit = estimatedGas * config.tx.gasMultiplier;
     * ```
     */
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

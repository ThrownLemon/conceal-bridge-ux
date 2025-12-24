# Web3 Integration Guide with Viem and WalletConnet

## Overview

This guide provides comprehensive instructions for integrating Web3 functionality using Viem in our Angular 21 bridge service. Viem is a TypeScript interface for Ethereum that provides low-level stateless primitives for interacting with Ethereum.

**Key Dependencies:**

- `viem@^2.41.2` - Core Web3 functionality

## Why Viem?

Viem was chosen over ethers.js or web3.js for the following reasons:

- **TypeScript-first:** Superior type safety and developer experience
- **Lightweight:** Smaller bundle size (~30% smaller than ethers.js)
- **Modern:** Built for modern Ethereum standards
- **Performance:** Optimized for speed and efficiency
- **Tree-shakeable:** Only import what you need

## Core Concepts

### Client Types

Viem provides different client types for different purposes:

1. **Public Client:** Read-only operations (querying blockchain data)
2. **Wallet Client:** Signing transactions and messages
3. **Test Client:** For testing environments

## Project Structure

### Recommended Service Organization

```
src/app/
├── core/
│   └── services/
│       ├── web3/
│       │   ├── viem.service.ts           # Core Viem client management
│       │   ├── wallet.service.ts         # Wallet connection/management
│       │   ├── contract.service.ts       # Smart contract interactions
│       │   ├── transaction.service.ts    # Transaction handling
│       │   └── chain.service.ts          # Chain/network management
│       └── bridge/
│           ├── bridge.service.ts         # Bridge-specific logic
│           └── bridge-state.service.ts   # Bridge state management
├── models/
│   ├── chain.model.ts                    # Chain configuration types
│   ├── wallet.model.ts                   # Wallet connection types
│   ├── contract.model.ts                 # Contract types and ABIs
│   └── transaction.model.ts              # Transaction types
└── config/
    ├── chains.config.ts                  # Supported chains configuration
    ├── contracts.config.ts               # Contract addresses and ABIs
    └── wallets.config.ts                 # Wallet provider configuration
```

## Setting Up Viem Clients

### Public Client (Read Operations)

**Location:** `src/app/core/services/web3/viem.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { createPublicClient, http, PublicClient } from 'viem';
import { mainnet, bsc, polygon, avalanche } from 'viem/chains';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViemService {
  private publicClients: Map<number, PublicClient> = new Map();
  private currentChainId$ = new BehaviorSubject<number>(1); // Default to mainnet

  constructor() {
    this.initializeClients();
  }

  /**
   * Initialize public clients for all supported chains
   */
  private initializeClients(): void {
    const chains = [mainnet, bsc, polygon, avalanche];

    chains.forEach((chain) => {
      const client = createPublicClient({
        chain,
        transport: http(), // Can add RPC URL: http('https://your-rpc-url')
      });

      this.publicClients.set(chain.id, client);
    });
  }

  /**
   * Get public client for specific chain
   */
  getPublicClient(chainId: number): PublicClient | undefined {
    return this.publicClients.get(chainId);
  }

  /**
   * Get current chain's public client
   */
  getCurrentPublicClient(): PublicClient | undefined {
    return this.publicClients.get(this.currentChainId$.value);
  }

  /**
   * Observable for current chain ID
   */
  getCurrentChainId(): Observable<number> {
    return this.currentChainId$.asObservable();
  }

  /**
   * Set current chain
   */
  setCurrentChain(chainId: number): void {
    if (this.publicClients.has(chainId)) {
      this.currentChainId$.next(chainId);
    }
  }
}
```

### Wallet Client (Write Operations)

**Location:** `src/app/core/services/web3/wallet.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { createWalletClient, custom, WalletClient, type Account, type Chain } from 'viem';
import { BehaviorSubject, Observable } from 'rxjs';
import { WalletType, WalletConnection } from '@/models/wallet.model';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private walletClient$ = new BehaviorSubject<WalletClient | null>(null);
  private connectedAccount$ = new BehaviorSubject<Account | null>(null);
  private isConnected$ = new BehaviorSubject<boolean>(false);

  /**
   * Connect to MetaMask or browser wallet
   */
  async connectBrowserWallet(chain: Chain): Promise<WalletConnection> {
    try {
      // Check if window.ethereum exists
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask.');
      }

      // Request accounts
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create wallet client
      const client = createWalletClient({
        chain,
        transport: custom(window.ethereum),
        account: accounts[0] as `0x${string}`,
      });

      this.walletClient$.next(client);
      this.connectedAccount$.next(client.account);
      this.isConnected$.next(true);

      // Listen for account changes
      this.setupAccountListener();
      // Listen for chain changes
      this.setupChainListener();

      return {
        address: accounts[0],
        chainId: chain.id,
        walletType: WalletType.MetaMask,
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.walletClient$.next(null);
    this.connectedAccount$.next(null);
    this.isConnected$.next(false);
  }

  /**
   * Get current wallet client
   */
  getWalletClient(): WalletClient | null {
    return this.walletClient$.value;
  }

  /**
   * Observable for wallet client
   */
  getWalletClient$(): Observable<WalletClient | null> {
    return this.walletClient$.asObservable();
  }

  /**
   * Get connected account
   */
  getConnectedAccount(): Account | null {
    return this.connectedAccount$.value;
  }

  /**
   * Observable for connected account
   */
  getConnectedAccount$(): Observable<Account | null> {
    return this.connectedAccount$.asObservable();
  }

  /**
   * Observable for connection status
   */
  isConnected$(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  /**
   * Listen for account changes
   */
  private setupAccountListener(): void {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        // Update account
        const client = this.walletClient$.value;
        if (client) {
          this.connectedAccount$.next({
            address: accounts[0] as `0x${string}`,
            type: 'json-rpc',
          });
        }
      }
    });
  }

  /**
   * Listen for chain changes
   */
  private setupChainListener(): void {
    if (!window.ethereum) return;

    window.ethereum.on('chainChanged', (chainId: string) => {
      // Reload the page or update the chain
      window.location.reload();
    });
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
```

## Contract Interactions

### Contract Service Setup

**Location:** `src/app/core/services/web3/contract.service.ts`

```typescript
import { Injectable } from '@angular/core';
import {
  getContract,
  type Address,
  type PublicClient,
  type WalletClient,
  formatUnits,
  parseUnits,
} from 'viem';
import { ViemService } from './viem.service';
import { WalletService } from './wallet.service';
import { BRIDGE_CONTRACT_ABI } from '@/config/contracts.config';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  constructor(
    private viemService: ViemService,
    private walletService: WalletService,
  ) {}

  /**
   * Get contract instance for reading
   */
  getReadContract(address: Address, abi: any, chainId: number) {
    const publicClient = this.viemService.getPublicClient(chainId);
    if (!publicClient) {
      throw new Error(`No public client for chain ${chainId}`);
    }

    return getContract({
      address,
      abi,
      client: publicClient,
    });
  }

  /**
   * Get contract instance for writing
   */
  getWriteContract(address: Address, abi: any, chainId: number) {
    const walletClient = this.walletService.getWalletClient();
    const publicClient = this.viemService.getPublicClient(chainId);

    if (!walletClient) {
      throw new Error('Wallet not connected');
    }
    if (!publicClient) {
      throw new Error(`No public client for chain ${chainId}`);
    }

    return getContract({
      address,
      abi,
      client: { public: publicClient, wallet: walletClient },
    });
  }

  /**
   * Read from contract
   */
  async readContract<T = any>(
    address: Address,
    abi: any,
    functionName: string,
    args: any[] = [],
    chainId?: number,
  ): Promise<T> {
    const publicClient = chainId
      ? this.viemService.getPublicClient(chainId)
      : this.viemService.getCurrentPublicClient();

    if (!publicClient) {
      throw new Error('No public client available');
    }

    try {
      const data = await publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      });

      return data as T;
    } catch (error) {
      console.error('Contract read error:', error);
      throw error;
    }
  }

  /**
   * Write to contract
   */
  async writeContract(
    address: Address,
    abi: any,
    functionName: string,
    args: any[] = [],
    value?: bigint,
  ): Promise<`0x${string}`> {
    const walletClient = this.walletService.getWalletClient();
    const account = this.walletService.getConnectedAccount();

    if (!walletClient || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const { request } = await walletClient.simulateContract({
        address,
        abi,
        functionName,
        args,
        account,
        ...(value && { value }),
      });

      const hash = await walletClient.writeContract(request);
      return hash;
    } catch (error) {
      console.error('Contract write error:', error);
      throw error;
    }
  }

  /**
   * Format token amount (wei to human readable)
   */
  formatTokenAmount(amount: bigint, decimals: number = 18): string {
    return formatUnits(amount, decimals);
  }

  /**
   * Parse token amount (human readable to wei)
   */
  parseTokenAmount(amount: string, decimals: number = 18): bigint {
    return parseUnits(amount, decimals);
  }
}
```

## Transaction Handling

### Transaction Service

**Location:** `src/app/core/services/web3/transaction.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { type Hash, type TransactionReceipt, type PublicClient } from 'viem';
import { ViemService } from './viem.service';
import { BehaviorSubject, interval, takeWhile, switchMap, from } from 'rxjs';

export enum TransactionStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
}

export interface TrackedTransaction {
  hash: Hash;
  status: TransactionStatus;
  confirmations: number;
  receipt?: TransactionReceipt;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private trackedTransactions$ = new BehaviorSubject<Map<Hash, TrackedTransaction>>(new Map());

  constructor(private viemService: ViemService) {}

  /**
   * Wait for transaction receipt
   */
  async waitForTransaction(
    hash: Hash,
    chainId: number,
    confirmations: number = 1,
  ): Promise<TransactionReceipt> {
    const publicClient = this.viemService.getPublicClient(chainId);
    if (!publicClient) {
      throw new Error(`No public client for chain ${chainId}`);
    }

    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
      });

      return receipt;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Track transaction with real-time updates
   */
  trackTransaction(hash: Hash, chainId: number): void {
    const tracked: TrackedTransaction = {
      hash,
      status: TransactionStatus.Pending,
      confirmations: 0,
    };

    const transactions = this.trackedTransactions$.value;
    transactions.set(hash, tracked);
    this.trackedTransactions$.next(new Map(transactions));

    // Poll for transaction status
    interval(2000)
      .pipe(
        takeWhile(() => {
          const tx = this.trackedTransactions$.value.get(hash);
          return tx?.status === TransactionStatus.Pending;
        }),
        switchMap(() => from(this.checkTransactionStatus(hash, chainId))),
      )
      .subscribe({
        next: (receipt) => {
          if (receipt) {
            this.updateTransactionStatus(hash, receipt);
          }
        },
        error: (error) => {
          this.updateTransactionError(hash, error.message);
        },
      });
  }

  /**
   * Check transaction status
   */
  private async checkTransactionStatus(
    hash: Hash,
    chainId: number,
  ): Promise<TransactionReceipt | null> {
    const publicClient = this.viemService.getPublicClient(chainId);
    if (!publicClient) return null;

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash });
      return receipt;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update transaction status
   */
  private updateTransactionStatus(hash: Hash, receipt: TransactionReceipt): void {
    const transactions = this.trackedTransactions$.value;
    const tracked = transactions.get(hash);

    if (tracked) {
      tracked.status =
        receipt.status === 'success' ? TransactionStatus.Confirmed : TransactionStatus.Failed;
      tracked.receipt = receipt;
      transactions.set(hash, tracked);
      this.trackedTransactions$.next(new Map(transactions));
    }
  }

  /**
   * Update transaction error
   */
  private updateTransactionError(hash: Hash, error: string): void {
    const transactions = this.trackedTransactions$.value;
    const tracked = transactions.get(hash);

    if (tracked) {
      tracked.status = TransactionStatus.Failed;
      tracked.error = error;
      transactions.set(hash, tracked);
      this.trackedTransactions$.next(new Map(transactions));
    }
  }

  /**
   * Get tracked transactions observable
   */
  getTrackedTransactions$() {
    return this.trackedTransactions$.asObservable();
  }

  /**
   * Get specific transaction
   */
  getTransaction(hash: Hash): TrackedTransaction | undefined {
    return this.trackedTransactions$.value.get(hash);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(chainId: number, transaction: any): Promise<bigint> {
    const publicClient = this.viemService.getPublicClient(chainId);
    if (!publicClient) {
      throw new Error(`No public client for chain ${chainId}`);
    }

    try {
      const gas = await publicClient.estimateGas(transaction);
      return gas;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(chainId: number): Promise<bigint> {
    const publicClient = this.viemService.getPublicClient(chainId);
    if (!publicClient) {
      throw new Error(`No public client for chain ${chainId}`);
    }

    const gasPrice = await publicClient.getGasPrice();
    return gasPrice;
  }
}
```

## Chain Management

### Chain Configuration

**Location:** `src/app/config/chains.config.ts`

```typescript
import { mainnet, bsc, polygon, avalanche, type Chain } from 'viem/chains';

export interface ChainConfig {
  chain: Chain;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  bridgeContract: `0x${string}`;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [mainnet.id]: {
    chain: mainnet,
    rpcUrl: 'https://eth.llamarpc.com', // Or your preferred RPC
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: mainnet.nativeCurrency,
    bridgeContract: '0x...', // Your bridge contract address
  },
  [bsc.id]: {
    chain: bsc,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: bsc.nativeCurrency,
    bridgeContract: '0x...', // Your bridge contract address
  },
  [polygon.id]: {
    chain: polygon,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: polygon.nativeCurrency,
    bridgeContract: '0x...', // Your bridge contract address
  },
  [avalanche.id]: {
    chain: avalanche,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: avalanche.nativeCurrency,
    bridgeContract: '0x...', // Your bridge contract address
  },
};

export const DEFAULT_CHAIN_ID = mainnet.id;

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

export function getSupportedChainIds(): number[] {
  return Object.keys(SUPPORTED_CHAINS).map(Number);
}
```

### Chain Service

**Location:** `src/app/core/services/web3/chain.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { type Chain } from 'viem';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID, type ChainConfig } from '@/config/chains.config';

@Injectable({
  providedIn: 'root',
})
export class ChainService {
  private currentChain$ = new BehaviorSubject<ChainConfig>(SUPPORTED_CHAINS[DEFAULT_CHAIN_ID]);

  /**
   * Get current chain observable
   */
  getCurrentChain$(): Observable<ChainConfig> {
    return this.currentChain$.asObservable();
  }

  /**
   * Get current chain
   */
  getCurrentChain(): ChainConfig {
    return this.currentChain$.value;
  }

  /**
   * Switch to different chain
   */
  async switchChain(chainId: number): Promise<void> {
    const chainConfig = SUPPORTED_CHAINS[chainId];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    if (!window.ethereum) {
      throw new Error('No Ethereum wallet detected');
    }

    try {
      // Try to switch to the chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      this.currentChain$.next(chainConfig);
    } catch (error: any) {
      // Chain not added to wallet, try to add it
      if (error.code === 4902) {
        await this.addChainToWallet(chainConfig);
        await this.switchChain(chainId); // Retry switch
      } else {
        throw error;
      }
    }
  }

  /**
   * Add chain to wallet
   */
  private async addChainToWallet(chainConfig: ChainConfig): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet detected');
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chainConfig.chain.id.toString(16)}`,
          chainName: chainConfig.chain.name,
          nativeCurrency: chainConfig.nativeCurrency,
          rpcUrls: [chainConfig.rpcUrl],
          blockExplorerUrls: [chainConfig.blockExplorer],
        },
      ],
    });
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainConfig[] {
    return Object.values(SUPPORTED_CHAINS);
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return chainId in SUPPORTED_CHAINS;
  }

  /**
   * Get chain config by ID
   */
  getChainConfig(chainId: number): ChainConfig | undefined {
    return SUPPORTED_CHAINS[chainId];
  }
}
```

## Error Handling for Blockchain Operations

### Common Error Types

```typescript
export enum Web3ErrorType {
  UserRejected = 'USER_REJECTED',
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  NetworkError = 'NETWORK_ERROR',
  ContractError = 'CONTRACT_ERROR',
  InvalidAddress = 'INVALID_ADDRESS',
  TransactionFailed = 'TRANSACTION_FAILED',
  UnknownError = 'UNKNOWN_ERROR',
}

export interface Web3Error {
  type: Web3ErrorType;
  message: string;
  originalError?: any;
}

export function parseWeb3Error(error: any): Web3Error {
  // User rejected transaction
  if (error.code === 4001 || error.message?.includes('User rejected')) {
    return {
      type: Web3ErrorType.UserRejected,
      message: 'Transaction was rejected by user',
      originalError: error,
    };
  }

  // Insufficient funds
  if (error.message?.includes('insufficient funds')) {
    return {
      type: Web3ErrorType.InsufficientFunds,
      message: 'Insufficient funds for transaction',
      originalError: error,
    };
  }

  // Network error
  if (error.message?.includes('network') || error.code === -32603) {
    return {
      type: Web3ErrorType.NetworkError,
      message: 'Network connection error. Please check your connection.',
      originalError: error,
    };
  }

  // Contract execution error
  if (error.message?.includes('execution reverted')) {
    return {
      type: Web3ErrorType.ContractError,
      message: 'Contract execution failed. Please check transaction parameters.',
      originalError: error,
    };
  }

  // Invalid address
  if (error.message?.includes('invalid address')) {
    return {
      type: Web3ErrorType.InvalidAddress,
      message: 'Invalid Ethereum address provided',
      originalError: error,
    };
  }

  // Default unknown error
  return {
    type: Web3ErrorType.UnknownError,
    message: error.message || 'An unknown error occurred',
    originalError: error,
  };
}
```

## Gas Optimization Strategies

### Gas Estimation with Buffer

```typescript
/**
 * Estimate gas with safety buffer
 */
async estimateGasWithBuffer(
  transaction: any,
  bufferPercentage: number = 20
): Promise<bigint> {
  const estimatedGas = await this.transactionService.estimateGas(
    chainId,
    transaction
  );

  // Add buffer to account for gas price fluctuations
  const buffer = (estimatedGas * BigInt(bufferPercentage)) / BigInt(100);
  return estimatedGas + buffer;
}
```

### EIP-1559 Gas Pricing

```typescript
/**
 * Get EIP-1559 gas fees
 */
async getEIP1559Fees(chainId: number) {
  const publicClient = this.viemService.getPublicClient(chainId);
  if (!publicClient) {
    throw new Error(`No public client for chain ${chainId}`);
  }

  const block = await publicClient.getBlock();
  const baseFee = block.baseFeePerGas;

  if (!baseFee) {
    throw new Error('Chain does not support EIP-1559');
  }

  // Suggested priority fees (can be adjusted based on urgency)
  const maxPriorityFeePerGas = parseGwei('2'); // 2 gwei
  const maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;

  return {
    maxFeePerGas,
    maxPriorityFeePerGas
  };
}
```

## Best Practices

### 1. Always Use Try-Catch Blocks

```typescript
try {
  const result = await contractService.writeContract(...);
  // Handle success
} catch (error) {
  const web3Error = parseWeb3Error(error);
  // Handle error appropriately
}
```

### 2. Validate Addresses

```typescript
import { isAddress } from 'viem';

function validateAddress(address: string): boolean {
  return isAddress(address);
}
```

### 3. Use Type-Safe Contract Interactions

```typescript
// Generate types from ABI using wagmi CLI or manually define
import { BridgeABI } from '@/config/contracts.config';

const result = await contractService.readContract<bigint>(
  contractAddress,
  BridgeABI,
  'getBalance',
  [userAddress],
);
```

### 4. Handle Account and Chain Changes

```typescript
// Always listen for these events
window.ethereum?.on('accountsChanged', handleAccountsChanged);
window.ethereum?.on('chainChanged', handleChainChanged);

// Clean up listeners
ngOnDestroy() {
  window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
  window.ethereum?.removeListener('chainChanged', handleChainChanged);
}
```

### 5. Simulate Before Writing

```typescript
// Always simulate contract calls before executing
const { request } = await walletClient.simulateContract({
  address,
  abi,
  functionName,
  args,
});

// Only proceed if simulation succeeds
const hash = await walletClient.writeContract(request);
```

## Testing Web3 Interactions

### Mocking Viem in Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ContractService } from './contract.service';

describe('ContractService', () => {
  it('should read contract successfully', async () => {
    const mockPublicClient = {
      readContract: vi.fn().mockResolvedValue(BigInt(1000)),
    };

    // Inject mock client
    const service = new ContractService(mockViemService, mockWalletService);

    const result = await service.readContract('0x123...', [], 'balanceOf', ['0xabc...']);

    expect(result).toBe(BigInt(1000));
  });
});
```

## Common Patterns

### Pattern 1: Read-Write-Wait

```typescript
// 1. Read current state
const currentBalance = await contractService.readContract(contractAddress, ABI, 'balanceOf', [
  userAddress,
]);

// 2. Write transaction
const hash = await contractService.writeContract(contractAddress, ABI, 'transfer', [
  recipientAddress,
  amount,
]);

// 3. Wait for confirmation
const receipt = await transactionService.waitForTransaction(hash, chainId);

// 4. Verify new state
const newBalance = await contractService.readContract(contractAddress, ABI, 'balanceOf', [
  userAddress,
]);
```

### Pattern 2: Approve-Then-Transfer (ERC20)

```typescript
// 1. Approve spending
const approveHash = await contractService.writeContract(tokenAddress, ERC20_ABI, 'approve', [
  spenderAddress,
  amount,
]);

await transactionService.waitForTransaction(approveHash, chainId);

// 2. Execute transfer
const transferHash = await contractService.writeContract(
  spenderAddress,
  SPENDER_ABI,
  'transferFrom',
  [ownerAddress, recipientAddress, amount],
);

await transactionService.waitForTransaction(transferHash, chainId);
```

## Security Considerations

### 1. Never Expose Private Keys

- Private keys should never be stored in the application
- Always use wallet providers (MetaMask, etc.)
- Never log sensitive information

### 2. Validate All Inputs

```typescript
// Validate addresses
if (!isAddress(address)) {
  throw new Error('Invalid address');
}

// Validate amounts
if (amount <= 0n) {
  throw new Error('Amount must be positive');
}

// Check balance before transactions
const balance = await getBalance();
if (balance < amount) {
  throw new Error('Insufficient balance');
}
```

### 3. Use Proper Gas Limits

- Always estimate gas before transactions
- Add buffer for gas price fluctuations
- Handle out-of-gas errors gracefully

### 4. Implement Rate Limiting

- Limit transaction frequency to prevent spam
- Implement cooldown periods for sensitive operations

### 5. Verify Contract Addresses

- Store contract addresses in configuration
- Verify addresses match expected values
- Use checksummed addresses

## Utilities

### Address Utilities

```typescript
import { getAddress, isAddress } from 'viem';

/**
 * Convert address to checksum format
 */
export function toChecksumAddress(address: string): `0x${string}` {
  if (!isAddress(address)) {
    throw new Error('Invalid address');
  }
  return getAddress(address);
}

/**
 * Shorten address for display
 */
export function shortenAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4,
): string {
  if (!isAddress(address)) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Compare addresses (case-insensitive)
 */
export function addressesEqual(address1: string, address2: string): boolean {
  if (!isAddress(address1) || !isAddress(address2)) return false;
  return getAddress(address1) === getAddress(address2);
}
```

### Number Formatting Utilities

```typescript
import { formatUnits, parseUnits, formatEther, parseEther } from 'viem';

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  maxDecimals: number = 4,
): string {
  const formatted = formatUnits(amount, decimals);
  const number = parseFloat(formatted);
  return number.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

/**
 * Format Ether with proper decimals
 */
export function formatEtherAmount(amount: bigint, maxDecimals: number = 4): string {
  const formatted = formatEther(amount);
  const number = parseFloat(formatted);
  return number.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

/**
 * Parse user input to Wei
 */
export function parseUserInput(input: string, decimals: number = 18): bigint {
  try {
    return parseUnits(input, decimals);
  } catch (error) {
    throw new Error('Invalid amount format');
  }
}
```

## Multi-Chain Support Patterns

### Cross-Chain Balance Checking

```typescript
async checkBalancesAcrossChains(
  address: `0x${string}`,
  tokenAddress: `0x${string}`,
  chainIds: number[]
): Promise<Map<number, bigint>> {
  const balances = new Map<number, bigint>();

  await Promise.all(
    chainIds.map(async (chainId) => {
      try {
        const balance = await this.contractService.readContract<bigint>(
          tokenAddress,
          ERC20_ABI,
          'balanceOf',
          [address],
          chainId
        );
        balances.set(chainId, balance);
      } catch (error) {
        console.error(`Failed to get balance for chain ${chainId}:`, error);
        balances.set(chainId, 0n);
      }
    })
  );

  return balances;
}
```

## Performance Optimization

### 1. Batch Multiple Reads

```typescript
import { multicall } from 'viem';

async batchReadContracts(calls: any[]) {
  const publicClient = this.viemService.getCurrentPublicClient();
  if (!publicClient) throw new Error('No client');

  const results = await publicClient.multicall({
    contracts: calls
  });

  return results;
}
```

### 2. Cache Frequently Accessed Data

```typescript
private balanceCache = new Map<string, { balance: bigint; timestamp: number }>();
private readonly CACHE_DURATION = 30000; // 30 seconds

async getCachedBalance(address: string): Promise<bigint> {
  const cached = this.balanceCache.get(address);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
    return cached.balance;
  }

  const balance = await this.fetchBalance(address);
  this.balanceCache.set(address, { balance, timestamp: now });
  return balance;
}
```

### 3. Use WebSocket for Real-Time Updates

```typescript
import { createPublicClient, webSocket } from 'viem';

// Create WebSocket client for real-time events
const wsClient = createPublicClient({
  chain: mainnet,
  transport: webSocket('wss://eth-mainnet.g.alchemy.com/v2/your-api-key'),
});

// Watch for events
const unwatch = wsClient.watchContractEvent({
  address: contractAddress,
  abi: CONTRACT_ABI,
  eventName: 'Transfer',
  onLogs: (logs) => console.log(logs),
});
```

## Troubleshooting Common Issues

### Issue 1: Transaction Stuck in Pending

**Solution:** Increase gas price or use "speed up" functionality

```typescript
// Speed up transaction by increasing gas
const newHash = await walletClient.sendTransaction({
  ...originalTx,
  nonce: originalTx.nonce, // Same nonce
  maxFeePerGas: originalTx.maxFeePerGas * 2n, // Double the fee
});
```

### Issue 2: "Nonce Too Low" Error

**Solution:** Get current nonce and retry

```typescript
const nonce = await publicClient.getTransactionCount({
  address: account.address,
});
```

### Issue 3: Contract Execution Reverted

**Solution:** Check contract requirements and simulate before sending

```typescript
// Always simulate first
try {
  const { request } = await walletClient.simulateContract({
    address,
    abi,
    functionName,
    args,
  });
} catch (error) {
  // Handle simulation error before sending transaction
  console.error('Simulation failed:', error);
}
```

## Additional Resources

- **Viem Documentation:** https://viem.sh
- **Ethereum JSON-RPC Specification:** https://ethereum.github.io/execution-apis/api-documentation/
- **EIP-1559 Gas Explanation:** https://eips.ethereum.org/EIPS/eip-1559
- **Contract ABI Specification:** https://docs.soliditylang.org/en/latest/abi-spec.html

## Related docs/specs in this repo

- [`docs/wallets.md`](./wallets.md)
- [`docs/smart_contracts.md`](./smart_contracts.md)
- [`docs/backend_api.md`](./backend_api.md)
- [`docs/error_handling.md`](./error_handling.md)
- [`docs/security.md`](./security.md)
- [`docs/testing.md`](./testing.md)
- [`docs/bridge_overview.md`](./bridge_overview.md)
- [`docs/bridge_user_guide.md`](./bridge_user_guide.md)
- [`docs/bridge_architecture.md`](./bridge_architecture.md)

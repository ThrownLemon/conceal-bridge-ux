# Bridge Service Architecture Guide

## Overview

The Conceal Bridge Service is a two-way bridge enabling swaps between native ₡CCX (Conceal Network) and wrapped $wCCX (on Ethereum, BSC, Polygon, Avalanche). The architecture consists of an API backend and an Angular 21 frontend that communicates with it.

**Bridge Direction:**
- **CCX → wCCX:** Wrap native CCX into ERC-20 wCCX tokens
- **wCCX → CCX:** Unwrap wCCX tokens back to native CCX

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Angular 21 Frontend                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Bridge UI Components & Services          │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Bridge Service Layer (RxJS)            │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │         HTTP Client + Web3 Integration           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend API Server                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              RESTful API Endpoints               │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │        Swap Processing & State Management        │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │     Blockchain Interaction (CCX & Ethereum)      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Service Structure

### Frontend Services Organization

```
src/app/
├── core/
│   └── services/
│       ├── bridge/
│       │   ├── bridge.service.ts           # Main bridge orchestration
│       │   ├── bridge-state.service.ts     # Bridge state management
│       │   ├── bridge-api.service.ts       # API communication
│       │   ├── bridge-transaction.service.ts # Transaction tracking
│       │   └── bridge-validation.service.ts  # Input validation
│       ├── web3/
│       │   ├── wallet.service.ts           # Wallet connection
│       │   ├── contract.service.ts         # Contract interactions
│       │   └── chain.service.ts            # Network management
│       └── api/
│           └── http.service.ts             # HTTP client wrapper
├── models/
│   ├── bridge.model.ts                     # Bridge types
│   ├── swap.model.ts                       # Swap transaction types
│   └── api-response.model.ts               # API response types
└── config/
    ├── api.config.ts                       # API endpoints
    └── bridge.config.ts                    # Bridge configuration
```

## Bridge Flow Architecture

### CCX → wCCX (Wrapping) Flow

```
1. User Input → Validation
   ↓
2. Estimate Gas Fee
   ↓
3. User Pays Gas Fee (MetaMask/Injected)
   ↓
4. Initialize Swap (API: /api/ccx/wccx/swap/init)
   ↓
5. User Sends CCX to Bridge Wallet (with Payment ID)
   ↓
6. Backend Monitors CCX Blockchain
   ↓
7. CCX Confirmed → Backend Sends wCCX on Target Chain
   ↓
8. Transaction Complete
```

### wCCX → CCX (Unwrapping) Flow

```
1. User Input → Validation
   ↓
2. User Approves wCCX Transfer (if needed)
   ↓
3. User Sends wCCX to Bridge Contract
   ↓
4. Initialize Swap (API: /api/wccx/ccx/swap/init)
   ↓
5. Backend Monitors Ethereum/BSC/Polygon Blockchain
   ↓
6. wCCX Confirmed → Execute Swap (API: /api/wccx/ccx/swap/exec)
   ↓
7. Backend Sends CCX to User's CCX Address
   ↓
8. Transaction Complete
```

## API Endpoints Reference

### Base Configuration

**Location:** `src/app/config/api.config.ts`

```typescript
export const API_CONFIG = {
  baseUrl: 'https://bridge-api.conceal.network', // Replace with actual URL
  endpoints: {
    // CCX → wCCX
    ccxToWccx: {
      init: '/api/ccx/wccx/swap/init',
      estimateGas: '/api/ccx/wccx/estimateGas',
      status: '/api/ccx/wccx/tx'
    },
    // wCCX → CCX
    wccxToCcx: {
      init: '/api/wccx/ccx/swap/init',
      exec: '/api/wccx/ccx/swap/exec',
      status: '/api/wccx/ccx/tx'
    },
    // Balances
    balance: {
      ccx: '/api/balance/ccx',
      wccx: '/api/balance/wccx'
    }
  }
};
```

### CCX → wCCX Endpoints

#### 1. Initialize Swap
**Endpoint:** `POST /api/ccx/wccx/swap/init`

**Request Payload:**
```typescript
interface CCXToWCCXInitRequest {
  email?: string;           // Optional: Email for status updates
  amount: string;           // Amount of CCX to swap
  toAddress: string;        // wCCX destination address
  fromAddress: string;      // CCX source address
  txfeehash: string;        // ETH/BSC/Polygon gas fee transaction hash
}
```

**Response:**
```typescript
interface CCXToWCCXInitResponse {
  success: boolean;
  paymentId: string;        // Unique payment ID for tracking
}
```

#### 2. Estimate Gas
**Endpoint:** `POST /api/ccx/wccx/estimateGas`

**Request Payload:**
```typescript
interface EstimateGasRequest {
  amount: string;           // Amount of CCX to swap
  address: string;          // wCCX smart contract address
}
```

**Response:**
```typescript
interface EstimateGasResponse {
  result: boolean;
  gas: string;              // Gas amount in wei
}
```

#### 3. Get Transaction Status
**Endpoint:** `POST /api/ccx/wccx/tx`

**Request Payload:**
```typescript
interface GetTxStatusRequest {
  paymentId: string;
}
```

**Response:**
```typescript
interface CCXToWCCXTxResponse {
  swapped: string;          // Amount swapped
  address: string;          // Destination address
  swapHash: string;         // ETH/BSC/Polygon transaction hash
  depositHash: string;      // CCX blockchain transaction hash
}
```

#### 4. Get CCX Balance
**Endpoint:** `GET /api/balance/ccx`

**Response:**
```typescript
interface BalanceResponse {
  result: boolean;
  balance: string;          // Available CCX in swap wallet
}
```

### wCCX → CCX Endpoints

#### 1. Initialize Swap
**Endpoint:** `POST /api/wccx/ccx/swap/init`

**Request Payload:**
```typescript
interface WCCXToCCXInitRequest {
  email?: string;           // Optional: Email for status updates
  toAddress: string;        // CCX destination address
  fromAddress: string;      // wCCX source address
  txHash: string;           // ETH/BSC/Polygon deposit transaction hash
}
```

**Response:**
```typescript
interface WCCXToCCXInitResponse {
  success: boolean;
  paymentId: string;        // Unique payment ID for tracking
}
```

#### 2. Execute Swap
**Endpoint:** `POST /api/wccx/ccx/swap/exec`

**Request Payload:**
```typescript
interface ExecuteSwapRequest {
  email?: string;           // Optional: Email for status updates
  paymentId: string;        // Payment ID from init
}
```

**Response:**
```typescript
interface ExecuteSwapResponse {
  success: boolean;
  swapData: SwapData;       // Swap transaction details
}
```

#### 3. Get Transaction Status
**Endpoint:** `POST /api/wccx/ccx/tx`

**Request Payload:**
```typescript
interface GetTxStatusRequest {
  paymentId: string;
}
```

**Response:**
```typescript
interface WCCXToCCXTxResponse {
  hasRecord: boolean;       // Payment ID found in database
  result: boolean;          // Transaction finished
  swapped: string;          // Amount swapped
  hasExpired: boolean;      // Swap period expired
  txdata: {
    swapped: string;
    address: string;        // CCX destination address
    swapHash: string;       // CCX blockchain transaction hash
    depositHash: string;    // ETH/BSC/Polygon transaction hash
  };
}
```

#### 4. Get wCCX Balance
**Endpoint:** `GET /api/balance/wccx`

**Response:**
```typescript
interface BalanceResponse {
  result: boolean;
  balance: string;          // Available wCCX in swap wallet
}
```

## Service Implementation

### Bridge API Service

**Location:** `src/app/core/services/bridge/bridge-api.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/config/api.config';
import {
  CCXToWCCXInitRequest,
  CCXToWCCXInitResponse,
  WCCXToCCXInitRequest,
  WCCXToCCXInitResponse,
  EstimateGasRequest,
  EstimateGasResponse,
  GetTxStatusRequest,
  CCXToWCCXTxResponse,
  WCCXToCCXTxResponse,
  ExecuteSwapRequest,
  ExecuteSwapResponse,
  BalanceResponse
} from '@/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BridgeApiService {
  private baseUrl = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  // ========== CCX → wCCX APIs ==========

  /**
   * Initialize CCX to wCCX swap
   */
  initCCXToWCCXSwap(request: CCXToWCCXInitRequest): Observable<CCXToWCCXInitResponse> {
    return this.http.post<CCXToWCCXInitResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.ccxToWccx.init}`,
      request
    );
  }

  /**
   * Estimate gas for CCX to wCCX swap
   */
  estimateGas(request: EstimateGasRequest): Observable<EstimateGasResponse> {
    return this.http.post<EstimateGasResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.ccxToWccx.estimateGas}`,
      request
    );
  }

  /**
   * Get CCX to wCCX transaction status
   */
  getCCXToWCCXStatus(paymentId: string): Observable<CCXToWCCXTxResponse> {
    return this.http.post<CCXToWCCXTxResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.ccxToWccx.status}`,
      { paymentId }
    );
  }

  /**
   * Get CCX swap wallet balance
   */
  getCCXBalance(): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.balance.ccx}`
    );
  }

  // ========== wCCX → CCX APIs ==========

  /**
   * Initialize wCCX to CCX swap
   */
  initWCCXToCCXSwap(request: WCCXToCCXInitRequest): Observable<WCCXToCCXInitResponse> {
    return this.http.post<WCCXToCCXInitResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.wccxToCcx.init}`,
      request
    );
  }

  /**
   * Execute wCCX to CCX swap
   */
  executeWCCXToCCXSwap(request: ExecuteSwapRequest): Observable<ExecuteSwapResponse> {
    return this.http.post<ExecuteSwapResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.wccxToCcx.exec}`,
      request
    );
  }

  /**
   * Get wCCX to CCX transaction status
   */
  getWCCXToCCXStatus(paymentId: string): Observable<WCCXToCCXTxResponse> {
    return this.http.post<WCCXToCCXTxResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.wccxToCcx.status}`,
      { paymentId }
    );
  }

  /**
   * Get wCCX swap wallet balance
   */
  getWCCXBalance(): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.balance.wccx}`
    );
  }
}
```

### Bridge Orchestration Service

**Location:** `src/app/core/services/bridge/bridge.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Observable, from, switchMap, tap } from 'rxjs';
import { BridgeApiService } from './bridge-api.service';
import { BridgeStateService } from './bridge-state.service';
import { WalletService } from '../web3/wallet.service';
import { ContractService } from '../web3/contract.service';
import { 
  SwapDirection, 
  SwapTransaction,
  SwapStatus 
} from '@/models/swap.model';
import { parseEther } from 'viem';

@Injectable({
  providedIn: 'root'
})
export class BridgeService {
  constructor(
    private apiService: BridgeApiService,
    private stateService: BridgeStateService,
    private walletService: WalletService,
    private contractService: ContractService
  ) {}

  /**
   * Wrap CCX to wCCX
   */
  async wrapCCX(
    amount: string,
    fromAddress: string,
    toAddress: string,
    email?: string
  ): Promise<SwapTransaction> {
    try {
      // 1. Validate inputs
      this.validateWrapInputs(amount, fromAddress, toAddress);

      // 2. Get contract address for current chain
      const contractAddress = this.getContractAddress();

      // 3. Estimate gas
      const gasEstimate = await this.estimateWrapGas(amount, contractAddress);

      // 4. Request gas fee payment from user
      const gasFeeHash = await this.payGasFee(gasEstimate);

      // 5. Initialize swap on backend
      const initResponse = await this.initCCXToWCCX({
        amount,
        fromAddress,
        toAddress,
        txfeehash: gasFeeHash,
        email
      });

      // 6. Create swap transaction record
      const swapTx: SwapTransaction = {
        paymentId: initResponse.paymentId,
        direction: SwapDirection.CCXToWCCX,
        amount,
        fromAddress,
        toAddress,
        status: SwapStatus.Initialized,
        gasFeeHash,
        createdAt: new Date()
      };

      // 7. Save to state
      this.stateService.addTransaction(swapTx);

      return swapTx;
    } catch (error) {
      console.error('Wrap CCX failed:', error);
      throw error;
    }
  }

  /**
   * Unwrap wCCX to CCX
   */
  async unwrapWCCX(
    amount: string,
    fromAddress: string,
    toAddress: string,
    email?: string
  ): Promise<SwapTransaction> {
    try {
      // 1. Validate inputs
      this.validateUnwrapInputs(amount, fromAddress, toAddress);

      // 2. Check allowance and approve if needed
      await this.ensureAllowance(amount);

      // 3. Send wCCX to bridge contract
      const depositHash = await this.depositWCCX(amount);

      // 4. Initialize swap on backend
      const initResponse = await this.initWCCXToCCX({
        toAddress,
        fromAddress,
        txHash: depositHash,
        email
      });

      // 5. Create swap transaction record
      const swapTx: SwapTransaction = {
        paymentId: initResponse.paymentId,
        direction: SwapDirection.WCCXToCCX,
        amount,
        fromAddress,
        toAddress,
        status: SwapStatus.Initialized,
        depositHash,
        createdAt: new Date()
      };

      // 6. Save to state
      this.stateService.addTransaction(swapTx);

      // 7. Execute swap (may need to wait for confirmations)
      // This could be done automatically by backend or triggered manually
      // await this.executeSwap(initResponse.paymentId, email);

      return swapTx;
    } catch (error) {
      console.error('Unwrap wCCX failed:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for wrapping
   */
  private async estimateWrapGas(
    amount: string,
    contractAddress: string
  ): Promise<string> {
    const response = await this.apiService.estimateGas({
      amount,
      address: contractAddress
    }).toPromise();

    if (!response?.result) {
      throw new Error('Failed to estimate gas');
    }

    return response.gas;
  }

  /**
   * Pay gas fee via MetaMask/Injected Wallet
   */
  private async payGasFee(gasAmount: string): Promise<string> {
    const walletClient = this.walletService.getWalletClient();
    const account = this.walletService.getConnectedAccount();

    if (!walletClient || !account) {
      throw new Error('Wallet not connected');
    }

    // Send gas fee to bridge contract/address
    const hash = await walletClient.sendTransaction({
      account,
      to: this.getBridgeGasAddress(),
      value: BigInt(gasAmount)
    });

    return hash;
  }

  /**
   * Deposit wCCX to bridge contract
   */
  private async depositWCCX(amount: string): Promise<string> {
    const amountInWei = parseEther(amount);
    const bridgeContract = this.getBridgeContractAddress();
    
    // Transfer wCCX to bridge contract
    const hash = await this.contractService.writeContract(
      this.getWCCXContractAddress(),
      this.getWCCXABI(),
      'transfer',
      [bridgeContract, amountInWei]
    );

    return hash;
  }

  /**
   * Ensure wCCX allowance for bridge contract
   */
  private async ensureAllowance(amount: string): Promise<void> {
    const amountInWei = parseEther(amount);
    const bridgeContract = this.getBridgeContractAddress();
    const account = this.walletService.getConnectedAccount();

    if (!account) {
      throw new Error('Wallet not connected');
    }

    // Check current allowance
    const currentAllowance = await this.contractService.readContract<bigint>(
      this.getWCCXContractAddress(),
      this.getWCCXABI(),
      'allowance',
      [account.address, bridgeContract]
    );

    // Approve if needed
    if (currentAllowance < amountInWei) {
      await this.contractService.writeContract(
        this.getWCCXContractAddress(),
        this.getWCCXABI(),
        'approve',
        [bridgeContract, amountInWei]
      );
    }
  }

  /**
   * Initialize CCX to wCCX swap
   */
  private initCCXToWCCX(request: any): Promise<any> {
    return this.apiService.initCCXToWCCXSwap(request).toPromise();
  }

  /**
   * Initialize wCCX to CCX swap
   */
  private initWCCXToCCX(request: any): Promise<any> {
    return this.apiService.initWCCXToCCXSwap(request).toPromise();
  }

  /**
   * Execute wCCX to CCX swap
   */
  async executeSwap(paymentId: string, email?: string): Promise<void> {
    const response = await this.apiService.executeWCCXToCCXSwap({
      paymentId,
      email
    }).toPromise();

    if (!response?.success) {
      throw new Error('Failed to execute swap');
    }

    // Update transaction status
    this.stateService.updateTransactionStatus(
      paymentId,
      SwapStatus.Executing
    );
  }

  /**
   * Get transaction status (polling)
   */
  getTransactionStatus(
    paymentId: string,
    direction: SwapDirection
  ): Observable<any> {
    if (direction === SwapDirection.CCXToWCCX) {
      return this.apiService.getCCXToWCCXStatus(paymentId);
    } else {
      return this.apiService.getWCCXToCCXStatus(paymentId);
    }
  }

  // Helper methods for configuration
  private getContractAddress(): string {
    // Get based on current chain
    return '0x...';
  }

  private getBridgeGasAddress(): `0x${string}` {
    return '0x...' as `0x${string}`;
  }

  private getBridgeContractAddress(): `0x${string}` {
    return '0x...' as `0x${string}`;
  }

  private getWCCXContractAddress(): `0x${string}` {
    return '0x...' as `0x${string}`;
  }

  private getWCCXABI(): any[] {
    return []; // ERC-20 ABI
  }

  private validateWrapInputs(
    amount: string,
    fromAddress: string,
    toAddress: string
  ): void {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }
    // Add more validation
  }

  private validateUnwrapInputs(
    amount: string,
    fromAddress: string,
    toAddress: string
  ): void {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }
    // Add more validation
  }
}
```

### Bridge State Management

**Location:** `src/app/core/services/bridge/bridge-state.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { SwapTransaction, SwapStatus } from '@/models/swap.model';

@Injectable({
  providedIn: 'root'
})
export class BridgeStateService {
  private transactions$ = new BehaviorSubject<Map<string, SwapTransaction>>(
    new Map()
  );
  private activeTransaction$ = new BehaviorSubject<SwapTransaction | null>(null);

  /**
   * Get all transactions
   */
  getTransactions$(): Observable<Map<string, SwapTransaction>> {
    return this.transactions$.asObservable();
  }

  /**
   * Get active transaction
   */
  getActiveTransaction$(): Observable<SwapTransaction | null> {
    return this.activeTransaction$.asObservable();
  }

  /**
   * Add new transaction
   */
  addTransaction(transaction: SwapTransaction): void {
    const transactions = this.transactions$.value;
    transactions.set(transaction.paymentId, transaction);
    this.transactions$.next(new Map(transactions));
    this.activeTransaction$.next(transaction);
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(paymentId: string, status: SwapStatus): void {
    const transactions = this.transactions$.value;
    const transaction = transactions.get(paymentId);

    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = new Date();
      transactions.set(paymentId, transaction);
      this.transactions$.next(new Map(transactions));

      // Update active if it's the active transaction
      if (this.activeTransaction$.value?.paymentId === paymentId) {
        this.activeTransaction$.next(transaction);
      }
    }
  }

  /**
   * Update transaction with hashes
   */
  updateTransactionHashes(
    paymentId: string,
    depositHash?: string,
    swapHash?: string
  ): void {
    const transactions = this.transactions$.value;
    const transaction = transactions.get(paymentId);

    if (transaction) {
      if (depositHash) transaction.depositHash = depositHash;
      if (swapHash) transaction.swapHash = swapHash;
      transaction.updatedAt = new Date();
      transactions.set(paymentId, transaction);
      this.transactions$.next(new Map(transactions));
    }
  }

  /**
   * Get transaction by payment ID
   */
  getTransaction(paymentId: string): SwapTransaction | undefined {
    return this.transactions$.value.get(paymentId);
  }

  /**
   * Clear all transactions
   */
  clearTransactions(): void {
    this.transactions$.next(new Map());
    this.activeTransaction$.next(null);
  }
}
```

## Data Models

### Swap Transaction Model

**Location:** `src/app/models/swap.model.ts`

```typescript
export enum SwapDirection {
  CCXToWCCX = 'CCX_TO_WCCX',
  WCCXToCCX = 'WCCX_TO_CCX'
}

export enum SwapStatus {
  Initialized = 'initialized',
  PendingDeposit = 'pending_deposit',
  DepositConfirmed = 'deposit_confirmed',
  Executing = 'executing',
  Completed = 'completed',
  Failed = 'failed',
  Expired = 'expired'
}

export interface SwapTransaction {
  paymentId: string;
  direction: SwapDirection;
  amount: string;
  fromAddress: string;
  toAddress: string;
  status: SwapStatus;
  gasFeeHash?: string;
  depositHash?: string;
  swapHash?: string;
  email?: string;
  createdAt: Date;
  updatedAt?: Date;
  error?: string;
}
```

## Transaction Polling Strategy

### Polling Service

**Location:** `src/app/core/services/bridge/bridge-transaction.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { interval, switchMap, takeWhile, tap } from 'rxjs';
import { BridgeApiService } from './bridge-api.service';
import { BridgeStateService } from './bridge-state.service';
import { SwapDirection, SwapStatus } from '@/models/swap.model';

@Injectable({
  providedIn: 'root'
})
export class BridgeTransactionService {
  private pollingInterval = 5000; // 5 seconds
  private maxPollingDuration = 3600000; // 1 hour

  constructor(
    private apiService: BridgeApiService,
    private stateService: BridgeStateService
  ) {}

  /**
   * Start polling for transaction status
   */
  pollTransactionStatus(paymentId: string, direction: SwapDirection): void {
    const startTime = Date.now();

    interval(this.pollingInterval)
      .pipe(
        takeWhile(() => {
          const transaction = this.stateService.getTransaction(paymentId);
          const elapsed = Date.now() - startTime;
          
          // Stop if completed, failed, or max duration exceeded
          return (
            transaction?.status !== SwapStatus.Completed &&
            transaction?.status !== SwapStatus.Failed &&
            elapsed < this.maxPollingDuration
          );
        }),
        switchMap(() => {
          if (direction === SwapDirection.CCXToWCCX) {
            return this.apiService.getCCXToWCCXStatus(paymentId);
          } else {
            return this.apiService.getWCCXToCCXStatus(paymentId);
          }
        }),
        tap(response => {
          this.updateTransactionFromResponse(paymentId, response, direction);
        })
      )
      .subscribe({
        error: (error) => {
          console.error('Polling error:', error);
          this.stateService.updateTransactionStatus(
            paymentId,
            SwapStatus.Failed
          );
        }
      });
  }

  /**
   * Update transaction from API response
   */
  private updateTransactionFromResponse(
    paymentId: string,
    response: any,
    direction: SwapDirection
  ): void {
    if (direction === SwapDirection.CCXToWCCX) {
      // CCX to wCCX response
      if (response.swapHash && response.depositHash) {
        this.stateService.updateTransactionHashes(
          paymentId,
          response.depositHash,
          response.swapHash
        );
        this.stateService.updateTransactionStatus(
          paymentId,
          SwapStatus.Completed
        );
      }
    } else {
      // wCCX to CCX response
      if (response.hasExpired) {
        this.stateService.updateTransactionStatus(
          paymentId,
          SwapStatus.Expired
        );
      } else if (response.result && response.txdata) {
        // ...update local state from response.txdata...
      }
    }
  }
}
```

## Related docs/specs in this repo

- [`docs/bridge_overview.md`](./bridge_overview.md)
- [`docs/bridge_user_guide.md`](./bridge_user_guide.md)
- [`docs/backend_api.md`](./backend_api.md)
- [`docs/web3_integrations.md`](./web3_integrations.md)
- [`docs/wallets.md`](./wallets.md)
- [`docs/smart_conctracts.md`](./smart_conctracts.md)
- [`docs/error_handling.md`](./error_handling.md)
- [`docs/security.md`](./security.md)
- [`docs/testing.md`](./testing.md)
- [`ai_spec/http_and_error_handling.md`](../ai_spec/http_and_error_handling.md)
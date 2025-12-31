# LI.FI Chain Data API Guide

This document provides a reference for integrating with the LI.FI API for cross-chain data and routing services.

**Official Documentation:** [docs.li.fi](https://docs.li.fi/api-reference/introduction)

---

## Overview

LI.FI is a cross-chain bridge and DEX aggregator that provides:

- Chain and token information across multiple networks
- Cross-chain routing and quotes
- Gas price data
- Transaction status tracking

**Base URL:** `https://li.quest/v1`

---

## Authentication

| Requirement | Details                                       |
| ----------- | --------------------------------------------- |
| API Key     | **Optional** for basic usage                  |
| Header      | `x-lifi-api-key`                              |
| Purpose     | Higher rate limits for authenticated requests |

> [!CAUTION]
> **Security Rule:** Never expose `x-lifi-api-key` in client-side code (browsers, mobile apps). API keys are for server-side use only.

### Rate Limits

- **Unauthenticated:** Rate limits calculated per IP address
- **Authenticated:** Rate limits calculated per API key

---

## Endpoints Reference

### Information Endpoints

#### GET /v1/chains

Get all supported blockchain networks.

```typescript
// Response type
interface Chain {
  id: number; // Chain ID (e.g., 1, 56, 137)
  key: string; // Chain key (e.g., 'eth', 'bsc', 'pol')
  name: string; // Human-readable name
  coin: string; // Native currency symbol
  chainType: string; // 'EVM' | 'SVM' | etc.
  nativeToken: Token;
  blockExplorerUrl: string;
}
```

**Usage:**

```typescript
const response = await fetch('https://li.quest/v1/chains');
const chains: Chain[] = await response.json();
```

#### GET /v1/tokens

Fetch all known tokens across supported chains.

```typescript
// Query parameters
interface TokensParams {
  chains?: string; // Comma-separated chain IDs (e.g., '1,56,137')
}
```

**Usage:**

```typescript
const response = await fetch('https://li.quest/v1/tokens?chains=1,56,137');
const tokens = await response.json();
```

#### GET /v1/token

Fetch information about a specific token.

```typescript
// Query parameters
interface TokenParams {
  chain: string; // Chain ID or key
  token: string; // Token address or symbol
}
```

**Usage:**

```typescript
const response = await fetch(
  'https://li.quest/v1/token?chain=1&token=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
);
const token = await response.json();
```

#### GET /v1/tools

Get available bridges and exchanges.

```typescript
// Response includes
interface Tools {
  bridges: Bridge[];
  exchanges: Exchange[];
}
```

**Usage:**

```typescript
const response = await fetch('https://li.quest/v1/tools');
const { bridges, exchanges } = await response.json();
```

#### GET /v1/connections

Get possible transfer routes between chains.

> [!NOTE]
> Large result set - filtering is **required** by at least one of: chain, token, bridge, or exchange.

```typescript
// Query parameters
interface ConnectionsParams {
  fromChain?: string; // Source chain ID
  toChain?: string; // Destination chain ID
  fromToken?: string; // Source token address
  toToken?: string; // Destination token address
}
```

**Usage:**

```typescript
const response = await fetch('https://li.quest/v1/connections?fromChain=1&toChain=137');
const connections = await response.json();
```

---

### Quote Endpoints

#### GET /v1/quote

Get a quote for a token transfer (single-step).

```typescript
// Query parameters (required)
interface QuoteParams {
  fromChain: string; // Source chain ID
  toChain: string; // Destination chain ID
  fromToken: string; // Source token address
  toToken: string; // Destination token address
  fromAddress: string; // Sender wallet address
  fromAmount: string; // Amount in smallest unit (wei)
}

// Response
interface QuoteResponse {
  transactionRequest: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  estimate: {
    toAmount: string; // Estimated output amount
    toAmountMin: string; // Guaranteed minimum (with slippage)
    approvalAddress: string;
    feeCosts: FeeCost[];
    gasCosts: GasCost[];
  };
}
```

**Usage:**

```typescript
const params = new URLSearchParams({
  fromChain: '1',
  toChain: '137',
  fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  toToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
  fromAddress: '0x...',
  fromAmount: '1000000', // 1 USDC (6 decimals)
});

const response = await fetch(`https://li.quest/v1/quote?${params}`);
const quote = await response.json();

// transactionRequest can be sent directly to wallet
```

#### GET /v1/quote/toAmount

Reverse quote - calculate `fromAmount` based on desired `toAmount`.

```typescript
// Query parameters (same as /quote but with toAmount instead of fromAmount)
interface ReverseQuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAddress: string;
  toAmount: string; // Desired output amount
}
```

---

### Advanced Routing

#### POST /v1/advanced/routes

Get multiple route options for complex transfers.

> [!TIP]
> Recommended for use via the [LI.FI SDK](https://docs.li.fi/integrate-li.fi-js-sdk/install-li.fi-sdk) for proper transaction handling.

```typescript
// Request body
interface RoutesRequest {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAddress: string;
  fromAmount: string;
  options?: {
    slippage?: number; // Default: 0.03 (3%)
    bridges?: string[]; // Filter specific bridges
    exchanges?: string[]; // Filter specific exchanges
  };
}
```

#### POST /v1/advanced/stepTransaction

Populate a route step with transaction data.

---

### Gas Endpoints

#### GET /v1/gas/prices/{chainId}

Get current gas prices for a specific chain.

```typescript
// Response
interface GasPrices {
  standard: string; // Standard gas price (gwei)
  fast: string; // Fast gas price
  instant: string; // Priority gas price
}
```

**Usage:**

```typescript
const response = await fetch('https://li.quest/v1/gas/prices/1');
const prices = await response.json();
```

#### GET /v1/gas/prices

Get gas prices for all enabled chains.

#### GET /v1/gas/suggestion/{chain}

Get gas amount suggestion based on average LI.FI transaction costs.

```typescript
// Query parameters (optional)
interface GasSuggestionParams {
  fromChain?: string; // If provided with fromToken, returns
  fromToken?: string; // amount of fromToken needed
}
```

---

### Status Tracking

#### GET /v1/status

Check the status of a cross-chain transfer.

> [!IMPORTANT]
> Returns `200 OK` even if the transaction cannot be found. This accounts for valid transactions that haven't been mined yet.

```typescript
// Query parameters
interface StatusParams {
  txHash: string; // Transaction hash
  fromChain?: string; // Speeds up the request if provided
  toChain?: string;
  bridge?: string;
}

// Response
interface StatusResponse {
  status: 'NOT_FOUND' | 'PENDING' | 'DONE' | 'FAILED';
  substatus?: string;
  receiving?: {
    txHash: string;
    amount: string;
  };
}
```

**Usage:**

```typescript
const response = await fetch(`https://li.quest/v1/status?txHash=${txHash}&fromChain=1`);
const status = await response.json();

if (status.status === 'DONE') {
  console.log('Transfer complete!', status.receiving);
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 404  | Not Found             |
| 429  | Rate Limited          |
| 500  | Internal Server Error |
| 502  | Bad Gateway           |

### API Error Codes

| Code | Name                            | Description                    |
| ---- | ------------------------------- | ------------------------------ |
| 1000 | `DefaultError`                  | Generic error                  |
| 1001 | `FailedToBuildTransactionError` | Could not build transaction    |
| 1002 | `NoQuoteError`                  | No quote available for request |
| 1003 | `NotFoundError`                 | Resource not found             |
| 1004 | `NotProcessableError`           | Request cannot be processed    |
| 1005 | `RateLimitError`                | Rate limit exceeded            |
| 1006 | `ServerError`                   | Internal server error          |
| 1007 | `SlippageError`                 | Slippage tolerance exceeded    |
| 1008 | `ThirdPartyError`               | Error from bridge/exchange     |
| 1009 | `TimeoutError`                  | Request timed out              |
| 1010 | `UnauthorizedError`             | Invalid or missing API key     |
| 1011 | `ValidationError`               | Invalid parameters             |
| 1012 | `RpcFailure`                    | Blockchain RPC error           |
| 1013 | `MalformedSchema`               | Invalid request format         |

### Tool-Specific Errors

These errors appear in the `ToolError` interface when a specific bridge or exchange fails:

| Error                               | Description                      |
| ----------------------------------- | -------------------------------- |
| `NO_POSSIBLE_ROUTE`                 | No route found for this transfer |
| `INSUFFICIENT_LIQUIDITY`            | Not enough liquidity available   |
| `TOOL_TIMEOUT`                      | Third-party tool timed out       |
| `RPC_ERROR`                         | Problem getting on-chain data    |
| `AMOUNT_TOO_LOW`                    | Below minimum transfer amount    |
| `AMOUNT_TOO_HIGH`                   | Exceeds maximum transfer amount  |
| `FEES_HIGHER_THAN_AMOUNT`           | Fees exceed the transfer amount  |
| `DIFFERENT_RECIPIENT_NOT_SUPPORTED` | Cannot send to different address |
| `TOOL_SPECIFIC_ERROR`               | Error from the bridge/exchange   |
| `CANNOT_GUARANTEE_MIN_AMOUNT`       | Cannot ensure minimum output     |

### Error Handling Example

```typescript
interface LifiError {
  code: number;
  message: string;
  toolErrors?: ToolError[];
}

async function fetchQuote(params: QuoteParams) {
  const response = await fetch(`https://li.quest/v1/quote?${new URLSearchParams(params)}`);

  if (!response.ok) {
    const error: LifiError = await response.json();

    switch (error.code) {
      case 1002: // NoQuoteError
        throw new Error('No route available for this transfer');
      case 1005: // RateLimitError
        throw new Error('Rate limit exceeded. Please try again later.');
      case 1011: // ValidationError
        throw new Error(`Invalid parameters: ${error.message}`);
      default:
        throw new Error(`LI.FI API error: ${error.message}`);
    }
  }

  return response.json();
}
```

---

## Integration Patterns

### Service Architecture

```text
src/app/core/
├── lifi/
│   ├── lifi-api.service.ts       # HTTP client for LI.FI API
│   ├── lifi-chains.service.ts    # Chain data caching
│   ├── lifi-quotes.service.ts    # Quote fetching
│   └── lifi-types.ts             # TypeScript interfaces
```

### Caching Strategy

Chain and token data changes infrequently. Cache this data to reduce API calls:

```typescript
@Injectable({ providedIn: 'root' })
export class LifiChainsService {
  readonly #http = inject(HttpClient);
  readonly #cache = signal<Chain[] | null>(null);
  readonly #cacheExpiry = signal<number>(0);

  readonly #CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getChains(): Promise<Chain[]> {
    const now = Date.now();

    if (this.#cache() && now < this.#cacheExpiry()) {
      return this.#cache()!;
    }

    const chains = await firstValueFrom(this.#http.get<Chain[]>('https://li.quest/v1/chains'));

    this.#cache.set(chains);
    this.#cacheExpiry.set(now + this.#CACHE_DURATION);

    return chains;
  }
}
```

### Polling for Status

Cross-chain transfers can take time. Poll the status endpoint:

```typescript
async function waitForTransfer(txHash: string, fromChain: string): Promise<StatusResponse> {
  const maxAttempts = 60; // 5 minutes at 5s intervals
  const pollInterval = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://li.quest/v1/status?txHash=${txHash}&fromChain=${fromChain}`,
    );
    const status = await response.json();

    if (status.status === 'DONE') {
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error('Transfer failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Transfer timeout');
}
```

---

## Project Usage Notes

### Relationship to Existing APIs

This project uses two APIs for different purposes:

| API               | Purpose                         | Documentation                      |
| ----------------- | ------------------------------- | ---------------------------------- |
| **conceal-wswap** | CCX <-> wCCX bridge operations  | [backend_api.md](./backend_api.md) |
| **LI.FI**         | Chain data, routing, gas prices | This document                      |

### Use Cases in This Project

1. **Chain Information:** Get current supported chains and their metadata
2. **Token Data:** Fetch token information across multiple networks
3. **Gas Prices:** Display current gas costs to users
4. **Future:** Cross-chain swaps and routing (if needed)

### Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  lifiApi: {
    baseUrl: 'https://li.quest/v1',
    // No API key needed for basic usage
  },
};
```

---

## Related Documentation

- [Backend API Guide](./backend_api.md) - conceal-wswap bridge API
- [Web3 Integrations](./web3_integrations.md) - Viem and wallet integration
- [Bridge Overview](./bridge_overview.md) - How the CCX bridge works
- [Error Handling](./error_handling.md) - Frontend error patterns

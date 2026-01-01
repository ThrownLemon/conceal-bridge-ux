import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import {
  createPublicClient,
  createWalletClient,
  custom,
  isAddress,
  type Address,
  type Chain,
  type Hash,
} from 'viem';
import { mainnet } from 'viem/chains';
// import { APP_CONFIG } from './app-config';

interface Eip1193Provider {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  disconnect?: () => Promise<void> | void;
  connect?: () => Promise<void> | void;
}

/**
 * Supported wallet connector identifiers.
 * - 'metamask': MetaMask browser extension
 * - 'trust': Trust Wallet browser extension
 * - 'binance': Binance Wallet browser extension
 */
export type WalletConnectorId = 'metamask' | 'trust' | 'binance';

type ProviderWithFlags = Eip1193Provider & {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isBinance?: boolean;
  isBinanceChain?: boolean;
};

/**
 * Service for managing EVM wallet connections and blockchain interactions.
 *
 * Provides wallet connection management, chain switching, transaction sending,
 * and state hydration for EVM-compatible wallets (MetaMask, Trust, Binance).
 *
 * @example
 * ```typescript
 * const wallet = inject(EvmWalletService);
 *
 * // Connect with specific wallet
 * await wallet.connectWith('metamask');
 *
 * // Check connection status
 * if (wallet.isConnected()) {
 *   console.log('Connected address:', wallet.address());
 * }
 *
 * // Switch to a specific chain before transaction
 * await wallet.ensureChain(bsc);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EvmWalletService {
  readonly #destroyRef = inject(DestroyRef);

  /** LocalStorage key used to persist the user's explicit disconnect action. */
  static readonly DISCONNECTED_STORAGE_KEY = 'conceal_bridge_wallet_disconnected';

  /** LocalStorage key used to persist the connected wallet connector type. */
  static readonly CONNECTOR_STORAGE_KEY = 'conceal_bridge_wallet_connector';

  readonly #address = signal<Address | null>(null);
  /**
   * The currently connected wallet address.
   * @returns The connected EVM address or null if not connected.
   */
  readonly address = this.#address.asReadonly();

  readonly #chainId = signal<number | null>(null);
  /**
   * The current chain ID the wallet is connected to.
   * @returns The chain ID number or null if not connected/unknown.
   */
  readonly chainId = this.#chainId.asReadonly();

  readonly #disconnectedByUser = signal(false);
  /**
   * Indicates whether the user explicitly disconnected their wallet.
   * Used to prevent auto-reconnection on page reload.
   * @returns True if user clicked disconnect, false otherwise.
   */
  readonly disconnectedByUser = this.#disconnectedByUser.asReadonly();

  readonly #connector = signal<WalletConnectorId | null>(null);
  /**
   * The currently active wallet connector type.
   * @returns The connector ID ('metamask', 'trust', 'binance') or null if not connected.
   */
  readonly connector = this.#connector.asReadonly();

  readonly #provider = signal<Eip1193Provider | null>(null);
  /**
   * The underlying EIP-1193 provider instance.
   * @returns The provider object or null if not available.
   */
  readonly provider = this.#provider.asReadonly();

  /**
   * Whether an injected EVM provider (window.ethereum) is available.
   * @returns True if window.ethereum exists, typically indicating MetaMask/Trust extension.
   */
  readonly hasInjectedProvider = computed(
    () => typeof window !== 'undefined' && !!(window as unknown as { ethereum?: unknown }).ethereum,
  );

  /**
   * Whether the Binance Wallet provider (window.BinanceChain) is available.
   * @returns True if Binance Wallet extension is installed.
   */
  readonly hasBinanceProvider = computed(
    () =>
      typeof window !== 'undefined' &&
      !!(window as unknown as { BinanceChain?: unknown }).BinanceChain,
  );

  /**
   * Legacy alias for hasInjectedProvider.
   * Indicates an injected EVM provider is present (MetaMask/Trust/Binance extension).
   * @returns True if any injected provider is detected.
   */
  readonly isInstalled = computed(() => this.hasInjectedProvider());

  /**
   * Whether a wallet is currently connected.
   * @returns True if an address is set, false otherwise.
   */
  readonly isConnected = computed(() => !!this.address());

  /**
   * A truncated version of the connected address for display purposes.
   * @returns Formatted address like "0x1234...5678" or empty string if not connected.
   */
  readonly shortAddress = computed(() => {
    const addr = this.address();
    if (!addr) return '';
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  });

  /**
   * Checks if a specific wallet connector is available in the browser.
   *
   * @param connector - The wallet connector type to check ('metamask', 'trust', 'binance').
   * @returns True if the specified wallet extension is detected.
   *
   * @example
   * ```typescript
   * if (walletService.isConnectorAvailable('metamask')) {
   *   await walletService.connectWith('metamask');
   * }
   * ```
   */
  isConnectorAvailable(connector: WalletConnectorId): boolean {
    if (connector === 'binance') return this.hasBinanceProvider();

    const injected = this.#injectedProvider();
    if (!injected) return false;

    if (connector === 'metamask') return !!injected.isMetaMask;

    // Trust Wallet desktop extension may not always set flags; treat "not MetaMask" as acceptable.
    if (connector === 'trust')
      return !!(injected.isTrust || injected.isTrustWallet) || !injected.isMetaMask;

    return false;
  }

  #detachListeners: (() => void) | null = null;

  constructor() {
    this.#disconnectedByUser.set(this.#readDisconnectedFlag());

    // Default to injected provider if present; no prompts should happen here.
    // Use skipPersist=true to avoid clearing stored connector before hydrate() reads it.
    const injected = this.#injectedProvider();
    if (injected) this.#setProvider(injected, null, true);

    // Best-practice: hydrate state without prompting.
    void this.hydrate();

    this.#destroyRef.onDestroy(() => {
      this.#detachListeners?.();
      this.#detachListeners = null;
    });
  }

  /**
   * Hydrates wallet state from the browser without triggering permission prompts.
   *
   * Uses eth_accounts and eth_chainId to restore connection state on page load.
   * Respects the user's disconnect preference stored in localStorage.
   *
   * @returns Promise that resolves when hydration is complete.
   *
   * @example
   * ```typescript
   * // Called automatically in constructor, but can be called manually
   * await walletService.hydrate();
   * ```
   */
  async hydrate(): Promise<void> {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) return;

    try {
      // Use mainnet as a fallback for walletClient.getAddresses() - it queries the provider directly
      // so the chain parameter is mainly for type checking
      const { walletClient } = this.getClients(mainnet, provider);
      // If user explicitly disconnected in-app, don't re-hydrate accounts on reload.
      // Many injected wallets keep `eth_accounts` authorized until the user removes the site connection in the wallet.
      if (!this.#disconnectedByUser()) {
        const accounts = await walletClient.getAddresses();
        this.#address.set(accounts[0] ?? null);

        // Restore the connector type from localStorage if we have an active connection
        if (accounts[0]) {
          const storedConnector = this.#readConnector();
          if (storedConnector) {
            this.#connector.set(storedConnector);
          }
        }
      } else {
        this.#address.set(null);
      }
      // Use refreshChainId() to avoid hardcoding mainnet and get the actual chain ID
      await this.refreshChainId();
    } catch {
      // Ignore – hydration should never hard-fail the app.
    }
  }

  /**
   * Connects to the default injected EVM wallet.
   *
   * Prompts the user to approve connection if not already authorized.
   * Clears any previous disconnect flag.
   *
   * @returns Promise resolving to the connected wallet address.
   * @throws Error if no injected wallet is detected or no account is returned.
   *
   * @example
   * ```typescript
   * try {
   *   const address = await walletService.connect();
   *   console.log('Connected:', address);
   * } catch (error) {
   *   console.error('Connection failed:', error.message);
   * }
   * ```
   */
  async connect(): Promise<Address> {
    this.#setDisconnectedFlag(false);
    // Backwards compatible default: best-effort injected provider.
    const injected = this.#injectedProvider();
    if (!injected) throw new Error('No injected EVM wallet detected.');
    this.#setProvider(injected, null);

    const { walletClient } = this.getClients(mainnet, injected);
    const accounts = await walletClient.requestAddresses();

    const account = accounts[0];
    if (!account) throw new Error('No account returned from wallet.');
    this.#address.set(account);

    await this.refreshChainId();
    return account;
  }

  /**
   * Connects to a specific wallet provider by connector type.
   *
   * Prompts the user to approve connection if not already authorized.
   * Use isConnectorAvailable() first to check if the wallet is installed.
   *
   * @param connector - The wallet connector type ('metamask', 'trust', 'binance').
   * @returns Promise resolving to the connected wallet address.
   * @throws Error if the specified wallet is not detected or no account is returned.
   *
   * @example
   * ```typescript
   * if (walletService.isConnectorAvailable('metamask')) {
   *   const address = await walletService.connectWith('metamask');
   *   console.log('Connected via MetaMask:', address);
   * }
   * ```
   */
  async connectWith(connector: WalletConnectorId): Promise<Address> {
    this.#setDisconnectedFlag(false);
    const provider = await this.#resolveProvider(connector);
    this.#setProvider(provider, connector);

    // WalletConnect's provider requires connect() before request() calls.

    const { walletClient } = this.getClients(mainnet, provider);
    const accounts = await walletClient.requestAddresses();

    const account = accounts[0];
    if (!account) throw new Error('No account returned from wallet.');
    this.#address.set(account);

    await this.refreshChainId();
    return account;
  }

  /**
   * Disconnects the currently connected wallet.
   *
   * Attempts to use ERC-7846 disconnect if supported by the wallet,
   * then falls back to provider.disconnect(). Persists the disconnect
   * state to localStorage to prevent auto-reconnection on page reload.
   *
   * @returns Promise that resolves when disconnection is complete.
   *
   * @example
   * ```typescript
   * await walletService.disconnect();
   * console.log('Wallet disconnected');
   * ```
   */
  async disconnect(): Promise<void> {
    const provider = this.#provider();
    try {
      // Prefer a real disconnect if the provider supports ERC-7846.
      // This prompts the wallet to revoke connection, when supported.
      if (provider) {
        try {
          const { walletClient } = this.getClients(mainnet, provider);
          const { erc7846Actions } = await import('viem/experimental');
          await walletClient.extend(erc7846Actions()).disconnect();
        } catch {
          // Ignore - not all wallets support ERC-7846 disconnect.
        }
      }

      await provider?.disconnect?.();
    } catch {
      // Ignore: not all providers implement disconnect.
    }
    this.#setDisconnectedFlag(true);
    this.#address.set(null);
    this.#chainId.set(null);
    this.#setConnector(null);
    /*
    // For WalletConnect, fully clear provider/session (real disconnect).
    if (connector === 'walletconnect') {
      this.#detachListeners?.();
      this.#detachListeners = null;
      this.#provider.set(null);
    }
    */
  }

  /**
   * Ensures the wallet is connected to the specified chain.
   *
   * Attempts to switch to the chain, and if the chain is not known to the wallet
   * (error code 4902), adds it first then switches.
   *
   * @param chain - The Viem chain object to switch to (e.g., mainnet, bsc, polygon).
   * @returns Promise that resolves when chain switch is complete.
   * @throws Error if no wallet provider is available or chain switch fails.
   *
   * @example
   * ```typescript
   * import { bsc } from 'viem/chains';
   *
   * await walletService.ensureChain(bsc);
   * // Wallet is now on BSC, ready for transactions
   * ```
   */
  async ensureChain(chain: Chain): Promise<void> {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) throw new Error('No EVM wallet provider available.');

    const { walletClient } = this.getClients(chain, provider);
    try {
      await walletClient.switchChain({ id: chain.id });
    } catch (err: unknown) {
      // MetaMask uses 4902 when a chain is missing.
      const code = (err as { code?: number }).code;
      if (code !== 4902) throw err;

      await walletClient.addChain({ chain });
      await walletClient.switchChain({ id: chain.id });
    } finally {
      await this.refreshChainId();
    }
  }

  /**
   * Prompts the wallet to track/watch an ERC-20 token.
   *
   * Adds the token to the user's wallet UI for easy balance viewing.
   *
   * @param params - Token parameters.
   * @param params.address - The token contract address.
   * @param params.symbol - The token symbol (e.g., 'wCCX').
   * @param params.decimals - The token decimals (e.g., 6).
   * @param params.image - Optional URL to the token icon.
   * @returns Promise resolving to true if the token was added successfully.
   * @throws Error if no wallet provider is available.
   *
   * @example
   * ```typescript
   * await walletService.watchErc20Asset({
   *   address: '0x...',
   *   symbol: 'wCCX',
   *   decimals: 6,
   * });
   * ```
   */
  async watchErc20Asset(params: {
    address: Address;
    symbol: string;
    decimals: number;
    image?: string;
  }) {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) throw new Error('No EVM wallet provider available.');
    const { walletClient } = this.getClients(mainnet, provider);
    return await walletClient.watchAsset({
      type: 'ERC20',
      options: params,
    });
  }

  /**
   * Creates Viem wallet and public clients for blockchain interactions.
   *
   * @param chain - The Viem chain object to create clients for.
   * @param provider - Optional EIP-1193 provider. Defaults to the current provider.
   * @returns Object containing walletClient and publicClient.
   * @throws Error if no provider is available.
   *
   * @example
   * ```typescript
   * import { bsc } from 'viem/chains';
   *
   * const { walletClient, publicClient } = walletService.getClients(bsc);
   *
   * // Use publicClient for read operations
   * const balance = await publicClient.getBalance({ address });
   *
   * // Use walletClient for write operations
   * const hash = await walletClient.sendTransaction({ ... });
   * ```
   */
  getClients(chain: Chain, provider?: Eip1193Provider) {
    const p = provider ?? this.#provider() ?? this.#injectedProvider();
    if (!p) throw new Error('No EVM wallet provider available.');

    const transport = custom(p as never);
    const walletClient = createWalletClient({ chain, transport });
    const publicClient = createPublicClient({ chain, transport });

    return { walletClient, publicClient };
  }

  /**
   * Sends a native token transaction (ETH, BNB, MATIC).
   *
   * Connects the wallet if not already connected. Does NOT automatically
   * switch chains - use ensureChain() first.
   *
   * @param params - Transaction parameters.
   * @param params.chain - The chain to send the transaction on.
   * @param params.to - The recipient address.
   * @param params.value - The amount to send in wei (as BigInt).
   * @param params.data - Optional hex-encoded calldata.
   * @returns Promise resolving to the transaction hash.
   * @throws Error if no wallet provider is available.
   *
   * @example
   * ```typescript
   * import { bsc } from 'viem/chains';
   * import { parseEther } from 'viem';
   *
   * await walletService.ensureChain(bsc);
   * const hash = await walletService.sendNativeTransaction({
   *   chain: bsc,
   *   to: '0x...',
   *   value: parseEther('0.1'),
   * });
   * ```
   */
  async sendNativeTransaction(params: {
    chain: Chain;
    to: Address;
    value: bigint;
    data?: `0x${string}`;
  }): Promise<Hash> {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) throw new Error('No EVM wallet provider available.');

    const account = this.address() ?? (await this.connect());
    const { walletClient } = this.getClients(params.chain, provider);
    return await walletClient.sendTransaction({
      account,
      chain: params.chain,
      data: params.data ?? '0x',
      to: params.to,
      value: params.value,
    });
  }

  /**
   * Waits for a transaction to be confirmed on-chain.
   *
   * @param params - Wait parameters.
   * @param params.chain - The chain the transaction was sent on.
   * @param params.hash - The transaction hash to wait for.
   * @param params.confirmations - Number of block confirmations required.
   * @returns Promise resolving to the transaction receipt.
   * @throws Error if no wallet provider is available or transaction fails.
   *
   * @example
   * ```typescript
   * const receipt = await walletService.waitForReceipt({
   *   chain: bsc,
   *   hash: '0x...',
   *   confirmations: 3,
   * });
   * console.log('Transaction confirmed:', receipt.status);
   * ```
   */
  async waitForReceipt(params: { chain: Chain; hash: Hash; confirmations: number }) {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) throw new Error('No EVM wallet provider available.');
    const { publicClient } = this.getClients(params.chain, provider);
    return await publicClient.waitForTransactionReceipt({
      hash: params.hash,
      confirmations: params.confirmations,
    });
  }

  /**
   * Refreshes the current chain ID from the wallet provider.
   *
   * Updates the chainId signal with the current network. Called automatically
   * after connect, ensureChain, and hydrate operations.
   *
   * @returns Promise that resolves when chain ID is updated.
   *
   * @example
   * ```typescript
   * await walletService.refreshChainId();
   * console.log('Current chain:', walletService.chainId());
   * ```
   */
  async refreshChainId(): Promise<void> {
    try {
      const provider = this.#provider() ?? this.#injectedProvider();
      if (!provider) return;
      // Query chain ID directly from provider to avoid hardcoding mainnet
      // This works regardless of which chain the user is actually connected to
      const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
      const chainId = Number.parseInt(chainIdHex, 16);
      if (Number.isFinite(chainId) && chainId > 0) {
        this.#chainId.set(chainId);
      }
    } catch {
      // Ignore – wallet might not be available yet.
    }
  }

  #injectedProvider(): ProviderWithFlags | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { ethereum?: ProviderWithFlags };
    return w.ethereum ?? null;
  }

  #binanceProvider(): ProviderWithFlags | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { BinanceChain?: ProviderWithFlags };
    return w.BinanceChain ?? null;
  }

  async #resolveProvider(connector: WalletConnectorId): Promise<Eip1193Provider> {
    if (connector === 'binance') {
      const binance = this.#binanceProvider();
      if (!binance) throw new Error('Binance Wallet not detected in this browser.');
      return binance;
    }

    // metamask / trust use injected provider
    const injected = this.#injectedProvider();
    if (!injected) throw new Error('No injected EVM wallet detected.');

    if (connector === 'metamask' && !injected.isMetaMask) {
      throw new Error('MetaMask not detected. Please install MetaMask or choose another wallet.');
    }

    if (connector === 'trust' && !(injected.isTrust || injected.isTrustWallet)) {
      // Trust on desktop is often injected without flags; prefer letting it work.
      // Only hard-fail if it's clearly MetaMask-only.
      if (injected.isMetaMask) {
        throw new Error(
          'Trust Wallet not detected. Please install Trust Wallet or choose another wallet.',
        );
      }
    }

    return injected;
  }

  #setProvider(
    provider: Eip1193Provider,
    connector: WalletConnectorId | null,
    skipPersist = false,
  ): void {
    this.#detachListeners?.();
    this.#detachListeners = null;

    this.#provider.set(provider);
    if (skipPersist) {
      // Only update signal, don't touch localStorage (used during initial setup)
      this.#connector.set(connector);
    } else {
      this.#setConnector(connector);
    }

    const onAccountsChanged = (args: unknown) => {
      const accounts = args as string[];
      if (!accounts || accounts.length === 0) {
        this.#address.set(null);
        return;
      }
      const next = accounts[0];
      this.#address.set(next && isAddress(next) ? (next as Address) : null);
    };

    const onChainChanged = (chainIdHex: unknown) => {
      const id = Number.parseInt(chainIdHex as string, 16);
      this.#chainId.set(Number.isFinite(id) ? id : null);
    };

    provider.on?.('accountsChanged', onAccountsChanged);
    provider.on?.('chainChanged', onChainChanged);

    this.#detachListeners = () => {
      provider.removeListener?.('accountsChanged', onAccountsChanged);
      provider.removeListener?.('chainChanged', onChainChanged);
    };
  }

  #readDisconnectedFlag(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(EvmWalletService.DISCONNECTED_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  #setDisconnectedFlag(value: boolean): void {
    this.#disconnectedByUser.set(value);
    if (typeof window === 'undefined') return;
    try {
      if (value) window.localStorage.setItem(EvmWalletService.DISCONNECTED_STORAGE_KEY, '1');
      else window.localStorage.removeItem(EvmWalletService.DISCONNECTED_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  #readConnector(): WalletConnectorId | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem(EvmWalletService.CONNECTOR_STORAGE_KEY);
      if (stored === 'metamask' || stored === 'trust' || stored === 'binance') {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  }

  #setConnector(connector: WalletConnectorId | null): void {
    this.#connector.set(connector);
    if (typeof window === 'undefined') return;
    try {
      if (connector) {
        window.localStorage.setItem(EvmWalletService.CONNECTOR_STORAGE_KEY, connector);
      } else {
        window.localStorage.removeItem(EvmWalletService.CONNECTOR_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }
}

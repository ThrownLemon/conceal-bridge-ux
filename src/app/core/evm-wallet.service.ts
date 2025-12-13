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
import { APP_CONFIG } from './app-config';

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
  disconnect?: () => Promise<void> | void;
  connect?: () => Promise<void> | void;
};

export type WalletConnectorId = 'metamask' | 'trust' | 'binance';

type ProviderWithFlags = Eip1193Provider & {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isBinance?: boolean;
  isBinanceChain?: boolean;
};

@Injectable({ providedIn: 'root' })
export class EvmWalletService {
  readonly #destroyRef = inject(DestroyRef);
  readonly #appConfig = inject(APP_CONFIG);

  static readonly DISCONNECTED_STORAGE_KEY = 'conceal_bridge_wallet_disconnected';

  readonly #address = signal<Address | null>(null);
  readonly address = this.#address.asReadonly();

  readonly #chainId = signal<number | null>(null);
  readonly chainId = this.#chainId.asReadonly();

  readonly #disconnectedByUser = signal(false);
  readonly disconnectedByUser = this.#disconnectedByUser.asReadonly();

  readonly #connector = signal<WalletConnectorId | null>(null);
  readonly connector = this.#connector.asReadonly();

  readonly #provider = signal<Eip1193Provider | null>(null);
  readonly provider = this.#provider.asReadonly();

  readonly hasInjectedProvider = computed(
    () => typeof window !== 'undefined' && !!(window as unknown as { ethereum?: unknown }).ethereum,
  );
  readonly hasBinanceProvider = computed(
    () => typeof window !== 'undefined' && !!(window as unknown as { BinanceChain?: unknown }).BinanceChain,
  );



  /**
   * Legacy name used across the app: indicates an injected EVM provider is present.
   * (MetaMask / Trust / Binance Wallet browser extension typically expose this.)
   */
  readonly isInstalled = computed(() => this.hasInjectedProvider());
  readonly isConnected = computed(() => !!this.address());

  readonly shortAddress = computed(() => {
    const addr = this.address();
    if (!addr) return '';
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  });

  isConnectorAvailable(connector: WalletConnectorId): boolean {

    if (connector === 'binance') return this.hasBinanceProvider();

    const injected = this.#injectedProvider();
    if (!injected) return false;

    if (connector === 'metamask') return !!injected.isMetaMask;

    // Trust Wallet desktop extension may not always set flags; treat "not MetaMask" as acceptable.
    if (connector === 'trust') return !!(injected.isTrust || injected.isTrustWallet) || !injected.isMetaMask;

    return false;
  }

  #detachListeners: (() => void) | null = null;

  constructor() {
    this.#disconnectedByUser.set(this.#readDisconnectedFlag());

    // Default to injected provider if present; no prompts should happen here.
    const injected = this.#injectedProvider();
    if (injected) this.#setProvider(injected, null);

    // Best-practice: hydrate state without prompting.
    void this.hydrate();

    this.#destroyRef.onDestroy(() => {
      this.#detachListeners?.();
      this.#detachListeners = null;
    });
  }

  /**
   * Hydrate wallet state without triggering any wallet permission prompts.
   * Uses `getAddresses` (eth_accounts) + `getChainId` (eth_chainId).
   */
  async hydrate(): Promise<void> {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) return;

    try {
      const { walletClient, publicClient } = this.getClients(mainnet, provider);
      // If user explicitly disconnected in-app, don't re-hydrate accounts on reload.
      // Many injected wallets keep `eth_accounts` authorized until the user removes the site connection in the wallet.
      if (!this.#disconnectedByUser()) {
        const accounts = await walletClient.getAddresses();
        this.#address.set(accounts[0] ?? null);
      } else {
        this.#address.set(null);
      }
      this.#chainId.set(await publicClient.getChainId());
    } catch {
      // Ignore – hydration should never hard-fail the app.
    }
  }

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

  async disconnect(): Promise<void> {
    const provider = this.#provider();
    const connector = this.#connector();
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
    this.#connector.set(null);
    /*
    // For WalletConnect, fully clear provider/session (real disconnect).
    if (connector === 'walletconnect') {
      this.#detachListeners?.();
      this.#detachListeners = null;
      this.#provider.set(null);
    }
    */
  }

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

  async watchErc20Asset(params: { address: Address; symbol: string; decimals: number; image?: string }) {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) throw new Error('No EVM wallet provider available.');
    const { walletClient } = this.getClients(mainnet, provider);
    return await walletClient.watchAsset({
      type: 'ERC20',
      options: params,
    });
  }

  getClients(chain: Chain, provider?: Eip1193Provider) {
    const p = provider ?? this.#provider() ?? this.#injectedProvider();
    if (!p) throw new Error('No EVM wallet provider available.');

    const transport = custom(p as any);
    const walletClient = createWalletClient({ chain, transport });
    const publicClient = createPublicClient({ chain, transport });

    return { walletClient, publicClient };
  }

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

  async waitForReceipt(params: { chain: Chain; hash: Hash; confirmations: number }) {
    const provider = this.#provider() ?? this.#injectedProvider();
    if (!provider) throw new Error('No EVM wallet provider available.');
    const { publicClient } = this.getClients(params.chain, provider);
    return await publicClient.waitForTransactionReceipt({
      hash: params.hash,
      confirmations: params.confirmations,
    });
  }

  async refreshChainId(): Promise<void> {
    try {
      const provider = this.#provider() ?? this.#injectedProvider();
      if (!provider) return;
      const { publicClient } = this.getClients(mainnet, provider);
      this.#chainId.set(await publicClient.getChainId());
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
        throw new Error('Trust Wallet not detected. Please install Trust Wallet or choose another wallet.');
      }
    }

    return injected;
  }

  #setProvider(provider: Eip1193Provider, connector: WalletConnectorId | null): void {
    this.#detachListeners?.();
    this.#detachListeners = null;

    this.#provider.set(provider);
    this.#connector.set(connector);

    const onAccountsChanged = (accounts: string[]) => {
      if (this.#disconnectedByUser()) {
        this.#address.set(null);
        return;
      }
      const next = accounts[0];
      this.#address.set(next && isAddress(next) ? (next as Address) : null);
    };

    const onChainChanged = (chainIdHex: string) => {
      const id = Number.parseInt(chainIdHex, 16);
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
}



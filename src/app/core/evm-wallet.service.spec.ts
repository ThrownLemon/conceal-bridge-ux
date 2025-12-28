import { TestBed } from '@angular/core/testing';
import { mainnet, bsc } from 'viem/chains';

import { EvmWalletService } from './evm-wallet.service';

// Mock EIP-1193 provider interface matching the service's internal type
interface MockProvider {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  disconnect?: () => Promise<void> | void;
  isMetaMask?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isBinance?: boolean;
}

describe('EvmWalletService', () => {
  let service: EvmWalletService;
  let mockProvider: MockProvider;
  let mockBinanceProvider: MockProvider;
  let originalWindow: typeof globalThis.window;
  let accountsChangedHandler: ((accounts: string[]) => void) | null = null;
  let chainChangedHandler: ((chainId: string) => void) | null = null;

  const mockAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockAddress2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const;

  function createMockProvider(flags: Partial<MockProvider> = {}): MockProvider {
    const provider: MockProvider = {
      request: vi.fn().mockImplementation(async (args: { method: string; params?: unknown[] }) => {
        switch (args.method) {
          case 'eth_chainId':
            return '0x1'; // mainnet
          case 'eth_accounts':
            return [];
          case 'eth_requestAccounts':
            return [mockAddress];
          case 'wallet_switchEthereumChain':
            return null;
          case 'wallet_addEthereumChain':
            return null;
          case 'wallet_watchAsset':
            return true;
          case 'eth_sendTransaction':
            return '0xhash123';
          default:
            return null;
        }
      }),
      on: vi.fn().mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        if (event === 'accountsChanged') {
          accountsChangedHandler = handler as (accounts: string[]) => void;
        } else if (event === 'chainChanged') {
          chainChangedHandler = handler as (chainId: string) => void;
        }
      }),
      removeListener: vi.fn(),
      disconnect: vi.fn(),
      ...flags,
    };
    return provider;
  }

  function setupWindow(
    ethereum: MockProvider | null = null,
    binanceChain: MockProvider | null = null,
  ): void {
    Object.defineProperty(globalThis, 'window', {
      value: {
        ethereum,
        BinanceChain: binanceChain,
        localStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });
  }

  // Helper to get the mock from a provider method
  function asMock(fn: unknown): ReturnType<typeof vi.fn> {
    return fn as ReturnType<typeof vi.fn>;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    originalWindow = globalThis.window;
    accountsChangedHandler = null;
    chainChangedHandler = null;

    mockProvider = createMockProvider({ isMetaMask: true });
    mockBinanceProvider = createMockProvider({ isBinance: true });

    // Default: no provider, clean localStorage
    setupWindow(null, null);
    asMock(window.localStorage.getItem).mockReturnValue(null);

    TestBed.configureTestingModule({
      providers: [EvmWalletService],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  describe('initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(EvmWalletService);
      expect(service).toBeTruthy();
    });

    it('should start with null address', () => {
      service = TestBed.inject(EvmWalletService);
      expect(service.address()).toBeNull();
    });

    it('should start with null chainId', () => {
      service = TestBed.inject(EvmWalletService);
      expect(service.chainId()).toBeNull();
    });

    it('should read disconnected flag from localStorage on init', () => {
      asMock(window.localStorage.getItem).mockReturnValue('1');
      service = TestBed.inject(EvmWalletService);
      expect(service.disconnectedByUser()).toBe(true);
    });

    it('should default disconnectedByUser to false when no flag', () => {
      service = TestBed.inject(EvmWalletService);
      expect(service.disconnectedByUser()).toBe(false);
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      service = TestBed.inject(EvmWalletService);
    });

    it('hasInjectedProvider should return false when no ethereum', () => {
      expect(service.hasInjectedProvider()).toBe(false);
    });

    it('hasInjectedProvider should return true when ethereum exists', () => {
      setupWindow(mockProvider);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.hasInjectedProvider()).toBe(true);
    });

    it('hasBinanceProvider should return false when no BinanceChain', () => {
      expect(service.hasBinanceProvider()).toBe(false);
    });

    it('hasBinanceProvider should return true when BinanceChain exists', () => {
      setupWindow(null, mockBinanceProvider);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.hasBinanceProvider()).toBe(true);
    });

    it('isInstalled should mirror hasInjectedProvider', () => {
      expect(service.isInstalled()).toBe(service.hasInjectedProvider());
    });

    it('isConnected should return false when no address', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('shortAddress should return empty string when no address', () => {
      expect(service.shortAddress()).toBe('');
    });
  });

  describe('isConnectorAvailable', () => {
    it('should return false for metamask when no injected provider', () => {
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('metamask')).toBe(false);
    });

    it('should return true for metamask when isMetaMask flag is set', () => {
      setupWindow(createMockProvider({ isMetaMask: true }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('metamask')).toBe(true);
    });

    it('should return false for metamask when isMetaMask is false', () => {
      setupWindow(createMockProvider({ isMetaMask: false }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('metamask')).toBe(false);
    });

    it('should return true for trust when isTrust flag is set', () => {
      setupWindow(createMockProvider({ isTrust: true }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('trust')).toBe(true);
    });

    it('should return true for trust when isTrustWallet flag is set', () => {
      setupWindow(createMockProvider({ isTrustWallet: true }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('trust')).toBe(true);
    });

    it('should return true for trust when not MetaMask (fallback)', () => {
      setupWindow(createMockProvider({ isMetaMask: false }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('trust')).toBe(true);
    });

    it('should return false for binance when no BinanceChain', () => {
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('binance')).toBe(false);
    });

    it('should return true for binance when BinanceChain exists', () => {
      setupWindow(null, mockBinanceProvider);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
      expect(service.isConnectorAvailable('binance')).toBe(true);
    });
  });

  describe('hydrate', () => {
    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [mockAddress];
        return null;
      });
    });

    it('should not set address when disconnectedByUser is true', async () => {
      asMock(window.localStorage.getItem).mockReturnValue('1');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      // Wait for hydrate to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.address()).toBeNull();
    });

    it('should set address when disconnectedByUser is false', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      // Wait for hydrate to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.address()).toBe(mockAddress);
    });

    it('should set chainId from provider', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.chainId()).toBe(1);
    });

    it('should not fail when no provider available', async () => {
      setupWindow(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.hydrate()).resolves.not.toThrow();
    });

    it('should silently handle hydration errors', async () => {
      asMock(mockProvider.request).mockRejectedValue(new Error('Provider error'));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.hydrate()).resolves.not.toThrow();
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [];
        if (args.method === 'eth_requestAccounts') return [mockAddress];
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should request addresses from wallet', async () => {
      await service.connect();
      expect(asMock(mockProvider.request)).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'eth_requestAccounts' }),
      );
    });

    it('should set address after connect', async () => {
      const result = await service.connect();
      expect(result).toBe(mockAddress);
      expect(service.address()).toBe(mockAddress);
    });

    it('should clear disconnected flag on connect', async () => {
      await service.connect();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        EvmWalletService.DISCONNECTED_STORAGE_KEY,
      );
    });

    it('should throw when no injected provider', async () => {
      setupWindow(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.connect()).rejects.toThrow('No injected EVM wallet detected.');
    });

    it('should throw when no account returned', async () => {
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [];
        if (args.method === 'eth_requestAccounts') return [];
        return null;
      });
      await expect(service.connect()).rejects.toThrow('No account returned from wallet.');
    });

    it('should update isConnected after connect', async () => {
      expect(service.isConnected()).toBe(false);
      await service.connect();
      expect(service.isConnected()).toBe(true);
    });

    it('should update shortAddress after connect', async () => {
      await service.connect();
      expect(service.shortAddress()).toBe('0x1234…7890');
    });
  });

  describe('connectWith', () => {
    beforeEach(() => {
      setupWindow(mockProvider, mockBinanceProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [];
        if (args.method === 'eth_requestAccounts') return [mockAddress];
        return null;
      });
      asMock(mockBinanceProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x38';
        if (args.method === 'eth_accounts') return [];
        if (args.method === 'eth_requestAccounts') return [mockAddress];
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should connect with metamask', async () => {
      const result = await service.connectWith('metamask');
      expect(result).toBe(mockAddress);
      expect(service.connector()).toBe('metamask');
    });

    it('should connect with binance provider', async () => {
      const result = await service.connectWith('binance');
      expect(result).toBe(mockAddress);
      expect(service.connector()).toBe('binance');
    });

    it('should throw when MetaMask not detected for metamask connector', async () => {
      setupWindow(createMockProvider({ isMetaMask: false }), mockBinanceProvider);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.connectWith('metamask')).rejects.toThrow(
        'MetaMask not detected. Please install MetaMask or choose another wallet.',
      );
    });

    it('should throw when Binance Wallet not detected', async () => {
      setupWindow(mockProvider, null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.connectWith('binance')).rejects.toThrow(
        'Binance Wallet not detected in this browser.',
      );
    });

    it('should throw when Trust not detected and MetaMask is present', async () => {
      setupWindow(createMockProvider({ isMetaMask: true, isTrust: false }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.connectWith('trust')).rejects.toThrow(
        'Trust Wallet not detected. Please install Trust Wallet or choose another wallet.',
      );
    });
  });

  describe('disconnect', () => {
    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [];
        if (args.method === 'eth_requestAccounts') return [mockAddress];
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should clear address on disconnect', async () => {
      await service.connect();
      expect(service.address()).toBe(mockAddress);

      await service.disconnect();
      expect(service.address()).toBeNull();
    });

    it('should clear chainId on disconnect', async () => {
      await service.connect();
      await service.disconnect();
      expect(service.chainId()).toBeNull();
    });

    it('should clear connector on disconnect', async () => {
      await service.connectWith('metamask');
      expect(service.connector()).toBe('metamask');

      await service.disconnect();
      expect(service.connector()).toBeNull();
    });

    it('should set disconnected flag in localStorage', async () => {
      await service.connect();
      await service.disconnect();

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        EvmWalletService.DISCONNECTED_STORAGE_KEY,
        '1',
      );
    });

    it('should update isConnected to false', async () => {
      await service.connect();
      expect(service.isConnected()).toBe(true);

      await service.disconnect();
      expect(service.isConnected()).toBe(false);
    });

    it('should handle disconnect when provider has no disconnect method', async () => {
      const providerWithoutDisconnect = createMockProvider({ isMetaMask: true });
      delete providerWithoutDisconnect.disconnect;
      setupWindow(providerWithoutDisconnect);
      asMock(providerWithoutDisconnect.request).mockImplementation(
        async (args: { method: string }) => {
          if (args.method === 'eth_chainId') return '0x1';
          if (args.method === 'eth_accounts') return [];
          if (args.method === 'eth_requestAccounts') return [mockAddress];
          return null;
        },
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await service.connect();
      await expect(service.disconnect()).resolves.not.toThrow();
    });
  });

  describe('ensureChain', () => {
    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [mockAddress];
        if (args.method === 'wallet_switchEthereumChain') return null;
        if (args.method === 'wallet_addEthereumChain') return null;
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should call switchChain with target chain id', async () => {
      await service.ensureChain(bsc);
      expect(asMock(mockProvider.request)).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        }),
      );
    });

    it('should add chain when switch fails with 4902', async () => {
      let switchCount = 0;
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x38';
        if (args.method === 'wallet_switchEthereumChain') {
          switchCount++;
          if (switchCount === 1) {
            const error = new Error('Chain not added') as Error & { code: number };
            error.code = 4902;
            throw error;
          }
          return null;
        }
        if (args.method === 'wallet_addEthereumChain') return null;
        return null;
      });

      await service.ensureChain(bsc);

      expect(asMock(mockProvider.request)).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'wallet_addEthereumChain' }),
      );
    });

    it('should rethrow non-4902 errors', async () => {
      const error = new Error('User rejected') as Error & { code: number };
      error.code = 4001;
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'wallet_switchEthereumChain') throw error;
        return null;
      });

      await expect(service.ensureChain(bsc)).rejects.toThrow('User rejected');
    });

    it('should throw when no provider available', async () => {
      setupWindow(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.ensureChain(mainnet)).rejects.toThrow(
        'No EVM wallet provider available.',
      );
    });

    it('should refresh chainId after switch', async () => {
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x38';
        if (args.method === 'wallet_switchEthereumChain') return null;
        return null;
      });
      await service.ensureChain(bsc);
      expect(service.chainId()).toBe(56);
    });
  });

  describe('sendNativeTransaction', () => {
    const txParams = {
      chain: mainnet,
      to: mockAddress2,
      value: BigInt(1000000000000000000),
      data: '0x' as const,
    };

    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [mockAddress];
        if (args.method === 'eth_requestAccounts') return [mockAddress];
        if (args.method === 'eth_sendTransaction') return '0xhash123';
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should send transaction and return hash', async () => {
      await service.connect();
      const hash = await service.sendNativeTransaction(txParams);

      expect(hash).toBe('0xhash123');
      expect(asMock(mockProvider.request)).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'eth_sendTransaction' }),
      );
    });

    it('should auto-connect if not connected', async () => {
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [];
        if (args.method === 'eth_requestAccounts') return [mockAddress];
        if (args.method === 'eth_sendTransaction') return '0xhash123';
        return null;
      });

      const hash = await service.sendNativeTransaction(txParams);

      expect(asMock(mockProvider.request)).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'eth_requestAccounts' }),
      );
      expect(hash).toBe('0xhash123');
    });

    it('should throw when no provider available', async () => {
      setupWindow(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.sendNativeTransaction(txParams)).rejects.toThrow(
        'No EVM wallet provider available.',
      );
    });
  });

  describe('getClients', () => {
    beforeEach(() => {
      setupWindow(mockProvider);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should return walletClient and publicClient', () => {
      const { walletClient, publicClient } = service.getClients(mainnet, mockProvider);
      expect(walletClient).toBeDefined();
      expect(publicClient).toBeDefined();
    });

    it('should throw when no provider available', () => {
      setupWindow(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      expect(() => service.getClients(mainnet)).toThrow('No EVM wallet provider available.');
    });
  });

  describe('watchErc20Asset', () => {
    const assetParams = {
      address: mockAddress,
      symbol: 'wCCX',
      decimals: 6,
      image: 'https://example.com/icon.png',
    };

    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [mockAddress];
        if (args.method === 'wallet_watchAsset') return true;
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should call watchAsset with ERC20 type', async () => {
      await service.watchErc20Asset(assetParams);

      expect(asMock(mockProvider.request)).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'wallet_watchAsset',
        }),
      );
    });

    it('should throw when no provider available', async () => {
      setupWindow(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.watchErc20Asset(assetParams)).rejects.toThrow(
        'No EVM wallet provider available.',
      );
    });
  });

  describe('refreshChainId', () => {
    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x38';
        if (args.method === 'eth_accounts') return [];
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should update chainId from provider', async () => {
      await service.refreshChainId();
      expect(service.chainId()).toBe(56); // BSC
    });

    it('should handle invalid chainId gracefully', async () => {
      asMock(mockProvider.request).mockResolvedValue('invalid');
      await service.refreshChainId();
      // Should not throw, chainId might be NaN which gets filtered
    });

    it('should not fail when no provider', async () => {
      setupWindow(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);

      await expect(service.refreshChainId()).resolves.not.toThrow();
    });
  });

  describe('event listeners', () => {
    beforeEach(() => {
      setupWindow(mockProvider);
      asMock(mockProvider.request).mockImplementation(async (args: { method: string }) => {
        if (args.method === 'eth_chainId') return '0x1';
        if (args.method === 'eth_accounts') return [];
        if (args.method === 'eth_requestAccounts') return [mockAddress];
        return null;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [EvmWalletService] });
      service = TestBed.inject(EvmWalletService);
    });

    it('should attach listeners on connect', async () => {
      await service.connect();
      expect(asMock(mockProvider.on)).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
      expect(asMock(mockProvider.on)).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });

    it('should update address on accountsChanged event', async () => {
      await service.connect();

      // Simulate account change
      if (accountsChangedHandler) {
        accountsChangedHandler([mockAddress2]);
      }
      expect(service.address()).toBe(mockAddress2);
    });

    it('should clear address when accounts become empty', async () => {
      await service.connect();

      if (accountsChangedHandler) {
        accountsChangedHandler([]);
      }
      expect(service.address()).toBeNull();
    });

    it('should update chainId on chainChanged event', async () => {
      await service.connect();

      if (chainChangedHandler) {
        chainChangedHandler('0x89'); // Polygon
      }
      expect(service.chainId()).toBe(137);
    });
  });

  describe('DISCONNECTED_STORAGE_KEY', () => {
    it('should have correct storage key value', () => {
      expect(EvmWalletService.DISCONNECTED_STORAGE_KEY).toBe('conceal_bridge_wallet_disconnected');
    });
  });
});

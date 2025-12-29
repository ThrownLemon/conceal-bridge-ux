import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwapPage } from './swap.page';
import { BridgeApiService } from '../../core/bridge-api.service';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { TransactionHistoryService } from '../../core/transaction-history.service';
import { ActivatedRoute, convertToParamMap, type ParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import type { BridgeChainConfig, BridgeSwapStateResponse } from '../../core/bridge-types';
import { bsc } from 'viem/chains';
import { signal, type WritableSignal } from '@angular/core';
import type { Mock } from 'vitest';

interface ApiServiceMock {
  getChainConfig: Mock;
  hydrate: Mock;
  getCcxSwapBalance: Mock;
  getWccxSwapBalance: Mock;
  estimateGasPrice: Mock;
  getGasPrice: Mock;
  sendCcxToWccxInit: Mock;
  sendWccxToCcxInit: Mock;
  execWccxToCcxSwap: Mock;
  checkSwapState: Mock;
}

interface WalletServiceMock {
  address: WritableSignal<`0x${string}` | null>;
  isConnected: WritableSignal<boolean>;
  isConnectorAvailable: Mock;
  addToken: Mock;
  watchErc20Asset: Mock;
  ensureChain: Mock;
  hydrate: Mock;
  disconnectedByUser: Mock;
  chainId: Mock;
  connector: Mock;
  provider: Mock;
  hasInjectedProvider: Mock;
  hasBinanceProvider: Mock;
  isInstalled: Mock;
  shortAddress: Mock;
  connect: Mock;
  sendNativeTransaction: Mock;
  waitForReceipt: Mock;
  getClients: Mock;
}

interface HistoryServiceMock {
  refresh: Mock;
  addTransaction: Mock;
}

describe('SwapPage', () => {
  let component: SwapPage;
  let fixture: ComponentFixture<SwapPage>;
  let apiMock: ApiServiceMock;
  let walletMock: WalletServiceMock;
  let historyMock: HistoryServiceMock;
  let routeParamMap$: BehaviorSubject<ParamMap>;

  const mockConfig: BridgeChainConfig = {
    common: {
      minSwapAmount: 1,
      maxSwapAmount: 1000,
    },
    ccx: {
      accountAddress: 'ccxTestAddress123',
      units: 1000000,
    },
    wccx: {
      contractAddress: '0x1234567890123456789012345678901234567890',
      accountAddress: '0x0987654321098765432109876543210987654321',
      chainId: 97,
      confirmations: 12,
      units: 1000000,
    },
    tx: {
      gasMultiplier: 1.2,
    },
  };

  beforeEach(async () => {
    routeParamMap$ = new BehaviorSubject(
      convertToParamMap({ direction: 'ccx-to-evm', network: 'bsc' }),
    );

    apiMock = {
      getChainConfig: vi.fn(() => of(mockConfig)),
      hydrate: vi.fn(() => of({ success: true })),
      getCcxSwapBalance: vi.fn(() => of({ result: true, balance: 500 })),
      getWccxSwapBalance: vi.fn(() => of({ result: true, balance: 300 })),
      estimateGasPrice: vi.fn(() => of({ result: true, gas: 0.01 })),
      getGasPrice: vi.fn(() => of({ result: true, gas: 0.01 })),
      sendCcxToWccxInit: vi.fn(() => of({ success: true, paymentId: 'test-payment-id-123' })),
      sendWccxToCcxInit: vi.fn(() => of({ success: true, paymentId: 'test-payment-id-456' })),
      execWccxToCcxSwap: vi.fn(() => of({ success: true })),
      checkSwapState: vi.fn(() => of({ result: false })),
    };

    walletMock = {
      hydrate: vi.fn(async () => Promise.resolve()),
      isConnected: signal(false),
      address: signal<`0x${string}` | null>(null),
      isConnectorAvailable: vi.fn(() => false),
      addToken: vi.fn(async () => Promise.resolve()),
      disconnectedByUser: vi.fn(() => false),
      chainId: vi.fn(() => null),
      connector: vi.fn(() => null),
      provider: vi.fn(() => null),
      hasInjectedProvider: vi.fn(() => false),
      hasBinanceProvider: vi.fn(() => false),
      isInstalled: vi.fn(() => false),
      shortAddress: vi.fn(() => ''),
      connect: vi.fn(async () => '0x1234567890123456789012345678901234567890'),
      ensureChain: vi.fn(async () => Promise.resolve()),
      sendNativeTransaction: vi.fn(async () => '0xabcdef' as `0x${string}`),
      waitForReceipt: vi.fn(async () => ({ status: 'success' })),
      watchErc20Asset: vi.fn(async () => true),
      getClients: vi.fn(() => ({
        publicClient: {
          readContract: vi.fn(async () => 1000000000000n),
        },
        walletClient: {
          writeContract: vi.fn(async () => '0xabcdef' as `0x${string}`),
        },
      })),
    };

    historyMock = {
      addTransaction: vi.fn(),
      refresh: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SwapPage],
      providers: [
        provideRouter([]),
        { provide: BridgeApiService, useValue: apiMock },
        { provide: EvmWalletService, useValue: walletMock },
        { provide: TransactionHistoryService, useValue: historyMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParamMap$.asObservable() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SwapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should hydrate wallet on init', () => {
      expect(walletMock.hydrate).toHaveBeenCalled();
    });

    it('should load chain config on init', () => {
      expect(apiMock.getChainConfig).toHaveBeenCalledWith('bsc');
      expect(component.config()).toEqual(mockConfig);
    });

    it('should load balance data on init', () => {
      expect(apiMock.getCcxSwapBalance).toHaveBeenCalledWith('bsc');
      expect(apiMock.getWccxSwapBalance).toHaveBeenCalledWith('bsc');
      expect(component.ccxSwapBalance()).toBe(500);
      expect(component.wccxSwapBalance()).toBe(300);
    });
  });

  describe('Computed Signals', () => {
    it('should compute direction from route params', () => {
      expect(component.direction()).toBe('ccx-to-evm');

      routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
      fixture.detectChanges();
      expect(component.direction()).toBe('evm-to-ccx');
    });

    it('should return null for invalid direction', () => {
      routeParamMap$.next(convertToParamMap({ direction: 'invalid', network: 'bsc' }));
      fixture.detectChanges();
      expect(component.direction()).toBeNull();
    });

    it('should compute networkKey from route params', () => {
      expect(component.networkKey()).toBe('bsc');
    });

    it('should return null for invalid network key', () => {
      routeParamMap$.next(
        convertToParamMap({ direction: 'ccx-to-evm', network: 'invalid-network' }),
      );
      fixture.detectChanges();
      expect(component.networkKey()).toBeNull();
    });

    it('should compute networkInfo from networkKey', () => {
      const info = component.networkInfo();
      expect(info).toBeTruthy();
      expect(info?.key).toBe('bsc');
    });

    it('should compute loading announcement for ccx-to-evm when busy', () => {
      component.isBusy.set(true);
      expect(component.loadingAnnouncement()).toBe('Processing swap initialization, please wait.');
    });

    it('should compute loading announcement for evm-to-ccx when busy', () => {
      routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
      fixture.detectChanges();
      component.isBusy.set(true);
      expect(component.loadingAnnouncement()).toBe('Processing transaction, please wait.');
    });

    it('should compute loading announcement for step 1 ccx-to-evm', () => {
      component.step.set(1);
      component.isBusy.set(false);
      expect(component.loadingAnnouncement()).toBe(
        'Checking for deposit confirmation, please wait.',
      );
    });

    it('should compute loading announcement for step 1 evm-to-ccx', () => {
      routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
      fixture.detectChanges();
      component.step.set(1);
      component.isBusy.set(false);
      expect(component.loadingAnnouncement()).toBe('Processing swap, please wait.');
    });

    it('should return empty loading announcement when not busy and not step 1', () => {
      component.isBusy.set(false);
      component.step.set(0);
      expect(component.loadingAnnouncement()).toBe('');
    });
  });

  describe('Form Validation', () => {
    describe('ccxToEvmForm', () => {
      it('should validate CCX address format', () => {
        const control = component.ccxToEvmForm.controls.ccxFromAddress;

        // Valid: 'ccx' (3 chars) + 95 alphanumeric = 98 total
        control.setValue('ccx' + 'A'.repeat(95));
        control.markAsTouched();
        expect(control.valid).toBe(true);

        // Valid: 'CCX' (3 chars) + 95 alphanumeric = 98 total
        control.setValue('CCX' + 'Y'.repeat(95));
        expect(control.valid).toBe(true);

        control.setValue('0x1234567890');
        expect(control.valid).toBe(false);

        control.setValue('ccx123'); // too short
        expect(control.valid).toBe(false);
      });

      it('should validate EVM address format', () => {
        const control = component.ccxToEvmForm.controls.evmToAddress;

        control.setValue('0x' + '1'.repeat(40));
        control.markAsTouched();
        expect(control.valid).toBe(true);

        control.setValue('0x1234');
        expect(control.valid).toBe(false);

        control.setValue('ccx123');
        expect(control.valid).toBe(false);
      });

      it('should validate amount is numeric', () => {
        const control = component.ccxToEvmForm.controls.amount;

        control.setValue('123.45');
        expect(control.valid).toBe(true);

        control.setValue('123');
        expect(control.valid).toBe(true);

        control.setValue('abc');
        expect(control.valid).toBe(false);

        control.setValue('12.34.56');
        expect(control.valid).toBe(false);
      });

      it('should reject excessively long amount', () => {
        const control = component.ccxToEvmForm.controls.amount;
        control.setValue('1'.repeat(100));
        expect(control.valid).toBe(false);
        expect(control.errors?.['maxlength']).toBeTruthy();
      });

      it('should validate email format', () => {
        const control = component.ccxToEvmForm.controls.email;

        control.setValue('');
        expect(control.valid).toBe(true); // optional

        control.setValue('test@example.com');
        expect(control.valid).toBe(true);

        control.setValue('invalid-email');
        expect(control.valid).toBe(false);
      });

      it('should reject excessively long email', () => {
        const control = component.ccxToEvmForm.controls.email;
        const longEmail = 'a'.repeat(60) + '@' + 'b'.repeat(190) + '.com';
        control.setValue(longEmail);
        expect(control.valid).toBe(false);
        expect(control.errors?.['maxlength']).toBeTruthy();
      });
    });

    describe('evmToCcxForm', () => {
      it('should validate CCX address format', () => {
        const control = component.evmToCcxForm.controls.ccxToAddress;

        control.setValue('ccx' + 'A'.repeat(95));
        expect(control.valid).toBe(true);

        control.setValue('0x1234');
        expect(control.valid).toBe(false);
      });

      it('should validate amount', () => {
        const control = component.evmToCcxForm.controls.amount;

        control.setValue('100.5');
        expect(control.valid).toBe(true);

        control.setValue('not-a-number');
        expect(control.valid).toBe(false);
      });
    });
  });

  describe('Methods', () => {
    describe('reset()', () => {
      it('should reset all state signals', () => {
        component.step.set(2);
        component.isBusy.set(true);
        component.paymentId.set('test-id');
        component.evmTxHash.set('0xabc' as `0x${string}`);
        component.swapState.set({ result: true } as BridgeSwapStateResponse);
        component.statusMessage.set('Test message');

        component.reset();

        expect(component.step()).toBe(0);
        expect(component.isBusy()).toBe(false);
        expect(component.paymentId()).toBe('');
        expect(component.evmTxHash()).toBe('');
        expect(component.swapState()).toBeNull();
        expect(component.statusMessage()).toBeNull();
      });
    });

    describe('useConnectedWalletAsEvmTo()', () => {
      it('should set EVM address from connected wallet', () => {
        const testAddress = '0x1234567890123456789012345678901234567890';
        walletMock.address.set(testAddress);

        component.useConnectedWalletAsEvmTo();

        expect(component.ccxToEvmForm.controls.evmToAddress.value).toBe(testAddress);
      });

      it('should do nothing if wallet not connected', () => {
        walletMock.address.set(null);
        component.ccxToEvmForm.controls.evmToAddress.setValue('');

        component.useConnectedWalletAsEvmTo();

        expect(component.ccxToEvmForm.controls.evmToAddress.value).toBe('');
      });
    });

    describe('copy()', () => {
      it('should copy text to clipboard', async () => {
        const writeTextSpy = vi.fn(() => Promise.resolve());
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        const copyPromise = component.copy('test text');

        // Check immediately after starting
        expect(writeTextSpy).toHaveBeenCalledWith('test text');

        // Wait a bit to check status message was set
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(component.statusMessage()).toBe('Copied to clipboard.');

        await copyPromise;
      });

      it('should handle clipboard failure', async () => {
        Object.assign(navigator, {
          clipboard: {
            writeText: vi.fn(() => Promise.reject(new Error('Clipboard error'))),
          },
        });

        await component.copy('test text');

        expect(component.statusMessage()).toBe('Copy failed (clipboard unavailable).');
      });

      it('should do nothing for empty text', async () => {
        const writeTextSpy = vi.fn();
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        await component.copy('');
        expect(writeTextSpy).not.toHaveBeenCalled();

        await component.copy('   ');
        expect(writeTextSpy).not.toHaveBeenCalled();
      });
    });

    describe('addTokenToWallet()', () => {
      beforeEach(() => {
        component.config.set(mockConfig);
      });

      it('should add token to wallet successfully', async () => {
        walletMock.watchErc20Asset.mockResolvedValue(true);

        await component.addTokenToWallet();

        expect(walletMock.ensureChain).toHaveBeenCalledWith(bsc);
        expect(walletMock.watchErc20Asset).toHaveBeenCalledWith({
          address: mockConfig.wccx.contractAddress,
          symbol: 'wCCX',
          decimals: 6,
          image: 'https://conceal.network/images/branding/team-64x64.png',
        });
        expect(component.statusMessage()).toBe('Token request sent to wallet.');
      });

      it('should handle user rejection (code 4001)', async () => {
        walletMock.watchErc20Asset.mockRejectedValue({ code: 4001 });

        await component.addTokenToWallet();

        expect(component.statusMessage()).toBe('Token request was cancelled in your wallet.');
      });

      it('should handle unsupported wallet (code -32603)', async () => {
        walletMock.watchErc20Asset.mockRejectedValue({ code: -32603 });

        await component.addTokenToWallet();

        const msg = component.statusMessage();
        expect(msg).toBeTruthy();
        expect(msg).toContain('wCCX');
        expect(msg).toContain('Decimals: 6');
      });

      it('should handle "not supported" error message', async () => {
        walletMock.watchErc20Asset.mockRejectedValue(new Error('Method not supported'));

        await component.addTokenToWallet();

        const msg = component.statusMessage();
        expect(msg).toBeTruthy();
        expect(msg).toContain('wCCX');
      });

      it('should handle generic errors', async () => {
        walletMock.watchErc20Asset.mockRejectedValue(new Error('Network error'));

        await component.addTokenToWallet();

        expect(component.statusMessage()).toBe('Network error');
      });

      it('should do nothing if config not loaded', async () => {
        component.config.set(null);

        await component.addTokenToWallet();

        expect(walletMock.watchErc20Asset).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle config load failure', () => {
      apiMock.getChainConfig.mockReturnValue(throwError(() => new Error('Network error')));
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();

      expect(component.pageError()).toBe('Network error');
    });

    it('should handle balance fetch failure gracefully', () => {
      // Reconfigure the mock inline to return error
      apiMock.getWccxSwapBalance.mockReturnValue(throwError(() => new Error('API error')));

      // Trigger network change to re-subscribe
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();

      // The error handler in the component should set balanceFetchError
      // This happens synchronously when the observable errors
      expect(component.balanceFetchError()).toBeTruthy();
    });

    it('should set page error for invalid direction', () => {
      routeParamMap$.next(convertToParamMap({ direction: 'invalid', network: 'bsc' }));
      fixture.detectChanges();

      // Create new component with invalid direction
      const newFixture = TestBed.createComponent(SwapPage);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.pageError()).toBe('Unknown swap direction.');
    });
  });
});

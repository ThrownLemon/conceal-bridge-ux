import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwapPage } from './swap.page';
import { BridgeApiService } from '../../core/bridge-api.service';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { TransactionHistoryService } from '../../core/transaction-history.service';
import { ZardToastService } from '../../shared/components/toast/toast.service';
import { ActivatedRoute, convertToParamMap, type ParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import type { BridgeChainConfig, BridgeSwapStateResponse } from '../../core/bridge-types';
import { bscTestnet } from 'viem/chains';
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

interface ToastServiceMock {
  success: Mock;
  error: Mock;
  info: Mock;
}

describe('SwapPage', () => {
  let component: SwapPage;
  let fixture: ComponentFixture<SwapPage>;
  let apiMock: ApiServiceMock;
  let walletMock: WalletServiceMock;
  let historyMock: HistoryServiceMock;
  let toastMock: ToastServiceMock;
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

  // Constants for commonly used mock addresses
  const MOCK_CCX_ADDRESS =
    'ccx7Test12345678901234567890123456789012345678901234567890123456789012345678901234567890abcdefghij';
  const MOCK_EVM_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';

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

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SwapPage],
      providers: [
        provideRouter([]),
        { provide: BridgeApiService, useValue: apiMock },
        { provide: EvmWalletService, useValue: walletMock },
        { provide: TransactionHistoryService, useValue: historyMock },
        { provide: ZardToastService, useValue: toastMock },
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

  /**
   * Helper function to set up mocks for a successful ccx-to-evm swap initialization.
   * This reduces duplication across multiple tests.
   */
  function setupSuccessfulCcxToEvmInit(): void {
    component.ccxToEvmForm.patchValue({
      amount: '100',
      ccxFromAddress: MOCK_CCX_ADDRESS,
      evmToAddress: MOCK_EVM_ADDRESS,
    });
    component.ccxToEvmForm.controls.amount.markAsTouched();
    component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
    component.ccxToEvmForm.controls.evmToAddress.markAsTouched();
    walletMock.connect.mockResolvedValue('0x1234567890123456789012345678901234567890');
    walletMock.ensureChain.mockResolvedValue(undefined);
    apiMock.estimateGasPrice.mockReturnValue(of({ result: true, gas: 0.01 }));
    apiMock.getGasPrice.mockReturnValue(of({ result: true, gas: 0.01 }));
    walletMock.sendNativeTransaction.mockResolvedValue('0xabcd1234');
    walletMock.waitForReceipt.mockResolvedValue({ status: 'success' });
    apiMock.sendCcxToWccxInit.mockReturnValue(of({ success: true, paymentId: 'test-payment-id' }));
  }

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

  describe('Step Progress Indicator', () => {
    describe('stepConfigs computed signal', () => {
      it('should return empty array when direction is null', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'invalid', network: 'bsc' }));
        fixture.detectChanges();

        expect(component.stepConfigs()).toEqual([]);
      });

      it('should return ccx-to-evm step labels at step 0', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'bsc' }));
        fixture.detectChanges();
        component.step.set(0);

        const configs = component.stepConfigs();

        expect(configs).toHaveLength(3);
        expect(configs[0]).toEqual({ id: 0, label: 'Initialize', state: 'active' });
        expect(configs[1]).toEqual({ id: 1, label: 'Deposit', state: 'pending' });
        expect(configs[2]).toEqual({ id: 2, label: 'Complete', state: 'pending' });
      });

      it('should return ccx-to-evm step labels at step 1', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'bsc' }));
        fixture.detectChanges();
        component.step.set(1);

        const configs = component.stepConfigs();

        expect(configs).toHaveLength(3);
        expect(configs[0]).toEqual({ id: 0, label: 'Initialize', state: 'completed' });
        expect(configs[1]).toEqual({ id: 1, label: 'Deposit', state: 'active' });
        expect(configs[2]).toEqual({ id: 2, label: 'Complete', state: 'pending' });
      });

      it('should return ccx-to-evm step labels at step 2', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'bsc' }));
        fixture.detectChanges();
        component.step.set(2);

        const configs = component.stepConfigs();

        expect(configs).toHaveLength(3);
        expect(configs[0]).toEqual({ id: 0, label: 'Initialize', state: 'completed' });
        expect(configs[1]).toEqual({ id: 1, label: 'Deposit', state: 'completed' });
        expect(configs[2]).toEqual({ id: 2, label: 'Complete', state: 'active' });
      });

      it('should return evm-to-ccx step labels at step 0', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
        fixture.detectChanges();
        component.step.set(0);

        const configs = component.stepConfigs();

        expect(configs).toHaveLength(3);
        expect(configs[0]).toEqual({ id: 0, label: 'Send', state: 'active' });
        expect(configs[1]).toEqual({ id: 1, label: 'Processing', state: 'pending' });
        expect(configs[2]).toEqual({ id: 2, label: 'Complete', state: 'pending' });
      });

      it('should return evm-to-ccx step labels at step 1', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
        fixture.detectChanges();
        component.step.set(1);

        const configs = component.stepConfigs();

        expect(configs).toHaveLength(3);
        expect(configs[0]).toEqual({ id: 0, label: 'Send', state: 'completed' });
        expect(configs[1]).toEqual({ id: 1, label: 'Processing', state: 'active' });
        expect(configs[2]).toEqual({ id: 2, label: 'Complete', state: 'pending' });
      });

      it('should return evm-to-ccx step labels at step 2', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
        fixture.detectChanges();
        component.step.set(2);

        const configs = component.stepConfigs();

        expect(configs).toHaveLength(3);
        expect(configs[0]).toEqual({ id: 0, label: 'Send', state: 'completed' });
        expect(configs[1]).toEqual({ id: 1, label: 'Processing', state: 'completed' });
        expect(configs[2]).toEqual({ id: 2, label: 'Complete', state: 'active' });
      });

      it('should update when step changes', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'bsc' }));
        fixture.detectChanges();

        component.step.set(0);
        expect(component.stepConfigs()[0].state).toBe('active');
        expect(component.stepConfigs()[1].state).toBe('pending');

        component.step.set(1);
        expect(component.stepConfigs()[0].state).toBe('completed');
        expect(component.stepConfigs()[1].state).toBe('active');
      });

      it('should update when direction changes', () => {
        routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'bsc' }));
        fixture.detectChanges();
        component.step.set(0);

        expect(component.stepConfigs()[0].label).toBe('Initialize');

        routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
        fixture.detectChanges();

        expect(component.stepConfigs()[0].label).toBe('Send');
      });
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
      let originalClipboard: Clipboard;

      beforeEach(() => {
        originalClipboard = navigator.clipboard;
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        // Restore original clipboard after each test
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          writable: true,
          configurable: true,
        });
      });

      it('should copy text to clipboard and show success toast', async () => {
        const writeTextSpy = vi.fn(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: writeTextSpy },
          writable: true,
          configurable: true,
        });

        // Start the copy operation (don't await yet)
        const copyPromise = component.copy('test text');

        // Flush pending promises to let clipboard.writeText resolve
        await vi.runAllTimersAsync();

        expect(writeTextSpy).toHaveBeenCalledWith('test text');
        expect(toastMock.success).toHaveBeenCalledWith('Copied to clipboard.');
        await copyPromise;
      });

      it('should handle clipboard failure', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: vi.fn(() => Promise.reject(new Error('Clipboard error'))),
          },
          writable: true,
          configurable: true,
        });

        const copyPromise = component.copy('test text');
        await vi.runAllTimersAsync();
        await copyPromise;

        expect(toastMock.error).toHaveBeenCalledWith('Copy failed (clipboard unavailable).');
      });

      it('should do nothing for empty text', async () => {
        const writeTextSpy = vi.fn();
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: writeTextSpy },
          writable: true,
          configurable: true,
        });

        await component.copy('');
        expect(writeTextSpy).not.toHaveBeenCalled();
        expect(toastMock.success).not.toHaveBeenCalled();
        expect(toastMock.error).not.toHaveBeenCalled();

        await component.copy('   ');
        expect(writeTextSpy).not.toHaveBeenCalled();
        expect(toastMock.success).not.toHaveBeenCalled();
        expect(toastMock.error).not.toHaveBeenCalled();
      });
    });

    describe('addTokenToWallet()', () => {
      beforeEach(() => {
        component.config.set(mockConfig);
      });

      it('should add token to wallet successfully', async () => {
        walletMock.watchErc20Asset.mockResolvedValue(true);

        await component.addTokenToWallet();

        expect(walletMock.ensureChain).toHaveBeenCalledWith(bscTestnet);
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
      // Set invalid route params - this affects the shared BehaviorSubject
      routeParamMap$.next(convertToParamMap({ direction: 'invalid', network: 'bsc' }));

      // Create a fresh component that will initialize with invalid params
      const errorFixture = TestBed.createComponent(SwapPage);
      try {
        const errorComponent = errorFixture.componentInstance;
        errorFixture.detectChanges();

        expect(errorComponent.pageError()).toBe('Unknown swap direction.');
      } finally {
        // Always clean up the fixture to prevent memory leaks
        errorFixture.destroy();
      }
    });
  });

  describe('startCcxToEvm()', () => {
    beforeEach(() => {
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();
    });

    it('should return early if direction is not ccx-to-evm', async () => {
      routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'eth' }));
      fixture.detectChanges();

      await component.startCcxToEvm();

      expect(walletMock.connect).not.toHaveBeenCalled();
    });

    it('should show error for invalid form', async () => {
      component.ccxToEvmForm.controls.amount.setValue('');

      await component.startCcxToEvm();

      expect(component.statusMessage()).toBe('Please fix the form errors.');
      expect(walletMock.connect).not.toHaveBeenCalled();
    });

    it('should show error for missing network configuration', async () => {
      component.config.set(null);
      component.ccxToEvmForm.patchValue({
        amount: '100',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: MOCK_EVM_ADDRESS,
      });
      component.ccxToEvmForm.controls.amount.markAsTouched();
      component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
      component.ccxToEvmForm.controls.evmToAddress.markAsTouched();

      await component.startCcxToEvm();

      expect(component.statusMessage()).toBe('Missing network configuration.');
    });

    it('should show error for amount below minimum', async () => {
      component.ccxToEvmForm.patchValue({
        amount: '0.5',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: MOCK_EVM_ADDRESS,
      });
      component.ccxToEvmForm.controls.amount.markAsTouched();
      component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
      component.ccxToEvmForm.controls.evmToAddress.markAsTouched();

      await component.startCcxToEvm();

      expect(component.statusMessage()).toContain('Amount must be between');
    });

    it('should show error for amount above maximum', async () => {
      component.ccxToEvmForm.patchValue({
        amount: '100000',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: MOCK_EVM_ADDRESS,
      });
      component.ccxToEvmForm.controls.amount.markAsTouched();
      component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
      component.ccxToEvmForm.controls.evmToAddress.markAsTouched();

      await component.startCcxToEvm();

      expect(component.statusMessage()).toContain('Amount must be between');
    });

    it('should show error for insufficient liquidity', async () => {
      component.wccxSwapBalance.set(50);
      component.ccxToEvmForm.patchValue({
        amount: '100',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: MOCK_EVM_ADDRESS,
      });
      component.ccxToEvmForm.controls.amount.markAsTouched();
      component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
      component.ccxToEvmForm.controls.evmToAddress.markAsTouched();

      await component.startCcxToEvm();

      expect(component.statusMessage()).toContain('not enough funds');
    });

    it('should show error for invalid CCX address', async () => {
      component.ccxToEvmForm.markAllAsTouched();
      component.ccxToEvmForm.patchValue({
        amount: '100',
        ccxFromAddress: 'invalid',
        evmToAddress: MOCK_EVM_ADDRESS,
      });

      await component.startCcxToEvm();

      expect(component.statusMessage()).toBe('Please fix the form errors.');
    });

    it('should show error for invalid EVM address', async () => {
      component.ccxToEvmForm.markAllAsTouched();
      component.ccxToEvmForm.patchValue({
        amount: '100',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: 'invalid',
      });

      await component.startCcxToEvm();

      expect(component.statusMessage()).toBe('Please fix the form errors.');
    });

    it('should handle wallet connection failure', async () => {
      component.ccxToEvmForm.patchValue({
        amount: '100',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: MOCK_EVM_ADDRESS,
      });
      component.ccxToEvmForm.controls.amount.markAsTouched();
      component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
      component.ccxToEvmForm.controls.evmToAddress.markAsTouched();
      walletMock.connect.mockRejectedValue(new Error('User rejected'));

      await component.startCcxToEvm();

      expect(component.isBusy()).toBe(false);
      expect(component.statusMessage()).toBe('User rejected');
    });

    it('should handle gas estimation failure', async () => {
      component.ccxToEvmForm.patchValue({
        amount: '100',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: MOCK_EVM_ADDRESS,
      });
      component.ccxToEvmForm.controls.amount.markAsTouched();
      component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
      component.ccxToEvmForm.controls.evmToAddress.markAsTouched();
      walletMock.connect.mockResolvedValue('0x1234567890123456789012345678901234567890');
      walletMock.ensureChain.mockResolvedValue(undefined);
      apiMock.estimateGasPrice.mockReturnValue(of({ result: false }));

      await component.startCcxToEvm();

      expect(component.isBusy()).toBe(false);
      expect(component.statusMessage()).toContain('Failed to estimate gas');
    });

    it('should handle successful swap initialization', async () => {
      component.ccxToEvmForm.patchValue({
        amount: '100',
        ccxFromAddress: MOCK_CCX_ADDRESS,
        evmToAddress: MOCK_EVM_ADDRESS,
        email: 'test@example.com',
      });
      component.ccxToEvmForm.controls.amount.markAsTouched();
      component.ccxToEvmForm.controls.ccxFromAddress.markAsTouched();
      component.ccxToEvmForm.controls.evmToAddress.markAsTouched();
      walletMock.connect.mockResolvedValue('0x1234567890123456789012345678901234567890');
      walletMock.ensureChain.mockResolvedValue(undefined);
      apiMock.estimateGasPrice.mockReturnValue(of({ result: true, gas: 0.01 }));
      apiMock.getGasPrice.mockReturnValue(of({ result: true, gas: 0.01 }));
      walletMock.sendNativeTransaction.mockResolvedValue('0xabcd1234');
      walletMock.waitForReceipt.mockResolvedValue({ status: 'success' });
      apiMock.sendCcxToWccxInit.mockReturnValue(
        of({ success: true, paymentId: 'test-payment-id' }),
      );

      await component.startCcxToEvm();

      expect(component.step()).toBe(1);
      expect(component.paymentId()).toBe('test-payment-id');
      expect(component.evmTxHash()).toBe('0xabcd1234');
    });
  });

  describe('startEvmToCcx()', () => {
    beforeEach(() => {
      routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'eth' }));
      fixture.detectChanges();
    });

    it('should return early if direction is not evm-to-ccx', async () => {
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();

      await component.startEvmToCcx();

      expect(walletMock.connect).not.toHaveBeenCalled();
    });

    it('should show error for invalid form', async () => {
      component.evmToCcxForm.controls.amount.setValue('');

      await component.startEvmToCcx();

      expect(component.statusMessage()).toBe('Please fix the form errors.');
      expect(walletMock.connect).not.toHaveBeenCalled();
    });

    it('should show error for missing network configuration', async () => {
      component.config.set(null);
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();

      await component.startEvmToCcx();

      expect(component.statusMessage()).toBe('Missing network configuration.');
    });

    it('should show error for amount below minimum', async () => {
      component.evmToCcxForm.patchValue({
        amount: '0.5',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();

      await component.startEvmToCcx();

      expect(component.statusMessage()).toContain('Amount must be between');
    });

    it('should show error for amount above maximum', async () => {
      component.evmToCcxForm.patchValue({
        amount: '100000',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();

      await component.startEvmToCcx();

      expect(component.statusMessage()).toContain('Amount must be between');
    });

    it('should show error for insufficient liquidity', async () => {
      component.ccxSwapBalance.set(50);
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();

      await component.startEvmToCcx();

      expect(component.statusMessage()).toContain('not enough funds');
    });

    it('should show error for invalid CCX address', async () => {
      component.evmToCcxForm.markAllAsTouched();
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: 'invalid',
      });

      await component.startEvmToCcx();

      expect(component.statusMessage()).toBe('Please fix the form errors.');
    });

    it('should handle wallet connection failure', async () => {
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();
      walletMock.connect.mockRejectedValue(new Error('User rejected'));

      await component.startEvmToCcx();

      expect(component.isBusy()).toBe(false);
      expect(component.statusMessage()).toBe('User rejected');
    });

    it('should handle successful swap initialization', async () => {
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();
      walletMock.connect.mockResolvedValue('0x1234567890123456789012345678901234567890');
      walletMock.ensureChain.mockResolvedValue(undefined);
      apiMock.sendWccxToCcxInit.mockReturnValue(
        of({ success: true, paymentId: 'test-payment-id', depositAddress: '0xabcd' }),
      );

      await component.startEvmToCcx();

      expect(component.step()).toBe(1);
      expect(component.paymentId()).toBe('test-payment-id');
    });

    it('should handle swap initialization failure for evm-to-ccx', async () => {
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();
      walletMock.connect.mockResolvedValue('0x1234567890123456789012345678901234567890');
      walletMock.ensureChain.mockResolvedValue(undefined);

      // Mock failed init
      apiMock.sendWccxToCcxInit.mockReturnValue(
        of({ success: false, error: 'EVM-to-CCX init failed' }),
      );

      await component.startEvmToCcx();

      expect(component.isBusy()).toBe(false);
      expect(component.statusMessage()).toBe('EVM-to-CCX init failed');
    });

    it('should check token balance before transfer', async () => {
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();
      walletMock.connect.mockResolvedValue('0x1234567890123456789012345678901234567890');
      walletMock.ensureChain.mockResolvedValue(undefined);

      // Mock insufficient balance
      walletMock.getClients.mockReturnValue({
        publicClient: {
          readContract: vi.fn(async () => 1000n), // Only 0.001 wCCX
        },
        walletClient: {
          writeContract: vi.fn(async () => '0xabcdef' as `0x${string}`),
        },
      });

      await component.startEvmToCcx();

      expect(component.statusMessage()).toBe('Insufficient wCCX balance for this transfer.');
    });

    it('should handle swap execution failure', async () => {
      component.evmToCcxForm.patchValue({
        amount: '100',
        ccxToAddress: MOCK_CCX_ADDRESS,
      });
      component.evmToCcxForm.controls.amount.markAsTouched();
      component.evmToCcxForm.controls.ccxToAddress.markAsTouched();
      walletMock.connect.mockResolvedValue('0x1234567890123456789012345678901234567890');
      walletMock.ensureChain.mockResolvedValue(undefined);
      walletMock.waitForReceipt.mockResolvedValue({ status: 'success' });

      // Mock successful init but failed exec
      apiMock.sendWccxToCcxInit.mockReturnValue(
        of({ success: true, paymentId: 'test-payment-id' }),
      );
      apiMock.execWccxToCcxSwap.mockReturnValue(of({ success: false, error: 'Execution failed' }));

      await component.startEvmToCcx();

      expect(component.isBusy()).toBe(false);
      expect(component.statusMessage()).toBe('Execution failed');
    });
  });

  describe('Polling Mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('should start polling after successful swap initialization', async () => {
      setupSuccessfulCcxToEvmInit();
      apiMock.checkSwapState.mockReturnValue(of({ result: false }));

      await component.startCcxToEvm();

      // Wait for initial poll
      await vi.advanceTimersByTimeAsync(0);

      expect(apiMock.checkSwapState).toHaveBeenCalledWith('eth', 'wccx', 'test-payment-id');
    });

    it('should complete swap, update history, and transition to step 2 on successful poll', async () => {
      // Manually set up polling state
      component.step.set(1);
      component.paymentId.set('test-payment-id');

      // Mock successful swap state
      const swapResponse = {
        result: true,
        txdata: {
          swaped: 100,
          address: '0xrecipient',
          swapHash: '0xswaphash',
          depositHash: '0xdeposithash',
        },
      };
      apiMock.checkSwapState.mockReturnValue(of(swapResponse as BridgeSwapStateResponse));

      component.startPolling('eth', 'wccx', 'test-payment-id');

      // Flush all timers to ensure polling loop completes
      await vi.runAllTimersAsync();

      // Verify state transition and status
      expect(component.step()).toBe(2);
      expect(component.swapState()).toEqual(swapResponse);
      expect(component.statusMessage()).toBe('Payment received!');

      // Verify history is updated
      expect(historyMock.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-payment-id',
          direction: 'ccx-to-evm',
          network: 'eth',
          status: 'completed',
          amount: 100,
        }),
      );
    });

    it('should continue polling when swap is not complete', async () => {
      component.step.set(1);
      component.paymentId.set('test-payment-id');

      // First poll returns incomplete
      apiMock.checkSwapState.mockReturnValue(of({ result: false }));

      component.startPolling('eth', 'wccx', 'test-payment-id');

      // Initial poll
      await vi.advanceTimersByTimeAsync(0);
      expect(component.step()).toBe(1); // Still polling
      expect(apiMock.checkSwapState).toHaveBeenCalledTimes(1);

      // Wait for next poll interval (10 seconds)
      await vi.advanceTimersByTimeAsync(10000);
      expect(apiMock.checkSwapState).toHaveBeenCalledTimes(2);
    });

    it('should handle polling error with backoff', async () => {
      component.step.set(1);
      component.paymentId.set('test-payment-id');

      // Mock error response
      apiMock.checkSwapState.mockReturnValue(throwError(() => new Error('Network error')));

      component.startPolling('eth', 'wccx', 'test-payment-id');

      // Initial poll fails
      await vi.advanceTimersByTimeAsync(0);

      expect(component.pollingError()).toContain('Temporary connection issue');
      expect(component.step()).toBe(1); // Still in polling state
    });

    it('should show exhaustion error after max retries', async () => {
      component.step.set(1);
      component.paymentId.set('test-payment-id');

      apiMock.checkSwapState.mockReturnValue(throwError(() => new Error('Network error')));

      component.startPolling('eth', 'wccx', 'test-payment-id');

      // Run through all retries until exhaustion
      await vi.runAllTimersAsync();

      expect(component.pollingError()).toContain('Unable to check swap status');
      expect(component.pollingError()).toContain('test-payment-id');
    });

    it('should cancel polling on reset', async () => {
      component.step.set(1);
      component.paymentId.set('test-payment-id');

      apiMock.checkSwapState.mockReturnValue(of({ result: false }));

      component.startPolling('eth', 'wccx', 'test-payment-id');
      await vi.advanceTimersByTimeAsync(0);

      // Verify first poll has fired before reset
      expect(apiMock.checkSwapState).toHaveBeenCalledTimes(1);

      // Reset should cancel polling
      component.reset();

      // Advance time and verify no more API calls
      await vi.advanceTimersByTimeAsync(10000);

      expect(apiMock.checkSwapState).toHaveBeenCalledTimes(1);
    });

    it('should record correct direction for evm-to-ccx swap in history', async () => {
      routeParamMap$.next(convertToParamMap({ direction: 'evm-to-ccx', network: 'bsc' }));
      fixture.detectChanges();

      component.step.set(1);
      component.paymentId.set('test-payment-id');

      apiMock.checkSwapState.mockReturnValue(
        of({
          result: true,
          txdata: {
            swaped: 50,
            address: 'ccxrecipient',
            swapHash: '0xswaphash',
            depositHash: '0xdeposithash',
          },
        } as BridgeSwapStateResponse),
      );

      component.startPolling('bsc', 'ccx', 'test-payment-id');

      // Flush all timers to ensure polling loop completes
      await vi.runAllTimersAsync();

      expect(historyMock.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'evm-to-ccx',
          network: 'bsc',
        }),
      );
    });
  });

  describe('Network Switching', () => {
    it('should reload config when network changes', () => {
      // Clear mock history to ensure we're only checking calls made within this test
      apiMock.getChainConfig.mockClear();

      // Change network and trigger effects
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();

      // Verify that the config was reloaded for the new network
      expect(apiMock.getChainConfig).toHaveBeenCalledWith('eth');
      expect(apiMock.getChainConfig).toHaveBeenCalledTimes(1);
    });

    it('should reset state when network changes', () => {
      component.step.set(1);
      component.paymentId.set('some-id');

      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'plg' }));
      fixture.detectChanges();

      expect(component.step()).toBe(0);
      expect(component.paymentId()).toBe('');
    });

    it('should call ensureChain before transaction', async () => {
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();

      setupSuccessfulCcxToEvmInit();

      await component.startCcxToEvm();

      expect(walletMock.ensureChain).toHaveBeenCalled();
    });
  });

  describe('Step Transitions', () => {
    it('should transition from step 0 to step 1 after swap init', async () => {
      routeParamMap$.next(convertToParamMap({ direction: 'ccx-to-evm', network: 'eth' }));
      fixture.detectChanges();

      expect(component.step()).toBe(0);

      setupSuccessfulCcxToEvmInit();

      await component.startCcxToEvm();

      expect(component.step()).toBe(1);
    });

    it('should return to step 0 after reset from step 2', () => {
      component.step.set(2);
      component.swapState.set({ result: true } as BridgeSwapStateResponse);

      component.reset();

      expect(component.step()).toBe(0);
      expect(component.swapState()).toBeNull();
    });
  });
});

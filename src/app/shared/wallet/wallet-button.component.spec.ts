import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { WalletButtonComponent } from './wallet-button.component';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { EvmChainMetadataService } from '../../core/evm-chain-metadata.service';
import { WalletModalService } from '../../core/wallet-modal.service';

describe('WalletButtonComponent', () => {
  let component: WalletButtonComponent;
  let fixture: ComponentFixture<WalletButtonComponent>;
  let mockWalletService: Partial<EvmWalletService>;
  let mockChainMetaService: Partial<EvmChainMetadataService>;
  let mockModalService: Partial<WalletModalService>;

  // Writable signals for easier test manipulation
  let isConnectedSignal: WritableSignal<boolean>;
  let addressSignal: WritableSignal<`0x${string}` | null>;
  let chainIdSignal: WritableSignal<number | null>;
  let connectorSignal: WritableSignal<'metamask' | 'trust' | 'binance' | null>;
  let shortAddressSignal: WritableSignal<string>;

  const mockAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    // Initialize writable signals
    isConnectedSignal = signal(false);
    addressSignal = signal<`0x${string}` | null>(null);
    chainIdSignal = signal<number | null>(null);
    connectorSignal = signal<'metamask' | 'trust' | 'binance' | null>(null);
    shortAddressSignal = signal('');

    mockWalletService = {
      isConnected: isConnectedSignal,
      address: addressSignal,
      chainId: chainIdSignal,
      connector: connectorSignal,
      shortAddress: shortAddressSignal,
      ensureChain: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };

    mockChainMetaService = {
      get: vi.fn().mockReturnValue({ name: 'Ethereum', logoUri: 'eth.png' }),
    };

    mockModalService = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [WalletButtonComponent],
      providers: [
        provideNoopAnimations(),
        { provide: EvmWalletService, useValue: mockWalletService },
        { provide: EvmChainMetadataService, useValue: mockChainMetaService },
        { provide: WalletModalService, useValue: mockModalService },
      ],
    });

    fixture = TestBed.createComponent(WalletButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should default to header variant', () => {
      expect(component.variant()).toBe('header');
    });

    it('should initialize signals', () => {
      expect(component.isSwitchingNetwork()).toBe(false);
      expect(component.networkStatus()).toBeNull();
      expect(component.copyStatus()).toBeNull();
    });
  });

  describe('disconnected state', () => {
    it('should show Connect Wallet button when not connected', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.textContent.trim()).toBe('Connect Wallet');
    });

    it('should open modal when Connect Wallet clicked', () => {
      const button = fixture.nativeElement.querySelector('button');
      button.click();
      expect(mockModalService.open).toHaveBeenCalled();
    });
  });

  describe('connected state - header variant', () => {
    beforeEach(() => {
      isConnectedSignal.set(true);
      addressSignal.set(mockAddress as `0x${string}`);
      chainIdSignal.set(1);
      shortAddressSignal.set('0x1234…7890');
      connectorSignal.set('metamask');
      fixture.detectChanges();
    });

    it('should show network and wallet dropdowns when connected', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button[z-dropdown]');
      expect(buttons.length).toBe(2);
    });

    it('should display current network name', () => {
      const networkName = component.currentNetworkName();
      expect(networkName).toBe('Ethereum');
    });

    it('should display short address', () => {
      const shortAddr = component.wallet.shortAddress();
      expect(shortAddr).toBe('0x1234…7890');
    });
  });

  describe('connected state - primary variant', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('variant', 'primary');
      (mockWalletService.isConnected as ReturnType<typeof signal<boolean>>).set(true);
      (mockWalletService.address as ReturnType<typeof signal<`0x${string}` | null>>).set(
        mockAddress as `0x${string}`,
      );
      (mockWalletService.chainId as ReturnType<typeof signal<number | null>>).set(1);
      (mockWalletService.shortAddress as ReturnType<typeof signal<string>>).set('0x1234…7890');
      fixture.detectChanges();
    });

    it('should show simple menu when variant is primary', () => {
      expect(component.variant()).toBe('primary');
    });
  });

  describe('open method', () => {
    it('should call modalService.open()', () => {
      component.open();
      expect(mockModalService.open).toHaveBeenCalled();
    });
  });

  describe('network switching', () => {
    beforeEach(() => {
      (mockWalletService.isConnected as ReturnType<typeof signal<boolean>>).set(true);
      (mockWalletService.chainId as ReturnType<typeof signal<number | null>>).set(1);
      fixture.detectChanges();
    });

    it('should switch network successfully', async () => {
      await component.switchNetwork('bsc');

      expect(mockWalletService.ensureChain).toHaveBeenCalled();
      expect(component.networkStatus()).toBe('Switched to BNB Smart Chain.');
      expect(component.isSwitchingNetwork()).toBe(false);
    });

    it('should handle user rejection (code 4001)', async () => {
      const error = new Error('User rejected') as Error & { code: number };
      error.code = 4001;
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce(error);

      await component.switchNetwork('bsc');

      expect(component.networkStatus()).toBe('Network switch cancelled in wallet.');
    });

    it('should handle pending request (code -32002)', async () => {
      const error = new Error('Pending request') as Error & { code: number };
      error.code = -32002;
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce(error);

      await component.switchNetwork('eth');

      expect(component.networkStatus()).toBe(
        'A wallet request is already pending. Open your wallet.',
      );
    });

    it('should handle generic errors', async () => {
      const error = new Error('Unknown error');
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce(error);

      await component.switchNetwork('plg');

      expect(component.networkStatus()).toBe('Unknown error');
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce('string error');

      await component.switchNetwork('eth');

      expect(component.networkStatus()).toBe('Failed to switch network.');
    });

    it('should set isSwitchingNetwork during switch', async () => {
      let resolveSwitch: () => void;
      const switchPromise = new Promise<void>((resolve) => {
        resolveSwitch = resolve;
      });
      vi.mocked(mockWalletService.ensureChain!).mockReturnValueOnce(switchPromise);

      const switchNetworkPromise = component.switchNetwork('bsc');

      expect(component.isSwitchingNetwork()).toBe(true);

      resolveSwitch!();
      await switchNetworkPromise;

      expect(component.isSwitchingNetwork()).toBe(false);
    });
  });

  describe('copy functionality', () => {
    beforeEach(() => {
      (mockWalletService.isConnected as ReturnType<typeof signal<boolean>>).set(true);
      (mockWalletService.address as ReturnType<typeof signal<`0x${string}` | null>>).set(
        mockAddress as `0x${string}`,
      );
      fixture.detectChanges();
    });

    it('should copy address successfully from header', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextSpy },
      });

      await component.copyAddressFromHeader();

      expect(writeTextSpy).toHaveBeenCalledWith(mockAddress);
      expect(component.copyStatus()).toBe('Copied!');
    });

    it('should copy address successfully from non-header', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextSpy },
      });

      await component.copyAddress();

      expect(writeTextSpy).toHaveBeenCalledWith(mockAddress);
      expect(component.copyStatus()).toBe('Copied!');
    });

    it('should handle copy failure', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Copy failed')) },
      });

      await component.copyAddress();

      expect(component.copyStatus()).toBe('Copy failed - select manually');
    });

    it('should clear copy status after timeout', async () => {
      vi.useFakeTimers();
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      await component.copyAddress();
      expect(component.copyStatus()).toBe('Copied!');

      vi.advanceTimersByTime(1000);
      expect(component.copyStatus()).toBeNull();

      vi.useRealTimers();
    });

    it('should not clear copy status if it changed', async () => {
      vi.useFakeTimers();
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      await component.copyAddress();
      component.copyStatus.set('Different status');

      vi.advanceTimersByTime(1000);
      expect(component.copyStatus()).toBe('Different status');

      vi.useRealTimers();
    });

    it('should not copy when address is null', async () => {
      const writeTextSpy = vi.fn();
      Object.assign(navigator, {
        clipboard: { writeText: writeTextSpy },
      });
      (mockWalletService.address as ReturnType<typeof signal<`0x${string}` | null>>).set(null);

      await component.copyAddress();

      expect(writeTextSpy).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should call wallet.disconnect() from header', async () => {
      await component.disconnectFromHeader();
      expect(mockWalletService.disconnect).toHaveBeenCalled();
    });

    it('should call wallet.disconnect() from non-header', async () => {
      await component.disconnect();
      expect(mockWalletService.disconnect).toHaveBeenCalled();
    });
  });

  describe('connectorLogo', () => {
    it('should return metamask logo', () => {
      expect(component.connectorLogo('metamask')).toBe('images/wallets/metamask.png');
    });

    it('should return trust wallet logo', () => {
      expect(component.connectorLogo('trust')).toBe('images/wallets/trustwallet.png');
    });

    it('should return binance logo', () => {
      expect(component.connectorLogo('binance')).toBe('images/wallets/binance.svg');
    });

    it('should return walletconnect logo as fallback for unknown connectors', () => {
      // Unknown connector types fall back to walletconnect.svg
      const result = component.connectorLogo('unknown' as 'metamask');
      expect(result).toBe('images/wallets/walletconnect.svg');
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      isConnectedSignal.set(true);
      chainIdSignal.set(1);
      connectorSignal.set('metamask');
      fixture.detectChanges();
    });

    describe('connectedChainLogo', () => {
      it('should return Ethereum logo for chainId 1', () => {
        expect(component.connectedChainLogo()).toBe('images/branding/eth.png');
      });

      it('should return BSC logo for chainId 56', () => {
        chainIdSignal.set(56);
        expect(component.connectedChainLogo()).toBe('images/branding/bsc.png');
      });

      it('should return Polygon logo for chainId 137', () => {
        chainIdSignal.set(137);
        expect(component.connectedChainLogo()).toBe('images/branding/plg.png');
      });

      it('should return chain metadata logo for other chains', () => {
        chainIdSignal.set(42161);
        const logo = component.connectedChainLogo();
        // Falls back to chain metadata logo or null
        expect(logo).toBeDefined();
      });
    });

    describe('currentNetworkName', () => {
      it('should return Ethereum for chainId 1', () => {
        expect(component.currentNetworkName()).toBe('Ethereum');
      });

      it('should return BNB Smart Chain for chainId 56', () => {
        chainIdSignal.set(56);
        expect(component.currentNetworkName()).toBe('BNB Smart Chain');
      });

      it('should return Polygon for chainId 137', () => {
        chainIdSignal.set(137);
        expect(component.currentNetworkName()).toBe('Polygon');
      });

      it('should return chain metadata name for other chains', () => {
        chainIdSignal.set(42161);
        const name = component.currentNetworkName();
        expect(name).toBeDefined();
      });
    });

    describe('currentWalletLogo', () => {
      it('should return metamask logo when connected with metamask', () => {
        expect(component.currentWalletLogo()).toBe('images/wallets/metamask.png');
      });

      it('should return null when no connector', () => {
        connectorSignal.set(null);
        expect(component.currentWalletLogo()).toBeNull();
      });
    });

    describe('evmNetworkOptions', () => {
      it('should return three network options', () => {
        const options = component.evmNetworkOptions();
        expect(options.length).toBe(3);
        expect(options[0].key).toBe('eth');
        expect(options[1].key).toBe('bsc');
        expect(options[2].key).toBe('plg');
      });
    });
  });
});

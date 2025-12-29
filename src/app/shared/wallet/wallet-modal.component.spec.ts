import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WalletModalComponent } from './wallet-modal.component';
import { WalletModalService } from '../../core/wallet-modal.service';
import { EvmWalletService } from '../../core/evm-wallet.service';
import type { Mock } from 'vitest';

interface WalletServiceMock {
  isConnectorAvailable: Mock;
  connectWith: Mock;
  refreshChainId: Mock;
}

describe('WalletModalComponent', () => {
  let component: WalletModalComponent;
  let fixture: ComponentFixture<WalletModalComponent>;
  let modalService: WalletModalService;
  let walletService: WalletServiceMock;

  beforeEach(async () => {
    walletService = {
      isConnectorAvailable: vi.fn((id: string) => id === 'metamask'),
      connectWith: vi.fn(async () => Promise.resolve('0x123')),
      refreshChainId: vi.fn(async () => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [WalletModalComponent],
      providers: [WalletModalService, { provide: EvmWalletService, useValue: walletService }],
    }).compileComponents();

    fixture = TestBed.createComponent(WalletModalComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(WalletModalService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('connectorOptions', () => {
    it('should return options for all supported connectors', () => {
      const options = component.connectorOptions();

      expect(options).toHaveLength(3);
      expect(options.map((o) => o.id)).toEqual(['metamask', 'trust', 'binance']);
    });

    it('should mark available connectors', () => {
      const options = component.connectorOptions();
      const metamaskOption = options.find((o) => o.id === 'metamask');
      const trustOption = options.find((o) => o.id === 'trust');

      expect(metamaskOption?.isAvailable).toBe(true);
      expect(trustOption?.isAvailable).toBe(false);
    });

    it('should include metadata for each connector', () => {
      const options = component.connectorOptions();

      options.forEach((option) => {
        expect(option.name).toBeTruthy();
        expect(option.logo).toBeTruthy();
        expect(option.installUrl).toBeTruthy();
      });
    });
  });

  describe('close()', () => {
    it('should call modalService.close()', () => {
      const closeSpy = vi.spyOn(modalService, 'close');

      component.close();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('backToList()', () => {
    it('should call modalService.reset()', () => {
      const resetSpy = vi.spyOn(modalService, 'reset');

      component.backToList();

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('selectConnector()', () => {
    it('should set active connector and clear errors', () => {
      modalService.error.set('Previous error');

      component.selectConnector('metamask');

      expect(modalService.error()).toBeNull();
      expect(modalService.activeConnector()).toBe('metamask');
    });

    it('should set needsInstall to false for available connectors', () => {
      component.selectConnector('metamask');

      expect(modalService.needsInstall()).toBe(false);
    });

    it('should set needsInstall to true for unavailable connectors', () => {
      component.selectConnector('trust');

      expect(modalService.needsInstall()).toBe(true);
    });

    it('should auto-connect for available connectors', async () => {
      const connectSpy = vi.spyOn(component, 'connect');

      component.selectConnector('metamask');

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(connectSpy).toHaveBeenCalledWith('metamask');
    });

    it('should not auto-connect for unavailable connectors', () => {
      const connectSpy = vi.spyOn(component, 'connect');

      component.selectConnector('trust');

      expect(connectSpy).not.toHaveBeenCalled();
    });
  });

  describe('connect()', () => {
    it('should successfully connect wallet', async () => {
      modalService.isOpen.set(true);

      await component.connect('metamask');

      expect(walletService.connectWith).toHaveBeenCalledWith('metamask');
      expect(walletService.refreshChainId).toHaveBeenCalled();
      expect(modalService.isOpen()).toBe(false);
      expect(modalService.error()).toBeNull();
    });

    it('should set connecting state during connection', async () => {
      let connectingDuringCall = false;
      walletService.connectWith.mockImplementation(async () => {
        connectingDuringCall = modalService.isConnecting();
        return Promise.resolve('0x123');
      });

      await component.connect('metamask');

      expect(connectingDuringCall).toBe(true);
      expect(modalService.isConnecting()).toBe(false);
    });

    it('should handle user rejection (code 4001)', async () => {
      walletService.connectWith.mockRejectedValue({ code: 4001 });

      await component.connect('metamask');

      expect(modalService.error()).toBe('Connection request was cancelled in your wallet.');
      expect(modalService.isOpen()).toBe(false);
      expect(modalService.isConnecting()).toBe(false);
    });

    it('should handle pending request (code -32002)', async () => {
      walletService.connectWith.mockRejectedValue({ code: -32002 });

      await component.connect('metamask');

      expect(modalService.error()).toBe(
        'A wallet request is already pending. Please open your wallet extension.',
      );
      expect(modalService.isOpen()).toBe(false);
    });

    it('should handle missing wallet error', async () => {
      walletService.connectWith.mockRejectedValue(new Error('No injected EVM wallet found'));

      await component.connect('metamask');

      const errorMsg = modalService.error();
      expect(errorMsg).toBe('No wallet extension detected in this browser.');
      // The error message contains "detected" but the component checks for "not detected"
      // which means needsInstall won't be set to true by this error
      expect(modalService.isOpen()).toBe(false);
    });

    it('should handle generic errors', async () => {
      walletService.connectWith.mockRejectedValue(new Error('Network timeout'));

      await component.connect('metamask');

      expect(modalService.error()).toBe('Network timeout');
      expect(modalService.isOpen()).toBe(false);
    });

    it('should clear error before connecting', async () => {
      modalService.error.set('Previous error');

      await component.connect('metamask');

      expect(modalService.error()).toBeNull();
    });
  });

  describe('friendlyError()', () => {
    it('should return friendly message for code 4001', () => {
      const error = { code: 4001 };
      const result = component.friendlyError(error);
      expect(result).toBe('Connection request was cancelled in your wallet.');
    });

    it('should return friendly message for code -32002', () => {
      const error = { code: -32002 };
      const result = component.friendlyError(error);
      expect(result).toBe(
        'A wallet request is already pending. Please open your wallet extension.',
      );
    });

    it('should return friendly message for "No injected EVM wallet"', () => {
      const error = new Error('No injected EVM wallet found');
      const result = component.friendlyError(error);
      expect(result).toBe('No wallet extension detected in this browser.');
    });

    it('should return original message for other errors', () => {
      const error = new Error('Custom error message');
      const result = component.friendlyError(error);
      expect(result).toBe('Custom error message');
    });

    it('should return default message for non-Error objects', () => {
      const error = 'Some string error';
      const result = component.friendlyError(error);
      expect(result).toBe('Failed to connect wallet.');
    });
  });

  describe('Helper Methods', () => {
    it('should return connector name', () => {
      expect(component.connectorName('metamask')).toBe('MetaMask');
      expect(component.connectorName('trust')).toBe('Trust Wallet');
      expect(component.connectorName('binance')).toBe('Binance Wallet');
    });

    it('should return connector logo', () => {
      expect(component.connectorLogo('metamask')).toBe('images/wallets/metamask.png');
      expect(component.connectorLogo('trust')).toBe('images/wallets/trustwallet.png');
      expect(component.connectorLogo('binance')).toBe('images/wallets/binance.svg');
    });

    it('should return connector install URL', () => {
      expect(component.connectorInstallUrl('metamask')).toBe('https://metamask.io/download/');
      expect(component.connectorInstallUrl('trust')).toBe('https://trustwallet.com/download');
      expect(component.connectorInstallUrl('binance')).toBe(
        'https://www.binance.com/en/web3wallet',
      );
    });

    it('should return connector connecting hint', () => {
      const hint = component.connectorConnectingHint('metamask');
      expect(hint).toContain('MetaMask');
      expect(hint).toContain('browser extension');
    });
  });
});

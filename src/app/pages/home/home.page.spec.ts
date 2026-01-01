import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { HomePage } from './home.page';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { EVM_NETWORKS } from '../../core/evm-networks';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockRouter: Partial<Router>;
  let mockWalletService: Partial<EvmWalletService>;

  // Writable signals for easier test manipulation
  let isConnectedSignal: WritableSignal<boolean>;
  let isInstalledSignal: WritableSignal<boolean>;
  let chainIdSignal: WritableSignal<number | null>;

  beforeEach(() => {
    // Initialize writable signals
    isConnectedSignal = signal(false);
    isInstalledSignal = signal(true);
    chainIdSignal = signal<number | null>(null);

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    mockWalletService = {
      isConnected: isConnectedSignal,
      isInstalled: isInstalledSignal,
      chainId: chainIdSignal,
      hydrate: vi.fn().mockResolvedValue(undefined),
      ensureChain: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: mockRouter },
        { provide: EvmWalletService, useValue: mockWalletService },
      ],
    });

    fixture = TestBed.createComponent(HomePage);
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

    it('should have default form values', () => {
      expect(component.form.controls.direction.value).toBe('ccx-to-evm');
      expect(component.form.controls.fromNetwork.value).toBe('ccx');
      expect(component.form.controls.toNetwork.value).toBe('eth');
    });

    it('should have networks array from EVM_NETWORKS', () => {
      expect(component.networks.length).toBeGreaterThan(0);
    });
  });

  describe('network options', () => {
    it('should include CCX in network options', () => {
      const options = component.networkOptions();
      const ccx = options.find((o) => o.key === 'ccx');
      expect(ccx).toBeDefined();
      expect(ccx?.label).toBe('Conceal');
    });

    it('should include EVM networks in options', () => {
      const options = component.networkOptions();
      expect(options.length).toBeGreaterThan(1);
    });
  });

  describe('display computations', () => {
    it('should return correct fromDisplay', () => {
      const display = component.fromDisplay();
      expect(display?.label).toBe('Conceal');
      expect(display?.subtitle).toBe('Native chain');
    });

    it('should return correct toDisplay', () => {
      const display = component.toDisplay();
      expect(display?.subtitle).toBe('EVM network');
    });
  });

  describe('displayFor method', () => {
    it('should return Conceal for ccx key', () => {
      const display = component.displayFor('ccx');
      expect(display.label).toBe('Conceal');
      expect(display.subtitle).toBe('Native chain');
    });

    it('should return EVM network info for eth key', () => {
      const display = component.displayFor('eth');
      expect(display.subtitle).toBe('EVM network');
    });
  });

  describe('networkLabel method', () => {
    it('should return static label for eth', () => {
      const label = component.networkLabel('eth');
      expect(label).toBe(EVM_NETWORKS.eth.label);
    });

    it('should return static label for bsc', () => {
      const label = component.networkLabel('bsc');
      expect(label).toBe(EVM_NETWORKS.bsc.label);
    });

    it('should return static label for plg', () => {
      const label = component.networkLabel('plg');
      expect(label).toBe(EVM_NETWORKS.plg.label);
    });
  });

  describe('swapNetworks', () => {
    it('should swap from and to networks', () => {
      component.form.controls.fromNetwork.setValue('ccx');
      component.form.controls.toNetwork.setValue('eth');

      component.swapNetworks();

      expect(component.form.controls.fromNetwork.value).toBe('eth');
      expect(component.form.controls.toNetwork.value).toBe('ccx');
    });

    it('should clear network status on swap', () => {
      component.networkSwitchStatus.set('Some status');

      component.swapNetworks();

      expect(component.networkSwitchStatus()).toBeNull();
    });

    it('should update direction when swapping', () => {
      component.form.controls.fromNetwork.setValue('ccx');
      component.form.controls.toNetwork.setValue('eth');
      component.form.controls.direction.setValue('ccx-to-evm');

      component.swapNetworks();

      expect(component.form.controls.direction.value).toBe('evm-to-ccx');
    });
  });

  describe('setFromNetwork', () => {
    it('should set from network to CCX', () => {
      component.form.controls.fromNetwork.setValue('eth');

      component.setFromNetwork('ccx');

      expect(component.form.controls.fromNetwork.value).toBe('ccx');
      expect(component.form.controls.direction.value).toBe('ccx-to-evm');
    });

    it('should set from network to EVM and to network to CCX', () => {
      component.setFromNetwork('bsc');

      expect(component.form.controls.fromNetwork.value).toBe('bsc');
      expect(component.form.controls.toNetwork.value).toBe('ccx');
      expect(component.form.controls.direction.value).toBe('evm-to-ccx');
    });

    it('should swap networks when from equals to', () => {
      component.form.controls.fromNetwork.setValue('ccx');
      component.form.controls.toNetwork.setValue('eth');

      component.setFromNetwork('eth'); // Setting from to match to should swap them

      expect(component.form.controls.fromNetwork.value).toBe('eth');
      expect(component.form.controls.toNetwork.value).toBe('ccx');
      expect(component.networkSwitchStatus()).toBeNull(); // No error
    });

    it('should swap from and to when setting from to match to with ccx', () => {
      component.form.controls.fromNetwork.setValue('eth');
      component.form.controls.toNetwork.setValue('ccx');

      component.setFromNetwork('ccx'); // Setting from to match to should swap them

      // When from is set to match to (ccx), the values swap
      expect(component.form.controls.fromNetwork.value).toBe('ccx');
      expect(component.form.controls.toNetwork.value).toBe('eth');
      expect(component.form.controls.direction.value).toBe('ccx-to-evm');
      expect(component.networkSwitchStatus()).toBeNull(); // No error
    });

    it('should clear status on successful change', () => {
      component.networkSwitchStatus.set('Old status');

      component.setFromNetwork('bsc');

      expect(component.networkSwitchStatus()).toBeNull();
    });
  });

  describe('setToNetwork', () => {
    it('should set to network to CCX', () => {
      component.form.controls.fromNetwork.setValue('eth');

      component.setToNetwork('ccx');

      expect(component.form.controls.toNetwork.value).toBe('ccx');
      expect(component.form.controls.direction.value).toBe('evm-to-ccx');
    });

    it('should set to network to EVM and from network to CCX', () => {
      component.setToNetwork('eth');

      expect(component.form.controls.toNetwork.value).toBe('eth');
      expect(component.form.controls.fromNetwork.value).toBe('ccx');
      expect(component.form.controls.direction.value).toBe('ccx-to-evm');
    });

    it('should swap networks when to equals from', () => {
      component.form.controls.fromNetwork.setValue('eth');
      component.form.controls.toNetwork.setValue('ccx');

      component.setToNetwork('eth'); // Setting to to match from should swap them

      expect(component.form.controls.fromNetwork.value).toBe('ccx');
      expect(component.form.controls.toNetwork.value).toBe('eth');
      expect(component.networkSwitchStatus()).toBeNull(); // No error
    });

    it('should clear status on successful change', () => {
      component.networkSwitchStatus.set('Old status');

      component.setToNetwork('plg');

      expect(component.networkSwitchStatus()).toBeNull();
    });
  });

  describe('normalizeNetworks', () => {
    it('should prevent CCX to CCX', () => {
      component.form.controls.fromNetwork.setValue('ccx');
      component.form.controls.toNetwork.setValue('ccx');

      component.normalizeNetworks();

      expect(component.form.controls.toNetwork.value).not.toBe('ccx');
    });

    it('should prevent EVM to EVM', () => {
      component.form.controls.fromNetwork.setValue('eth');
      component.form.controls.toNetwork.setValue('bsc');

      component.normalizeNetworks();

      expect(component.form.controls.fromNetwork.value).toBe('ccx');
    });

    it('should set direction to ccx-to-evm when from is ccx', () => {
      component.form.controls.fromNetwork.setValue('ccx');
      component.form.controls.toNetwork.setValue('eth');

      component.normalizeNetworks();

      expect(component.form.controls.direction.value).toBe('ccx-to-evm');
    });

    it('should set direction to evm-to-ccx when to is ccx', () => {
      component.form.controls.fromNetwork.setValue('eth');
      component.form.controls.toNetwork.setValue('ccx');

      component.normalizeNetworks();

      expect(component.form.controls.direction.value).toBe('evm-to-ccx');
    });
  });

  describe('switchWalletToSelectedNetwork', () => {
    it('should show message when wallet not installed', async () => {
      isInstalledSignal.set(false);

      await component.switchWalletToSelectedNetwork();

      expect(component.networkSwitchStatus()).toBe('Install MetaMask to switch networks.');
    });

    it('should show message when candidate is CCX', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      // Manually set toNetwork to 'ccx' to test the edge case
      component.form.controls.toNetwork.setValue('ccx');

      await component.switchWalletToSelectedNetwork();

      expect(component.networkSwitchStatus()).toBe('Select an EVM network to switch your wallet.');
    });

    it('should show message when already on target chain', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('eth');
      chainIdSignal.set(11155111); // Sepolia testnet in development mode

      await component.switchWalletToSelectedNetwork();

      expect(component.networkSwitchStatus()).toBe('Wallet already on Sepolia Testnet.');
    });

    it('should switch chain successfully', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('bsc');
      chainIdSignal.set(11155111); // Sepolia testnet (current chain in dev mode)

      await component.switchWalletToSelectedNetwork();

      expect(mockWalletService.ensureChain).toHaveBeenCalled();
      expect(component.networkSwitchStatus()).toBe('Switched wallet to BNB Smart Chain Testnet.');
    });

    it('should handle user rejection (code 4001)', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('bsc');
      chainIdSignal.set(1);
      const error = new Error('User rejected') as Error & { code: number };
      error.code = 4001;
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce(error);

      await component.switchWalletToSelectedNetwork();

      expect(component.networkSwitchStatus()).toBe('Network switch was cancelled in your wallet.');
    });

    it('should handle pending request (code -32002)', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('bsc');
      chainIdSignal.set(1);
      const error = new Error('Pending') as Error & { code: number };
      error.code = -32002;
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce(error);

      await component.switchWalletToSelectedNetwork();

      expect(component.networkSwitchStatus()).toBe(
        'A wallet request is already pending. Please open your wallet.',
      );
    });

    it('should handle generic errors', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('bsc');
      chainIdSignal.set(1);
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce(new Error('Unknown error'));

      await component.switchWalletToSelectedNetwork();

      expect(component.networkSwitchStatus()).toBe('Unknown error');
    });

    it('should handle non-Error exceptions', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('bsc');
      chainIdSignal.set(1);
      vi.mocked(mockWalletService.ensureChain!).mockRejectedValueOnce('string error');

      await component.switchWalletToSelectedNetwork();

      expect(component.networkSwitchStatus()).toBe('Network switch failed.');
    });

    it('should set isSwitchingNetwork during operation', async () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('bsc');
      chainIdSignal.set(1);

      let resolveEnsure: () => void;
      const ensurePromise = new Promise<void>((resolve) => {
        resolveEnsure = resolve;
      });
      vi.mocked(mockWalletService.ensureChain!).mockReturnValueOnce(ensurePromise);

      const switchPromise = component.switchWalletToSelectedNetwork();

      expect(component.isSwitchingNetwork()).toBe(true);

      resolveEnsure!();
      await switchPromise;

      expect(component.isSwitchingNetwork()).toBe(false);
    });
  });

  describe('go method', () => {
    beforeEach(() => {
      isConnectedSignal.set(true);
    });

    it('should navigate to swap page with correct params', () => {
      component.form.controls.direction.setValue('ccx-to-evm');
      component.form.controls.toNetwork.setValue('bsc');

      component.go();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/swap', 'ccx-to-evm', 'bsc']);
    });

    it('should navigate with evm-to-ccx direction', () => {
      component.form.controls.direction.setValue('evm-to-ccx');
      component.form.controls.fromNetwork.setValue('eth');
      component.form.controls.toNetwork.setValue('ccx');

      component.go();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/swap', 'evm-to-ccx', 'eth']);
    });

    it('should show error when from equals to', () => {
      component.form.controls.fromNetwork.setValue('eth');
      component.form.controls.toNetwork.setValue('eth');

      component.go();

      expect(component.networkSwitchStatus()).toBe('Please choose different From and To networks.');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should show error for EVM to EVM', () => {
      component.form.controls.fromNetwork.setValue('eth');
      component.form.controls.toNetwork.setValue('bsc');

      component.go();

      expect(component.networkSwitchStatus()).toBe(
        'Direct EVM-to-EVM swaps are not supported yet. Choose Conceal on one side.',
      );
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should show error for CCX to CCX', () => {
      component.form.controls.fromNetwork.setValue('ccx');
      component.form.controls.toNetwork.setValue('ccx');

      component.go();

      // CCX to CCX triggers the from === to check first
      expect(component.networkSwitchStatus()).toBe('Please choose different From and To networks.');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('external links', () => {
    let windowOpenSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
      windowOpenSpy.mockRestore();
    });

    it('should open user guide in new tab', () => {
      component.openUserGuide();

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://concealnetwork.medium.com/conceal-bridge-user-guide-2ad03eee4963',
        '_blank',
      );
    });

    it('should open MetaMask download in new tab', () => {
      component.openMetaMask();

      expect(windowOpenSpy).toHaveBeenCalledWith('https://metamask.io/download.html', '_blank');
    });
  });

  describe('form controls', () => {
    it('should have direction signal', () => {
      expect(component.direction()).toBe('ccx-to-evm');
    });

    it('should have fromKey signal', () => {
      expect(component.fromKey()).toBe('ccx');
    });

    it('should have toKey signal', () => {
      expect(component.toKey()).toBe('eth');
    });
  });

  describe('template rendering', () => {
    it('should display page title', () => {
      const title = fixture.nativeElement.querySelector('h1');
      expect(title.textContent).toContain('Conceal Bridge');
    });

    it('should display description', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Swap between Conceal');
    });

    it('should show Connect Wallet button when not connected', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Connect Wallet');
    });

    it('should show Continue button when connected', () => {
      isConnectedSignal.set(true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Continue');
    });

    it('should display User guide card', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('User guide');
    });

    it('should display MetaMask card', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Get MetaMask');
    });
  });
});

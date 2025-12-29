import { TestBed } from '@angular/core/testing';
import { WalletModalService } from './wallet-modal.service';

describe('WalletModalService', () => {
  let service: WalletModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('open()', () => {
    it('should open modal and reset state', () => {
      // Set some state first
      service.error.set('Previous error');
      service.activeConnector.set('metamask');
      service.isConnecting.set(true);
      service.needsInstall.set(true);

      service.open();

      expect(service.isOpen()).toBe(true);
      expect(service.error()).toBeNull();
      expect(service.activeConnector()).toBeNull();
      expect(service.isConnecting()).toBe(false);
      expect(service.needsInstall()).toBe(false);
    });
  });

  describe('close()', () => {
    it('should close modal', () => {
      service.isOpen.set(true);

      service.close();

      expect(service.isOpen()).toBe(false);
    });
  });

  describe('setActiveConnector()', () => {
    it('should set active connector', () => {
      service.setActiveConnector('metamask');
      expect(service.activeConnector()).toBe('metamask');

      service.setActiveConnector('trust');
      expect(service.activeConnector()).toBe('trust');
    });

    it('should accept null', () => {
      service.setActiveConnector('metamask');
      service.setActiveConnector(null);
      expect(service.activeConnector()).toBeNull();
    });
  });

  describe('setError()', () => {
    it('should set error message', () => {
      service.setError('Connection failed');
      expect(service.error()).toBe('Connection failed');
    });

    it('should accept null to clear error', () => {
      service.setError('Error message');
      service.setError(null);
      expect(service.error()).toBeNull();
    });
  });

  describe('setIsConnecting()', () => {
    it('should set connecting state', () => {
      service.setIsConnecting(true);
      expect(service.isConnecting()).toBe(true);

      service.setIsConnecting(false);
      expect(service.isConnecting()).toBe(false);
    });
  });

  describe('setNeedsInstall()', () => {
    it('should set needs install state', () => {
      service.setNeedsInstall(true);
      expect(service.needsInstall()).toBe(true);

      service.setNeedsInstall(false);
      expect(service.needsInstall()).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset all state except isOpen', () => {
      service.isOpen.set(true);
      service.error.set('Error message');
      service.activeConnector.set('metamask');
      service.isConnecting.set(true);
      service.needsInstall.set(true);

      service.reset();

      // isOpen is not affected by reset
      expect(service.isOpen()).toBe(true);
      // Other state is reset
      expect(service.error()).toBeNull();
      expect(service.activeConnector()).toBeNull();
      expect(service.isConnecting()).toBe(false);
      expect(service.needsInstall()).toBe(false);
    });
  });
});

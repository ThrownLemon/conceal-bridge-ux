import { TestBed } from '@angular/core/testing';

import { TransactionHistoryService } from './transaction-history.service';
import { StoredTransaction } from './bridge-types';

const STORAGE_KEY = 'conceal_bridge_tx_history';

describe('TransactionHistoryService', () => {
  let service: TransactionHistoryService;
  let mockLocalStorage: Record<string, string>;

  function createMockTransaction(overrides: Partial<StoredTransaction> = {}): StoredTransaction {
    return {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      amount: 100,
      direction: 'ccx-to-evm',
      network: 'eth',
      status: 'pending',
      ...overrides,
    };
  }

  function setupLocalStorage(data: Record<string, string> = {}): void {
    mockLocalStorage = { ...data };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return mockLocalStorage[key] ?? null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};
    setupLocalStorage();

    TestBed.configureTestingModule({
      providers: [TransactionHistoryService],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(TransactionHistoryService);
      expect(service).toBeTruthy();
    });

    it('should start with empty transactions when localStorage is empty', () => {
      service = TestBed.inject(TransactionHistoryService);
      expect(service.transactions()).toEqual([]);
    });

    it('should start with isOpen as false', () => {
      service = TestBed.inject(TransactionHistoryService);
      expect(service.isOpen()).toBe(false);
    });

    it('should load transactions from localStorage on init', () => {
      const storedTxs: StoredTransaction[] = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ];
      setupLocalStorage({ [STORAGE_KEY]: JSON.stringify(storedTxs) });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [TransactionHistoryService] });
      service = TestBed.inject(TransactionHistoryService);

      expect(service.transactions().length).toBe(2);
      expect(service.transactions()[0].id).toBe('tx-1');
      expect(service.transactions()[1].id).toBe('tx-2');
    });
  });

  describe('localStorage error handling', () => {
    it('should handle malformed JSON in localStorage gracefully', () => {
      setupLocalStorage({ [STORAGE_KEY]: 'not valid json{' });

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [TransactionHistoryService] });
      service = TestBed.inject(TransactionHistoryService);

      expect(service.transactions()).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith('Failed to load transaction history', expect.any(Error));
    });

    it('should handle non-array data in localStorage gracefully', () => {
      setupLocalStorage({ [STORAGE_KEY]: JSON.stringify({ notAnArray: true }) });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [TransactionHistoryService] });
      service = TestBed.inject(TransactionHistoryService);

      expect(service.transactions()).toEqual([]);
    });

    it('should handle null stored value', () => {
      setupLocalStorage({ [STORAGE_KEY]: 'null' });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [TransactionHistoryService] });
      service = TestBed.inject(TransactionHistoryService);

      expect(service.transactions()).toEqual([]);
    });

    it('should handle localStorage.setItem throwing', () => {
      service = TestBed.inject(TransactionHistoryService);

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      // Should not throw
      expect(() => service.addTransaction(createMockTransaction())).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith('Failed to save transaction history', expect.any(Error));
    });
  });

  describe('addTransaction', () => {
    beforeEach(() => {
      service = TestBed.inject(TransactionHistoryService);
    });

    it('should add a transaction to the list', () => {
      const tx = createMockTransaction({ id: 'new-tx' });
      service.addTransaction(tx);

      expect(service.transactions().length).toBe(1);
      expect(service.transactions()[0].id).toBe('new-tx');
    });

    it('should add new transactions to the top of the list', () => {
      const tx1 = createMockTransaction({ id: 'tx-1' });
      const tx2 = createMockTransaction({ id: 'tx-2' });

      service.addTransaction(tx1);
      service.addTransaction(tx2);

      expect(service.transactions()[0].id).toBe('tx-2');
      expect(service.transactions()[1].id).toBe('tx-1');
    });

    it('should limit transactions to 5', () => {
      for (let i = 1; i <= 7; i++) {
        service.addTransaction(createMockTransaction({ id: `tx-${i}` }));
      }

      expect(service.transactions().length).toBe(5);
      // Most recent should be first
      expect(service.transactions()[0].id).toBe('tx-7');
      expect(service.transactions()[4].id).toBe('tx-3');
    });

    it('should persist to localStorage after adding', () => {
      const tx = createMockTransaction({ id: 'persist-tx' });
      service.addTransaction(tx);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('persist-tx'),
      );
    });

    it('should preserve transaction properties correctly', () => {
      const tx: StoredTransaction = {
        id: 'full-tx',
        timestamp: 1704067200000,
        amount: 250.5,
        direction: 'evm-to-ccx',
        network: 'bsc',
        status: 'completed',
        depositHash: '0xabc123',
        swapHash: '0xdef456',
        recipientAddress: 'ccx7...',
      };

      service.addTransaction(tx);

      const stored = service.transactions()[0];
      expect(stored.id).toBe('full-tx');
      expect(stored.timestamp).toBe(1704067200000);
      expect(stored.amount).toBe(250.5);
      expect(stored.direction).toBe('evm-to-ccx');
      expect(stored.network).toBe('bsc');
      expect(stored.status).toBe('completed');
      expect(stored.depositHash).toBe('0xabc123');
      expect(stored.swapHash).toBe('0xdef456');
      expect(stored.recipientAddress).toBe('ccx7...');
    });
  });

  describe('clearHistory', () => {
    beforeEach(() => {
      service = TestBed.inject(TransactionHistoryService);
    });

    it('should clear all transactions', () => {
      service.addTransaction(createMockTransaction());
      service.addTransaction(createMockTransaction());

      expect(service.transactions().length).toBe(2);

      service.clearHistory();

      expect(service.transactions()).toEqual([]);
    });

    it('should persist empty array to localStorage', () => {
      service.addTransaction(createMockTransaction());
      service.clearHistory();

      expect(localStorage.setItem).toHaveBeenLastCalledWith(STORAGE_KEY, '[]');
    });

    it('should work when already empty', () => {
      expect(service.transactions()).toEqual([]);
      service.clearHistory();
      expect(service.transactions()).toEqual([]);
    });
  });

  describe('sidebar visibility', () => {
    beforeEach(() => {
      service = TestBed.inject(TransactionHistoryService);
    });

    describe('toggle', () => {
      it('should toggle isOpen from false to true', () => {
        expect(service.isOpen()).toBe(false);
        service.toggle();
        expect(service.isOpen()).toBe(true);
      });

      it('should toggle isOpen from true to false', () => {
        service.open();
        expect(service.isOpen()).toBe(true);
        service.toggle();
        expect(service.isOpen()).toBe(false);
      });

      it('should toggle multiple times correctly', () => {
        service.toggle();
        expect(service.isOpen()).toBe(true);
        service.toggle();
        expect(service.isOpen()).toBe(false);
        service.toggle();
        expect(service.isOpen()).toBe(true);
      });
    });

    describe('open', () => {
      it('should set isOpen to true', () => {
        service.open();
        expect(service.isOpen()).toBe(true);
      });

      it('should keep isOpen true when already open', () => {
        service.open();
        service.open();
        expect(service.isOpen()).toBe(true);
      });
    });

    describe('close', () => {
      it('should set isOpen to false', () => {
        service.open();
        service.close();
        expect(service.isOpen()).toBe(false);
      });

      it('should keep isOpen false when already closed', () => {
        service.close();
        expect(service.isOpen()).toBe(false);
      });
    });
  });

  describe('transactions signal', () => {
    beforeEach(() => {
      service = TestBed.inject(TransactionHistoryService);
    });

    it('should be readonly', () => {
      // The transactions signal should be a readonly signal
      // Verify it doesn't have set/update methods exposed
      const txSignal = service.transactions;
      expect(typeof txSignal).toBe('function');
      expect((txSignal as unknown as Record<string, unknown>)['set']).toBeUndefined();
      expect((txSignal as unknown as Record<string, unknown>)['update']).toBeUndefined();
    });

    it('should return same array reference when not modified', () => {
      const ref1 = service.transactions();
      const ref2 = service.transactions();
      expect(ref1).toBe(ref2);
    });

    it('should return new array reference after modification', () => {
      const ref1 = service.transactions();
      service.addTransaction(createMockTransaction());
      const ref2 = service.transactions();
      expect(ref1).not.toBe(ref2);
    });
  });

  describe('data persistence across service instances', () => {
    it('should persist data between service instances', () => {
      service = TestBed.inject(TransactionHistoryService);
      service.addTransaction(createMockTransaction({ id: 'persisted-tx' }));

      // Create new instance (simulating app reload)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [TransactionHistoryService] });
      const newService = TestBed.inject(TransactionHistoryService);

      expect(newService.transactions().length).toBe(1);
      expect(newService.transactions()[0].id).toBe('persisted-tx');
    });

    it('should respect 5-item limit on reload', () => {
      // Store 5 items directly in localStorage
      const storedTxs: StoredTransaction[] = Array.from({ length: 5 }, (_, i) =>
        createMockTransaction({ id: `stored-${i}` }),
      );
      setupLocalStorage({ [STORAGE_KEY]: JSON.stringify(storedTxs) });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [TransactionHistoryService] });
      service = TestBed.inject(TransactionHistoryService);

      // Add one more, should push oldest out
      service.addTransaction(createMockTransaction({ id: 'new-tx' }));

      expect(service.transactions().length).toBe(5);
      expect(service.transactions()[0].id).toBe('new-tx');
    });
  });

  describe('transaction filtering by network/direction', () => {
    beforeEach(() => {
      service = TestBed.inject(TransactionHistoryService);
    });

    it('should store transactions with different networks', () => {
      service.addTransaction(createMockTransaction({ id: 'eth-tx', network: 'eth' }));
      service.addTransaction(createMockTransaction({ id: 'bsc-tx', network: 'bsc' }));
      service.addTransaction(createMockTransaction({ id: 'poly-tx', network: 'plg' }));

      const networks = service.transactions().map((t) => t.network);
      expect(networks).toContain('eth');
      expect(networks).toContain('bsc');
      expect(networks).toContain('plg');
    });

    it('should store transactions with different directions', () => {
      service.addTransaction(createMockTransaction({ id: 'wrap-tx', direction: 'ccx-to-evm' }));
      service.addTransaction(createMockTransaction({ id: 'unwrap-tx', direction: 'evm-to-ccx' }));

      const directions = service.transactions().map((t) => t.direction);
      expect(directions).toContain('ccx-to-evm');
      expect(directions).toContain('evm-to-ccx');
    });
  });
});

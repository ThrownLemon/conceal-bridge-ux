import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TransactionHistoryComponent } from './transaction-history.component';
import { TransactionHistoryService } from '../../core/transaction-history.service';
import type { StoredTransaction } from '../../core/bridge-types';

describe('TransactionHistoryComponent', () => {
  let component: TransactionHistoryComponent;
  let fixture: ComponentFixture<TransactionHistoryComponent>;
  let mockService: {
    isOpen: ReturnType<typeof signal<boolean>>;
    transactions: ReturnType<typeof signal<StoredTransaction[]>>;
    close: ReturnType<typeof vi.fn>;
    open: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
  };

  const mockTransaction: StoredTransaction = {
    id: 'tx-123',
    direction: 'ccx-to-evm',
    amount: 1000,
    status: 'completed',
    timestamp: Date.now() - 60000, // 1 minute ago
    network: 'bsc',
    depositHash: '0xdeposit123456789012345678901234567890',
    swapHash: '0xswap12345678901234567890123456789012',
  };

  const mockTransactionEvmToCcx: StoredTransaction = {
    id: 'tx-456',
    direction: 'evm-to-ccx',
    amount: 500,
    status: 'completed',
    timestamp: Date.now() - 120000,
    network: 'eth',
  };

  const mockPendingTransaction: StoredTransaction = {
    id: 'tx-789',
    direction: 'ccx-to-evm',
    amount: 750,
    status: 'pending',
    timestamp: Date.now() - 30000, // 30 seconds ago
    network: 'eth',
  };

  beforeEach(() => {
    mockService = {
      isOpen: signal(false),
      transactions: signal<StoredTransaction[]>([]),
      close: vi.fn(),
      open: vi.fn(),
      toggle: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TransactionHistoryComponent],
      providers: [
        provideNoopAnimations(),
        { provide: TransactionHistoryService, useValue: mockService },
      ],
    });

    fixture = TestBed.createComponent(TransactionHistoryComponent);
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

    it('should inject TransactionHistoryService', () => {
      expect(component.service).toBeDefined();
    });

    it('should initialize copyStatus as null', () => {
      expect(component.copyStatus()).toBeNull();
    });
  });

  describe('sidebar visibility', () => {
    it('should not show backdrop when closed', () => {
      mockService.isOpen.set(false);
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.bg-black\\/50');
      expect(backdrop).toBeNull();
    });

    it('should show backdrop when open', () => {
      mockService.isOpen.set(true);
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.bg-black\\/50');
      expect(backdrop).toBeTruthy();
    });

    it('should call close when backdrop is clicked', () => {
      mockService.isOpen.set(true);
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.bg-black\\/50');
      backdrop.click();

      expect(mockService.close).toHaveBeenCalled();
    });

    it('should have translate-x-full class when closed', () => {
      mockService.isOpen.set(false);
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('aside');
      expect(sidebar.classList.contains('translate-x-full')).toBe(true);
    });

    it('should have translate-x-0 class when open', () => {
      mockService.isOpen.set(true);
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('aside');
      expect(sidebar.classList.contains('translate-x-0')).toBe(true);
    });
  });

  describe('empty state', () => {
    it('should show empty state message when no transactions', () => {
      mockService.transactions.set([]);
      fixture.detectChanges();

      const emptyMsg = fixture.nativeElement.textContent;
      expect(emptyMsg).toContain('No recent transactions');
    });

    it('should show clock icon in empty state', () => {
      mockService.transactions.set([]);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('z-icon[zType="clock"]');
      expect(icon).toBeTruthy();
    });
  });

  describe('transaction list', () => {
    it('should display transactions when available', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('z-card');
      expect(cards.length).toBe(1);
    });

    it('should display multiple transactions', () => {
      mockService.transactions.set([mockTransaction, mockTransactionEvmToCcx]);
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('z-card');
      expect(cards.length).toBe(2);
    });

    it('should show correct direction label for ccx-to-evm', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('CCX → wCCX');
    });

    it('should show correct direction label for evm-to-ccx', () => {
      mockService.transactions.set([mockTransactionEvmToCcx]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('wCCX → CCX');
    });

    it('should display transaction amount', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('1,000');
    });

    it('should display deposit hash when available', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Deposit Hash');
      expect(content).toContain('0xdepo');
    });

    it('should display swap hash when available', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Swap Hash');
    });

    it('should not display hashes when not available', () => {
      mockService.transactions.set([mockTransactionEvmToCcx]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).not.toContain('Deposit Hash');
      expect(content).not.toContain('Swap Hash');
    });
  });

  describe('getRelativeTime', () => {
    it('should return relative time string', () => {
      const oneMinuteAgo = Date.now() - 60000;
      const result = component.getRelativeTime(oneMinuteAgo);
      expect(result).toContain('minute');
    });

    it('should include "ago" suffix', () => {
      const oneHourAgo = Date.now() - 3600000;
      const result = component.getRelativeTime(oneHourAgo);
      expect(result).toContain('ago');
    });
  });

  describe('copy functionality', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    it('should copy text to clipboard', async () => {
      const text = '0xtest123';
      await component.copy(text);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    });

    it('should set copyStatus to copied on success', async () => {
      await component.copy('0xtest123');

      expect(component.copyStatus()).toEqual({ hash: '0xtest123', status: 'copied' });
    });

    it('should set copyStatus to failed on error', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Copy failed')),
        },
      });

      await component.copy('0xtest123');

      expect(component.copyStatus()).toEqual({ hash: '0xtest123', status: 'failed' });
    });

    it('should clear copyStatus after 2 seconds', async () => {
      vi.useFakeTimers();
      await component.copy('0xtest123');
      expect(component.copyStatus()).not.toBeNull();

      vi.advanceTimersByTime(2000);

      expect(component.copyStatus()).toBeNull();
      vi.useRealTimers();
    });

    it('should not clear copyStatus if hash changed', async () => {
      vi.useFakeTimers();
      await component.copy('0xtest123');
      component.copyStatus.set({ hash: '0xdifferent', status: 'copied' });

      vi.advanceTimersByTime(2000);

      expect(component.copyStatus()).toEqual({ hash: '0xdifferent', status: 'copied' });
      vi.useRealTimers();
    });
  });

  describe('getCopyLabel', () => {
    it('should return "Copy Hash" when no status', () => {
      expect(component.getCopyLabel('0xtest')).toBe('Copy Hash');
    });

    it('should return "Copied!" when status is copied for matching hash', () => {
      component.copyStatus.set({ hash: '0xtest', status: 'copied' });
      expect(component.getCopyLabel('0xtest')).toBe('Copied!');
    });

    it('should return "Copy failed" when status is failed for matching hash', () => {
      component.copyStatus.set({ hash: '0xtest', status: 'failed' });
      expect(component.getCopyLabel('0xtest')).toBe('Copy failed');
    });

    it('should return "Copy Hash" for non-matching hash', () => {
      component.copyStatus.set({ hash: '0xtest', status: 'copied' });
      expect(component.getCopyLabel('0xother')).toBe('Copy Hash');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockService.isOpen.set(true);
      fixture.detectChanges();
    });

    it('should have role="dialog" on sidebar', () => {
      const sidebar = fixture.nativeElement.querySelector('aside');
      expect(sidebar.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true"', () => {
      const sidebar = fixture.nativeElement.querySelector('aside');
      expect(sidebar.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby pointing to title', () => {
      const sidebar = fixture.nativeElement.querySelector('aside');
      expect(sidebar.getAttribute('aria-labelledby')).toBe('transaction-history-title');
    });

    it('should have title with matching id', () => {
      const title = fixture.nativeElement.querySelector('#transaction-history-title');
      expect(title).toBeTruthy();
      expect(title.textContent.trim()).toBe('Recent Activity');
    });

    it('should have aria-hidden attribute on sidebar', () => {
      const sidebar = fixture.nativeElement.querySelector('aside');
      expect(sidebar.getAttribute('aria-hidden')).toBe('false');

      mockService.isOpen.set(false);
      fixture.detectChanges();
      expect(sidebar.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have close button with aria-label', () => {
      const closeBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Close transaction history"]',
      );
      expect(closeBtn).toBeTruthy();
    });

    it('should have sr-only text on close button', () => {
      const closeBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Close transaction history"]',
      );
      const srOnly = closeBtn?.querySelector('.sr-only');
      expect(srOnly?.textContent.trim()).toBe('Close');
    });

    it('should have aria-live region for copy status', () => {
      const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
    });
  });

  describe('close button', () => {
    beforeEach(() => {
      mockService.isOpen.set(true);
      fixture.detectChanges();
    });

    it('should call service.close when close button clicked', () => {
      const closeBtn = fixture.nativeElement.querySelector(
        'button[aria-label="Close transaction history"]',
      );
      closeBtn.click();

      expect(mockService.close).toHaveBeenCalled();
    });
  });

  describe('direction icons', () => {
    it('should show arrow-down icon for ccx-to-evm', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('z-icon[zType="arrow-down"]');
      expect(icon).toBeTruthy();
    });

    it('should show arrow-up icon for evm-to-ccx', () => {
      mockService.transactions.set([mockTransactionEvmToCcx]);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('z-icon[zType="arrow-up"]');
      expect(icon).toBeTruthy();
    });
  });

  describe('status badge', () => {
    it('should show Completed badge for completed transactions', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Completed');
    });

    it('should show Pending badge for pending transactions', () => {
      mockService.transactions.set([mockPendingTransaction]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Pending');
    });

    it('should apply completed variant styles to badge for completed transactions', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('z-badge');
      expect(badge).toBeTruthy();
      // Check for green color classes specific to completed variant
      expect(badge.className).toContain('text-green-600');
    });

    it('should apply pending variant styles to badge for pending transactions', () => {
      mockService.transactions.set([mockPendingTransaction]);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('z-badge');
      expect(badge).toBeTruthy();
      // Check for amber color classes specific to pending variant
      expect(badge.className).toContain('text-amber-600');
    });

    it('should display both pending and completed badges correctly when mixed', () => {
      mockService.transactions.set([mockTransaction, mockPendingTransaction]);
      fixture.detectChanges();

      const badges = fixture.nativeElement.querySelectorAll('z-badge');
      expect(badges.length).toBe(2);

      // First transaction (completed) - should have green styling
      expect(badges[0].className).toContain('text-green-600');
      expect(badges[0].textContent.trim()).toContain('Completed');

      // Second transaction (pending) - should have amber styling
      expect(badges[1].className).toContain('text-amber-600');
      expect(badges[1].textContent.trim()).toContain('Pending');
    });
  });

  describe('currency display', () => {
    it('should show CCX for ccx-to-evm direction', () => {
      mockService.transactions.set([mockTransaction]);
      fixture.detectChanges();

      // Check for CCX label next to amount
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('CCX');
    });

    it('should show wCCX for evm-to-ccx direction', () => {
      mockService.transactions.set([mockTransactionEvmToCcx]);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('wCCX');
    });
  });
});

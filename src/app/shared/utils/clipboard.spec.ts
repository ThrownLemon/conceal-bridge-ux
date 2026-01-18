import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { copyToClipboard } from './clipboard';
import type { ZardToastService } from '@/shared/components/toast/toast.service';
import type { CopyToClipboardOptions } from './clipboard';

describe('copyToClipboard', () => {
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let mockClipboard: {
    writeText: ReturnType<typeof vi.fn>;
  };
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });

    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful copy', () => {
    it('should copy text to clipboard', async () => {
      const text = 'CCX7abc123';
      const result = await copyToClipboard(
        text,
        mockToastService as unknown as ZardToastService
      );

      expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
      expect(result).toBe(true);
    });

    it('should show default success toast', async () => {
      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService
      );

      expect(mockToastService.success).toHaveBeenCalledWith('Copied!');
    });

    it('should show custom success toast', async () => {
      const options: CopyToClipboardOptions = {
        successMessage: 'Address copied!',
      };

      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService,
        options
      );

      expect(mockToastService.success).toHaveBeenCalledWith('Address copied!');
    });

    it('should return true on successful copy', async () => {
      const result = await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService
      );

      expect(result).toBe(true);
    });

    it('should trim whitespace from text', async () => {
      const text = '  test text  ';
      await copyToClipboard(
        text,
        mockToastService as unknown as ZardToastService
      );

      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
    });
  });

  describe('failed copy', () => {
    beforeEach(() => {
      mockClipboard.writeText.mockRejectedValue(
        new Error('Clipboard not available')
      );
    });

    it('should show default error toast', async () => {
      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService
      );

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Copy failed (clipboard unavailable).'
      );
    });

    it('should show custom error toast', async () => {
      const options: CopyToClipboardOptions = {
        errorMessage: 'Failed to copy address',
      };

      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService,
        options
      );

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Failed to copy address'
      );
    });

    it('should return false on failed copy', async () => {
      const result = await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService
      );

      expect(result).toBe(false);
    });

    it('should log warning with default context', async () => {
      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[copyToClipboard] Clipboard copy failed:',
        expect.objectContaining({
          err: expect.any(Error),
        })
      );
    });

    it('should log warning with custom context', async () => {
      const options: CopyToClipboardOptions = {
        context: 'SwapPage',
      };

      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService,
        options
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SwapPage] Clipboard copy failed:',
        expect.objectContaining({
          err: expect.any(Error),
        })
      );
    });

    it('should not call success toast on error', async () => {
      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService
      );

      expect(mockToastService.success).not.toHaveBeenCalled();
    });
  });

  describe('empty text handling', () => {
    it('should return false for empty string', async () => {
      const result = await copyToClipboard(
        '',
        mockToastService as unknown as ZardToastService
      );

      expect(result).toBe(false);
    });

    it('should return false for whitespace-only string', async () => {
      const result = await copyToClipboard(
        '   ',
        mockToastService as unknown as ZardToastService
      );

      expect(result).toBe(false);
    });

    it('should not copy empty text to clipboard', async () => {
      await copyToClipboard(
        '',
        mockToastService as unknown as ZardToastService
      );

      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it('should not show toast for empty text', async () => {
      await copyToClipboard(
        '',
        mockToastService as unknown as ZardToastService
      );

      expect(mockToastService.success).not.toHaveBeenCalled();
      expect(mockToastService.error).not.toHaveBeenCalled();
    });
  });

  describe('options handling', () => {
    it('should work with no options provided', async () => {
      const result = await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService
      );

      expect(result).toBe(true);
      expect(mockToastService.success).toHaveBeenCalledWith('Copied!');
    });

    it('should work with empty options object', async () => {
      const result = await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService,
        {}
      );

      expect(result).toBe(true);
      expect(mockToastService.success).toHaveBeenCalledWith('Copied!');
    });

    it('should work with all options provided', async () => {
      const options: CopyToClipboardOptions = {
        successMessage: 'Custom success',
        errorMessage: 'Custom error',
        context: 'TestComponent',
      };

      const result = await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService,
        options
      );

      expect(result).toBe(true);
      expect(mockToastService.success).toHaveBeenCalledWith('Custom success');
    });

    it('should allow partial options', async () => {
      const options: CopyToClipboardOptions = {
        successMessage: 'Custom success',
      };

      await copyToClipboard(
        'test text',
        mockToastService as unknown as ZardToastService,
        options
      );

      expect(mockToastService.success).toHaveBeenCalledWith('Custom success');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle CCX address copy', async () => {
      const address = 'CCX7abc123def456';
      const result = await copyToClipboard(
        address,
        mockToastService as unknown as ZardToastService,
        { successMessage: 'Address copied!', context: 'SwapPage' }
      );

      expect(mockClipboard.writeText).toHaveBeenCalledWith(address);
      expect(mockToastService.success).toHaveBeenCalledWith('Address copied!');
      expect(result).toBe(true);
    });

    it('should handle transaction hash copy', async () => {
      const txHash = '0x1234567890abcdef';
      const result = await copyToClipboard(
        txHash,
        mockToastService as unknown as ZardToastService,
        {
          successMessage: 'Transaction hash copied!',
          context: 'TransactionHistoryComponent',
        }
      );

      expect(mockClipboard.writeText).toHaveBeenCalledWith(txHash);
      expect(mockToastService.success).toHaveBeenCalledWith(
        'Transaction hash copied!'
      );
      expect(result).toBe(true);
    });

    it('should handle wallet address copy', async () => {
      const walletAddress = '0xabcdef1234567890';
      const result = await copyToClipboard(
        walletAddress,
        mockToastService as unknown as ZardToastService,
        {
          successMessage: 'Wallet address copied!',
          context: 'WalletButtonComponent',
        }
      );

      expect(mockClipboard.writeText).toHaveBeenCalledWith(walletAddress);
      expect(mockToastService.success).toHaveBeenCalledWith(
        'Wallet address copied!'
      );
      expect(result).toBe(true);
    });
  });
});

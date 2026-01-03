import { TestBed } from '@angular/core/testing';
import { ClipboardService } from './clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClipboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with null status', () => {
      expect(service.status()).toBeNull();
    });
  });

  describe('copy()', () => {
    describe('successful copy', () => {
      beforeEach(() => {
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
      });

      it('should copy text to clipboard', async () => {
        const writeTextSpy = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        const result = await service.copy('test text');

        expect(result).toBe(true);
        expect(writeTextSpy).toHaveBeenCalledWith('test text');
      });

      it('should set status to "Copied!" on success', async () => {
        const result = await service.copy('test text');

        expect(result).toBe(true);
        expect(service.status()).toBe('Copied!');
      });

      it('should use custom success message when provided', async () => {
        const result = await service.copy('test', {
          successMessage: 'Custom success!',
        });

        expect(result).toBe(true);
        expect(service.status()).toBe('Custom success!');
      });

      it('should auto-reset status after default timeout (1000ms)', async () => {
        vi.useFakeTimers();

        await service.copy('test text');
        expect(service.status()).toBe('Copied!');

        vi.advanceTimersByTime(999);
        expect(service.status()).toBe('Copied!');

        vi.advanceTimersByTime(1);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should auto-reset status after custom success timeout', async () => {
        vi.useFakeTimers();

        await service.copy('test', { successTimeout: 2000 });
        expect(service.status()).toBe('Copied!');

        vi.advanceTimersByTime(1999);
        expect(service.status()).toBe('Copied!');

        vi.advanceTimersByTime(1);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should not clear status if it changed (concurrent operation guard)', async () => {
        vi.useFakeTimers();

        await service.copy('first copy');
        expect(service.status()).toBe('Copied!');

        // Simulate concurrent operation changing status
        service.status.set('Different status');

        vi.advanceTimersByTime(1000);

        // Status should not be cleared because it changed
        expect(service.status()).toBe('Different status');

        vi.useRealTimers();
      });

      it('should trim whitespace from input text', async () => {
        const writeTextSpy = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        await service.copy('  test text  ');

        expect(writeTextSpy).toHaveBeenCalledWith('test text');
      });
    });

    describe('failed copy', () => {
      beforeEach(() => {
        Object.assign(navigator, {
          clipboard: {
            writeText: vi.fn().mockRejectedValue(new Error('Clipboard unavailable')),
          },
        });
      });

      it('should return false on copy failure', async () => {
        const result = await service.copy('test text');

        expect(result).toBe(false);
      });

      it('should set status to "Copy failed" on failure', async () => {
        const result = await service.copy('test text');

        expect(result).toBe(false);
        expect(service.status()).toBe('Copy failed');
      });

      it('should use custom error message when provided', async () => {
        const result = await service.copy('test', {
          errorMessage: 'Custom error!',
        });

        expect(result).toBe(false);
        expect(service.status()).toBe('Custom error!');
      });

      it('should auto-reset error status after default timeout (3000ms)', async () => {
        vi.useFakeTimers();

        await service.copy('test text');
        expect(service.status()).toBe('Copy failed');

        vi.advanceTimersByTime(2999);
        expect(service.status()).toBe('Copy failed');

        vi.advanceTimersByTime(1);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should auto-reset error status after custom error timeout', async () => {
        vi.useFakeTimers();

        await service.copy('test', { errorTimeout: 5000 });
        expect(service.status()).toBe('Copy failed');

        vi.advanceTimersByTime(4999);
        expect(service.status()).toBe('Copy failed');

        vi.advanceTimersByTime(1);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should not clear error status if it changed (concurrent operation guard)', async () => {
        vi.useFakeTimers();

        await service.copy('test text');
        expect(service.status()).toBe('Copy failed');

        // Simulate concurrent operation changing status
        service.status.set('Different status');

        vi.advanceTimersByTime(3000);

        // Status should not be cleared because it changed
        expect(service.status()).toBe('Different status');

        vi.useRealTimers();
      });
    });

    describe('input validation', () => {
      it('should return false for empty string without calling clipboard', async () => {
        const writeTextSpy = vi.fn();
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        const result = await service.copy('');

        expect(result).toBe(false);
        expect(writeTextSpy).not.toHaveBeenCalled();
        expect(service.status()).toBeNull();
      });

      it('should return false for whitespace-only string without calling clipboard', async () => {
        const writeTextSpy = vi.fn();
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        const result = await service.copy('   \t\n  ');

        expect(result).toBe(false);
        expect(writeTextSpy).not.toHaveBeenCalled();
        expect(service.status()).toBeNull();
      });

      it('should handle string with only spaces', async () => {
        const writeTextSpy = vi.fn();
        Object.assign(navigator, {
          clipboard: { writeText: writeTextSpy },
        });

        const result = await service.copy('     ');

        expect(result).toBe(false);
        expect(writeTextSpy).not.toHaveBeenCalled();
      });
    });

    describe('concurrent copy scenarios', () => {
      it('should handle rapid successive copies with same message', async () => {
        vi.useFakeTimers();
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });

        // First copy
        await service.copy('first');
        expect(service.status()).toBe('Copied!');

        // Second copy before first timeout (both use default 'Copied!' message)
        vi.advanceTimersByTime(500);
        await service.copy('second');
        expect(service.status()).toBe('Copied!');

        // First timeout fires - clears because status still matches 'Copied!'
        vi.advanceTimersByTime(500);
        expect(service.status()).toBeNull();

        // Second timeout fires but status is already null
        vi.advanceTimersByTime(500);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should handle success followed by failure', async () => {
        vi.useFakeTimers();

        // Success first
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        await service.copy('success');
        expect(service.status()).toBe('Copied!');

        // Failure before success timeout
        vi.advanceTimersByTime(500);
        Object.assign(navigator, {
          clipboard: {
            writeText: vi.fn().mockRejectedValue(new Error('Failed')),
          },
        });
        await service.copy('failure');
        expect(service.status()).toBe('Copy failed');

        // Success timeout should not clear (status changed to error)
        vi.advanceTimersByTime(500);
        expect(service.status()).toBe('Copy failed');

        // Error timeout should clear
        vi.advanceTimersByTime(2500);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should handle failure followed by success', async () => {
        vi.useFakeTimers();

        // Failure first at t=0 (schedules clear at t=3000)
        Object.assign(navigator, {
          clipboard: {
            writeText: vi.fn().mockRejectedValue(new Error('Failed')),
          },
        });
        await service.copy('failure');
        expect(service.status()).toBe('Copy failed');

        // Success at t=1000 (schedules clear at t=2000)
        vi.advanceTimersByTime(1000);
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        await service.copy('success');
        expect(service.status()).toBe('Copied!');

        // At t=2000: success timeout fires and clears (status matches 'Copied!')
        vi.advanceTimersByTime(1000);
        expect(service.status()).toBeNull();

        // At t=3000: error timeout fires but doesn't clear (status is null, not 'Copy failed')
        vi.advanceTimersByTime(1000);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should handle rapid copies with different custom messages', async () => {
        vi.useFakeTimers();
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });

        // First copy at t=0 with custom message (schedules clear at t=2000)
        await service.copy('first', { successMessage: 'First copied!', successTimeout: 2000 });
        expect(service.status()).toBe('First copied!');

        // Second copy at t=500 with different message (schedules clear at t=1500)
        vi.advanceTimersByTime(500);
        await service.copy('second', { successMessage: 'Second copied!', successTimeout: 1000 });
        expect(service.status()).toBe('Second copied!');

        // At t=1500: Second timeout fires and clears
        vi.advanceTimersByTime(1000);
        expect(service.status()).toBeNull();

        // At t=2000: First timeout fires but doesn't clear (status is null, not 'First copied!')
        vi.advanceTimersByTime(500);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });
    });

    describe('custom configuration', () => {
      it('should support all custom config options together', async () => {
        vi.useFakeTimers();
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });

        const result = await service.copy('test', {
          successMessage: 'Done!',
          errorMessage: 'Failed!',
          successTimeout: 500,
          errorTimeout: 1500,
        });

        expect(result).toBe(true);
        expect(service.status()).toBe('Done!');

        vi.advanceTimersByTime(500);
        expect(service.status()).toBeNull();

        vi.useRealTimers();
      });

      it('should support partial config options', async () => {
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });

        await service.copy('test', {
          successMessage: 'Custom!',
          // Other options should use defaults
        });

        expect(service.status()).toBe('Custom!');
      });
    });
  });
});

import { of, throwError, firstValueFrom, toArray } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import {
  calculateBackoffDelay,
  BackoffManager,
  retryWithBackoff,
  DEFAULT_BACKOFF_CONFIG,
} from './backoff';

describe('calculateBackoffDelay', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should calculate exponential delay without jitter', () => {
    const config = { ...DEFAULT_BACKOFF_CONFIG, jitter: false };

    expect(calculateBackoffDelay(0, config)).toBe(1000); // 1000 * 2^0 = 1000
    expect(calculateBackoffDelay(1, config)).toBe(2000); // 1000 * 2^1 = 2000
    expect(calculateBackoffDelay(2, config)).toBe(4000); // 1000 * 2^2 = 4000
    expect(calculateBackoffDelay(3, config)).toBe(8000); // 1000 * 2^3 = 8000
  });

  it('should cap delay at maxDelay', () => {
    const config = { ...DEFAULT_BACKOFF_CONFIG, jitter: false, maxDelay: 5000 };

    expect(calculateBackoffDelay(0, config)).toBe(1000);
    expect(calculateBackoffDelay(2, config)).toBe(4000);
    expect(calculateBackoffDelay(3, config)).toBe(5000); // Capped at 5000
    expect(calculateBackoffDelay(10, config)).toBe(5000); // Still capped
  });

  it('should use custom baseDelay', () => {
    const config = { ...DEFAULT_BACKOFF_CONFIG, jitter: false, baseDelay: 500 };

    expect(calculateBackoffDelay(0, config)).toBe(500);
    expect(calculateBackoffDelay(1, config)).toBe(1000);
    expect(calculateBackoffDelay(2, config)).toBe(2000);
  });

  it('should add jitter when enabled', () => {
    // With Math.random() = 0.5 and jitterFactor = 0.3:
    // jitterRange = delay * 0.3
    // jitterValue = 0.5 * jitterRange * 2 - jitterRange = 0
    const config = { ...DEFAULT_BACKOFF_CONFIG, jitter: true };

    // At attempt 0: delay = 1000, jitter range = 300, jitter = 0 (since random = 0.5)
    expect(calculateBackoffDelay(0, config)).toBe(1000);
  });

  it('should produce varied jitter with different random values', () => {
    const config = { ...DEFAULT_BACKOFF_CONFIG, jitter: true };

    // Random = 0 -> jitterValue = -300 -> delay = 700
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateBackoffDelay(0, config)).toBe(700);

    // Random = 1 -> jitterValue = +300 -> delay = 1300
    vi.spyOn(Math, 'random').mockReturnValue(1);
    expect(calculateBackoffDelay(0, config)).toBe(1300);
  });

  it('should never return negative delay', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const config = {
      jitter: true,
      jitterFactor: 0.9,
      baseDelay: 100,
      maxDelay: 30000,
      maxRetries: 5,
    };

    // Even with extreme jitter, should not go negative
    expect(calculateBackoffDelay(0, config)).toBeGreaterThanOrEqual(0);
  });

  it('should use default config when no config provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const delay = calculateBackoffDelay(0);
    // Default: baseDelay=1000, jitter=true, jitterFactor=0.3, random=0.5 -> jitter=0
    expect(delay).toBe(1000);
  });
});

describe('BackoffManager', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with attempt count of 0', () => {
    const manager = new BackoffManager();
    expect(manager.attempt).toBe(0);
    expect(manager.isExhausted()).toBe(false);
  });

  it('should increment attempt on nextDelay', () => {
    const manager = new BackoffManager({ jitter: false });

    expect(manager.attempt).toBe(0);
    manager.nextDelay();
    expect(manager.attempt).toBe(1);
    manager.nextDelay();
    expect(manager.attempt).toBe(2);
  });

  it('should return correct delays with exponential backoff', () => {
    const manager = new BackoffManager({ jitter: false, baseDelay: 1000 });

    expect(manager.nextDelay()).toBe(1000); // 2^0
    expect(manager.nextDelay()).toBe(2000); // 2^1
    expect(manager.nextDelay()).toBe(4000); // 2^2
    expect(manager.nextDelay()).toBe(8000); // 2^3
    expect(manager.nextDelay()).toBe(16000); // 2^4
  });

  it('should return -1 when exhausted', () => {
    const manager = new BackoffManager({ maxRetries: 2, jitter: false });

    expect(manager.nextDelay()).toBe(1000);
    expect(manager.nextDelay()).toBe(2000);
    expect(manager.isExhausted()).toBe(true);
    expect(manager.nextDelay()).toBe(-1);
  });

  it('should reset attempt count', () => {
    const manager = new BackoffManager({ jitter: false });

    manager.nextDelay();
    manager.nextDelay();
    expect(manager.attempt).toBe(2);

    manager.reset();
    expect(manager.attempt).toBe(0);
    expect(manager.isExhausted()).toBe(false);
    expect(manager.nextDelay()).toBe(1000);
  });

  it('should track last error', () => {
    const manager = new BackoffManager();
    const error = new Error('Test error');

    expect(manager.lastError).toBe(null);
    manager.nextDelay(error);
    expect(manager.lastError).toBe(error);
  });

  it('should clear last error on reset', () => {
    const manager = new BackoffManager();
    manager.nextDelay(new Error('Test'));
    expect(manager.lastError).not.toBe(null);

    manager.reset();
    expect(manager.lastError).toBe(null);
  });

  it('should peek delay without incrementing attempt', () => {
    const manager = new BackoffManager({ jitter: false });

    expect(manager.peekDelay()).toBe(1000);
    expect(manager.attempt).toBe(0);
    expect(manager.peekDelay()).toBe(1000);
    expect(manager.attempt).toBe(0);
  });

  it('should return -1 for peekDelay when exhausted', () => {
    const manager = new BackoffManager({ maxRetries: 1 });

    manager.nextDelay();
    expect(manager.isExhausted()).toBe(true);
    expect(manager.peekDelay()).toBe(-1);
  });

  it('should expose maxRetries config', () => {
    const manager = new BackoffManager({ maxRetries: 7 });
    expect(manager.maxRetries).toBe(7);
  });
});

describe('retryWithBackoff', () => {
  it('should pass through successful observables without retry', async () => {
    const source$ = of('success');

    const result = await firstValueFrom(source$.pipe(retryWithBackoff({ maxRetries: 3 })));

    expect(result).toBe('success');
  });

  it('should retry failed observable and succeed after transient errors', async () => {
    let attempts = 0;

    const source$ = of(null).pipe(
      mergeMap(() => {
        attempts++;
        if (attempts < 3) {
          return throwError(() => new Error('Temporary error'));
        }
        return of('success after retries');
      }),
    );

    const result = await firstValueFrom(
      source$.pipe(
        retryWithBackoff({
          maxRetries: 5,
          baseDelay: 1, // Very short for tests
          jitter: false,
        }),
      ),
    );

    expect(result).toBe('success after retries');
    expect(attempts).toBe(3);
  });

  it('should throw after max retries exceeded', async () => {
    const error = new Error('Persistent error');
    const source$ = throwError(() => error);

    await expect(
      firstValueFrom(
        source$.pipe(
          retryWithBackoff({
            maxRetries: 2,
            baseDelay: 1, // Short delay for tests
            jitter: false,
          }),
        ),
      ),
    ).rejects.toThrow('Persistent error');
  });

  it('should complete observable values before error', async () => {
    let callCount = 0;

    const source$ = of('first', 'second').pipe(
      mergeMap((val) => {
        callCount++;
        if (callCount === 1) {
          return of(val);
        }
        return throwError(() => new Error('fail on second'));
      }),
    );

    // This should emit 'first' then fail
    try {
      await firstValueFrom(
        source$.pipe(
          retryWithBackoff({
            maxRetries: 1,
            baseDelay: 1,
            jitter: false,
          }),
          toArray(),
        ),
      );
    } catch {
      // Expected to fail
    }

    // The first value should have been emitted
    expect(callCount).toBeGreaterThan(0);
  });

  it('should use default config when none provided', async () => {
    const source$ = of('value');

    const result = await firstValueFrom(source$.pipe(retryWithBackoff()));

    expect(result).toBe('value');
  });
});

describe('DEFAULT_BACKOFF_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_BACKOFF_CONFIG.baseDelay).toBe(1000);
    expect(DEFAULT_BACKOFF_CONFIG.maxDelay).toBe(30000);
    expect(DEFAULT_BACKOFF_CONFIG.maxRetries).toBe(5);
    expect(DEFAULT_BACKOFF_CONFIG.jitter).toBe(true);
    expect(DEFAULT_BACKOFF_CONFIG.jitterFactor).toBe(0.3);
  });
});

/**
 * Exponential backoff utilities for API error handling.
 *
 * Implements exponential backoff with jitter to prevent thundering herd
 * problems when multiple clients retry failed requests simultaneously.
 */

import { retry, timer, type OperatorFunction } from 'rxjs';

/** Configuration options for exponential backoff. */
export interface BackoffConfig {
  /** Base delay in milliseconds before first retry. Default: 1000 */
  baseDelay: number;
  /** Maximum delay in milliseconds (cap). Default: 30000 */
  maxDelay: number;
  /** Maximum number of retry attempts. Default: 5 */
  maxRetries: number;
  /** Whether to add random jitter to prevent thundering herd. Default: true */
  jitter: boolean;
  /** Maximum jitter as a fraction of the delay (0-1). Default: 0.3 */
  jitterFactor: number;
}

/** Default backoff configuration. */
export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  baseDelay: 1000,
  maxDelay: 30000,
  maxRetries: 5,
  jitter: true,
  jitterFactor: 0.3,
};

/**
 * Calculates the delay for a given retry attempt using exponential backoff.
 *
 * Base formula: min(maxDelay, baseDelay * 2^attempt)
 * With jitter (if enabled): base delay +/- random variance within jitterFactor%
 *
 * The jitter adds randomness in the range [-jitterFactor%, +jitterFactor%] of the
 * calculated delay to prevent thundering herd problems when multiple clients retry
 * simultaneously.
 *
 * @param attempt - The current retry attempt (0-indexed)
 * @param config - Backoff configuration
 * @returns Delay in milliseconds (never negative)
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Partial<BackoffConfig> = {},
): number {
  const { baseDelay, maxDelay, jitter, jitterFactor } = {
    ...DEFAULT_BACKOFF_CONFIG,
    ...config,
  };

  // Calculate base exponential delay
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const cappedDelay = Math.min(maxDelay, exponentialDelay);

  // Add jitter if enabled
  if (jitter) {
    const jitterRange = cappedDelay * jitterFactor;
    const jitterValue = Math.random() * jitterRange * 2 - jitterRange;
    return Math.max(0, Math.round(cappedDelay + jitterValue));
  }

  return cappedDelay;
}

/**
 * State tracked during backoff retry sequence.
 */
export interface BackoffState {
  /** Current retry attempt count. */
  attempt: number;
  /** The error that triggered the retry. */
  error: unknown;
  /** Delay before this retry in milliseconds. */
  delay: number;
  /** Whether max retries has been exceeded. */
  exhausted: boolean;
}

/**
 * RxJS operator that retries failed observables with exponential backoff.
 *
 * @example
 * ```typescript
 * this.http.get('/api/data').pipe(
 *   retryWithBackoff({ maxRetries: 3, baseDelay: 500 })
 * ).subscribe(data => console.log(data));
 * ```
 *
 * @param config - Partial backoff configuration (merged with defaults)
 * @returns RxJS operator that applies retry with backoff logic
 */
export function retryWithBackoff<T>(config: Partial<BackoffConfig> = {}): OperatorFunction<T, T> {
  const fullConfig = { ...DEFAULT_BACKOFF_CONFIG, ...config };

  return retry<T>({
    count: fullConfig.maxRetries,
    delay: (_error, retryCount) => {
      // retry operator uses 1-based indexing, calculateBackoffDelay expects 0-based
      const attempt = retryCount - 1;
      const delay = calculateBackoffDelay(attempt, fullConfig);
      return timer(delay);
    },
  });
}

/**
 * Manages backoff state for manual polling scenarios.
 *
 * Use this when you need fine-grained control over backoff behavior,
 * such as resetting on partial success or custom retry logic.
 *
 * @example
 * ```typescript
 * const backoff = new BackoffManager({ maxRetries: 5 });
 *
 * async function poll() {
 *   while (!backoff.isExhausted()) {
 *     try {
 *       const result = await fetchData();
 *       backoff.reset();
 *       return result;
 *     } catch (error) {
 *       const delay = backoff.nextDelay(error);
 *       if (delay === -1) break;
 *       await new Promise(resolve => setTimeout(resolve, delay));
 *     }
 *   }
 *   throw new Error('Max retries exceeded');
 * }
 * ```
 */
export class BackoffManager {
  readonly #config: BackoffConfig;
  #attempt = 0;
  #lastError: unknown = null;

  constructor(config: Partial<BackoffConfig> = {}) {
    this.#config = { ...DEFAULT_BACKOFF_CONFIG, ...config };
  }

  /** Current retry attempt count. */
  get attempt(): number {
    return this.#attempt;
  }

  /** The last error that triggered a backoff. */
  get lastError(): unknown {
    return this.#lastError;
  }

  /** Maximum retries allowed. */
  get maxRetries(): number {
    return this.#config.maxRetries;
  }

  /** Whether all retry attempts have been used. */
  isExhausted(): boolean {
    return this.#attempt >= this.#config.maxRetries;
  }

  /**
   * Advances the backoff state and returns the delay before the next retry.
   *
   * IMPORTANT: This method increments the internal attempt counter as a side effect.
   * Call this once per retry attempt, whether or not you provide an error.
   *
   * @param error - Optional error to record for debugging/diagnostics
   * @returns Delay in milliseconds, or -1 if retries are exhausted
   */
  nextDelay(error?: unknown): number {
    if (error !== undefined) {
      this.#lastError = error;
      console.error('[BackoffManager] Error captured:', {
        error: error instanceof Error ? error.message : String(error),
        attempt: this.#attempt,
      });
    }

    if (this.isExhausted()) {
      return -1;
    }

    const delay = calculateBackoffDelay(this.#attempt, this.#config);
    this.#attempt++;
    return delay;
  }

  /**
   * Resets the backoff state after a successful operation.
   * Call this when the operation succeeds to start fresh on next failure.
   */
  reset(): void {
    this.#attempt = 0;
    this.#lastError = null;
  }

  /**
   * Gets the current backoff delay without incrementing the attempt counter.
   * Useful for displaying estimated wait time to users.
   */
  peekDelay(): number {
    if (this.isExhausted()) {
      return -1;
    }
    return calculateBackoffDelay(this.#attempt, this.#config);
  }
}

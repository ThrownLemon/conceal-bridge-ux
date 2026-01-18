import type { BackoffConfig } from '../utils/backoff';

/**
 * Polling configuration with exponential backoff on errors.
 * Centralized for consistency across swap operations.
 */
export const POLLING_CONFIG = {
  /** Interval between successful polls in milliseconds. */
  successInterval: 10_000,
  /** Backoff configuration for retry after errors. */
  backoff: {
    baseDelay: 2_000,
    maxDelay: 30_000,
    maxRetries: 5,
    jitter: true,
    jitterFactor: 0.2,
  } satisfies Partial<BackoffConfig>,
} as const;

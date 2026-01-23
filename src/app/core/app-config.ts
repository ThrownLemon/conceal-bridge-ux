import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AppConfig {
  /**
   * Base URL for the bridge backend, e.g. "https://bridge.conceal.network/backend"
   * (without a trailing slash).
   */
  apiBaseUrl: string;

  /**
   * WalletConnect Cloud Project ID.
   * Obtain from https://cloud.walletconnect.com
   * Required for WalletConnect v2 integration.
   */
  walletConnectProjectId: string;
}

/**
 * Validates environment configuration at startup.
 * Throws an error if required values are missing or invalid.
 */
function validateEnvironment(): AppConfig {
  const { apiBaseUrl, walletConnectProjectId } = environment;

  if (!apiBaseUrl || typeof apiBaseUrl !== 'string') {
    throw new Error('Missing required environment variable: apiBaseUrl');
  }

  // Validate URL format
  try {
    new URL(apiBaseUrl);
  } catch {
    throw new Error(`Invalid apiBaseUrl format: "${apiBaseUrl}". Must be a valid URL.`);
  }

  // WalletConnect project ID is optional but should be a string if provided
  const wcProjectId = typeof walletConnectProjectId === 'string' ? walletConnectProjectId : '';

  return { apiBaseUrl, walletConnectProjectId: wcProjectId };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: validateEnvironment,
});

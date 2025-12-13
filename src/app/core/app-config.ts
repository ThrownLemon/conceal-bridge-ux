import { InjectionToken } from '@angular/core';

export interface AppConfig {
  /**
   * Base URL for the bridge backend, e.g. "https://bridge.conceal.network/backend"
   * (without a trailing slash).
   */
  apiBaseUrl: string;

  /**
   * WalletConnect v2 Project ID.
   * Create one at https://cloud.walletconnect.com and paste it here (or override at build time).
   */
  walletConnectProjectId: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    //apiBaseUrl: 'https://bridge.conceal.network/backend',
    apiBaseUrl: 'https://bridge.conceal.network/testing/backend',
    walletConnectProjectId: '26a4fa315dff49e1a8cac7d4f83ed7f4',
  }),
});



import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AppConfig {
  /**
   * Base URL for the bridge backend, e.g. "https://bridge.conceal.network/backend"
   * (without a trailing slash).
   */
  apiBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    apiBaseUrl: environment.apiBaseUrl,
  }),
});

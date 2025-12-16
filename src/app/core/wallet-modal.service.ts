import { Injectable, signal } from '@angular/core';
import type { WalletConnectorId } from './evm-wallet.service';

@Injectable({ providedIn: 'root' })
export class WalletModalService {
  readonly isOpen = signal(false);
  readonly activeConnector = signal<WalletConnectorId | null>(null);
  readonly error = signal<string | null>(null);
  readonly isConnecting = signal(false);
  readonly needsInstall = signal(false);

  open(): void {
    this.error.set(null);
    this.activeConnector.set(null);
    this.isConnecting.set(false);
    this.needsInstall.set(false);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  setActiveConnector(connector: WalletConnectorId | null): void {
    this.activeConnector.set(connector);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  setIsConnecting(connecting: boolean): void {
    this.isConnecting.set(connecting);
  }

  setNeedsInstall(needsInstall: boolean): void {
    this.needsInstall.set(needsInstall);
  }

  reset(): void {
    this.error.set(null);
    this.activeConnector.set(null);
    this.isConnecting.set(false);
    this.needsInstall.set(false);
  }
}

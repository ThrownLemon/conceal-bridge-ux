import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ZardAlertComponent } from '@/shared/components/alert/alert.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { WalletModalService } from '../../core/wallet-modal.service';
import { EvmWalletService, type WalletConnectorId } from '../../core/evm-wallet.service';

interface ConnectorOption {
  id: WalletConnectorId;
  name: string;
  logo: string;
  isAvailable: boolean;
  installUrl: string;
}

@Component({
  selector: 'app-wallet-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZardButtonComponent, ZardCardComponent, ZardAlertComponent, ZardIconComponent],
  template: `
    <!-- Screen reader live region for wallet connection status -->
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      @if (modalService.isConnecting()) {
        Connecting to wallet, please check your wallet extension.
      }
    </div>

    @if (modalService.isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        (click)="close()"
        (keydown.escape)="close()"
        tabindex="-1"
      >
        <z-card
          class="w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-label="Connect wallet"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex items-center gap-2">
              @if (modalService.activeConnector(); as c) {
                <button
                  z-button
                  zType="ghost"
                  zSize="sm"
                  (click)="backToList()"
                  aria-label="Back to wallet list"
                >
                  <z-icon zType="arrow-left" />
                </button>
              }
              <h2 class="text-xl font-semibold">
                @if (modalService.activeConnector(); as c) {
                  {{ connectorName(c) }}
                } @else {
                  Connect Wallet
                }
              </h2>
            </div>
            <button z-button zType="ghost" zSize="sm" (click)="close()" aria-label="Close modal">
              <z-icon zType="x" />
            </button>
          </div>

          @if (modalService.activeConnector(); as c) {
            <div class="grid place-items-center gap-4">
              <img
                class="h-16 w-16"
                [src]="connectorLogo(c)"
                [alt]="connectorName(c) + ' logo'"
                loading="lazy"
                decoding="async"
              />

              @if (modalService.needsInstall()) {
                <div class="text-center">
                  <div class="text-lg font-semibold">Install {{ connectorName(c) }}</div>
                  <div class="mt-2 text-sm text-muted-foreground">
                    To connect your {{ connectorName(c) }}, install the browser extension.
                  </div>
                </div>

                <a
                  z-button
                  zType="outline"
                  zFull
                  class="mt-2"
                  [href]="connectorInstallUrl(c)"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Install browser extension"
                >
                  Install the Extension
                </a>
              } @else {
                <div class="text-center">
                  @if (modalService.isConnecting()) {
                    <div class="text-lg font-semibold">Requesting Connection</div>
                    <div class="mt-2 text-sm text-muted-foreground">
                      {{ connectorConnectingHint(c) }}
                    </div>
                  } @else {
                    <div class="text-lg font-semibold">Connect {{ connectorName(c) }}</div>
                    <div class="mt-2 text-sm text-muted-foreground">
                      Click below to connect your wallet.
                    </div>
                  }
                </div>

                @if (modalService.error(); as err) {
                  <z-alert class="w-full" zType="destructive" [zTitle]="err" />
                }

                <button
                  z-button
                  zFull
                  class="mt-1"
                  [zLoading]="modalService.isConnecting()"
                  [zDisabled]="modalService.isConnecting()"
                  (click)="connect(c)"
                  aria-label="Connect wallet"
                >
                  @if (modalService.isConnecting()) {
                    Connecting…
                  } @else {
                    Connect
                  }
                </button>
              }
            </div>
          } @else {
            @if (modalService.error(); as err) {
              <z-alert class="mb-4" zType="destructive" [zTitle]="err" />
            }

            <div class="grid gap-3">
              @for (option of connectorOptions(); track option.id) {
                <div
                  class="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                >
                  <button
                    type="button"
                    class="flex flex-1 items-center gap-3 px-4 py-3 rounded-l-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
                    (click)="selectConnector(option.id)"
                    [attr.aria-label]="'Connect with ' + option.name"
                  >
                    <img
                      class="h-7 w-7"
                      [src]="option.logo"
                      [alt]="option.name + ' logo'"
                      loading="lazy"
                      decoding="async"
                    />
                    <span class="font-medium">{{ option.name }}</span>
                  </button>

                  @if (option.isAvailable) {
                    <span
                      class="px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400 font-medium"
                      >Available</span
                    >
                  } @else {
                    <a
                      z-button
                      zType="ghost"
                      zSize="sm"
                      class="h-7 px-2 mr-2 text-xs"
                      [href]="option.installUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      [attr.aria-label]="'Download ' + option.name + ' extension'"
                    >
                      Download
                    </a>
                  }
                </div>
              }
            </div>
          }
        </z-card>
      </div>
    }
  `,
})
export class WalletModalComponent {
  private static readonly CONNECTOR_METADATA: Record<
    WalletConnectorId,
    { name: string; logo: string; installUrl: string }
  > = {
    metamask: {
      name: 'MetaMask',
      logo: 'images/wallets/metamask.png',
      installUrl: 'https://metamask.io/download/',
    },
    trust: {
      name: 'Trust Wallet',
      logo: 'images/wallets/trustwallet.png',
      installUrl: 'https://trustwallet.com/download',
    },
    binance: {
      name: 'Binance Wallet',
      logo: 'images/wallets/binance.svg',
      installUrl: 'https://www.binance.com/en/web3wallet',
    },
  };

  private static readonly SUPPORTED_CONNECTORS: WalletConnectorId[] = [
    'metamask',
    'trust',
    'binance',
  ];

  readonly modalService = inject(WalletModalService);
  readonly wallet = inject(EvmWalletService);

  readonly connectorOptions = computed<ConnectorOption[]>(() => {
    return WalletModalComponent.SUPPORTED_CONNECTORS.map((id) => ({
      id,
      name: this.connectorName(id),
      logo: this.connectorLogo(id),
      isAvailable: this.wallet.isConnectorAvailable(id),
      installUrl: this.connectorInstallUrl(id),
    }));
  });

  close(): void {
    this.modalService.close();
  }

  backToList(): void {
    this.modalService.reset();
  }

  selectConnector(connector: WalletConnectorId): void {
    this.modalService.setError(null);
    this.modalService.setActiveConnector(connector);

    const available = this.wallet.isConnectorAvailable(connector);
    this.modalService.setNeedsInstall(!available);
    if (!available) return;

    void this.connect(connector);
  }

  async connect(connector: WalletConnectorId): Promise<void> {
    this.modalService.setError(null);
    this.modalService.setIsConnecting(true);
    try {
      await this.wallet.connectWith(connector);
      await this.wallet.refreshChainId();
      this.modalService.close();
    } catch (e: unknown) {
      console.error('[WalletModal] Connection failed:', e);
      const errorMessage = this.friendlyError(e);
      this.modalService.setError(errorMessage);
      // If we failed due to missing wallet, show install view.
      const maybeMissing = errorMessage.toLowerCase().includes('not detected');
      if (maybeMissing) this.modalService.setNeedsInstall(true);
    } finally {
      this.modalService.setIsConnecting(false);
    }
  }

  friendlyError(e: unknown): string {
    const code = (e as { code?: number }).code;
    if (code === 4001) return 'Connection request was cancelled in your wallet.';
    if (code === -32002)
      return 'A wallet request is already pending. Please open your wallet extension.';

    const raw = e instanceof Error ? e.message : 'Failed to connect wallet.';
    if (raw.includes('No injected EVM wallet'))
      return 'No wallet extension detected in this browser.';
    return raw;
  }

  connectorName(connector: WalletConnectorId): string {
    return WalletModalComponent.CONNECTOR_METADATA[connector].name;
  }

  connectorLogo(connector: WalletConnectorId): string {
    return WalletModalComponent.CONNECTOR_METADATA[connector].logo;
  }

  connectorInstallUrl(connector: WalletConnectorId): string {
    return WalletModalComponent.CONNECTOR_METADATA[connector].installUrl;
  }

  connectorConnectingHint(connector: WalletConnectorId): string {
    return `Open the ${this.connectorName(connector)} browser extension to connect your wallet.`;
  }
}

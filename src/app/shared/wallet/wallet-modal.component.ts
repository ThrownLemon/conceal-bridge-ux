import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ZardAlertComponent } from '@/shared/components/alert/alert.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { WalletModalService } from '../../core/wallet-modal.service';
import { EvmWalletService, type WalletConnectorId } from '../../core/evm-wallet.service';

@Component({
  selector: 'app-wallet-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ZardButtonComponent, ZardCardComponent, ZardAlertComponent, ZardIconComponent],
  template: `
    @if (modalService.isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        (click)="close()"
        (keydown.escape)="close()"
        (keyup.escape)="close()"
        (keyup.enter)="close()"
        tabindex="0"
        role="button"
        aria-label="Close modal"
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
                  rel="noopener"
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
              <button
                z-button
                zType="outline"
                class="flex w-full items-center justify-between !px-4 !py-3"
                (click)="selectConnector('metamask')"
                aria-label="Connect with MetaMask"
              >
                <span class="flex items-center gap-3">
                  <img
                    class="h-7 w-7"
                    src="images/wallets/metamask.png"
                    alt="MetaMask logo"
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="font-medium">MetaMask</span>
                </span>
                <span class="text-xs text-muted-foreground">Browser extension</span>
              </button>

              <button
                z-button
                zType="outline"
                class="flex w-full items-center justify-between !px-4 !py-3"
                (click)="selectConnector('trust')"
                aria-label="Connect with Trust Wallet"
              >
                <span class="flex items-center gap-3">
                  <img
                    class="h-7 w-7"
                    src="images/wallets/trustwallet.png"
                    alt="Trust Wallet logo"
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="font-medium">Trust Wallet</span>
                </span>
                <span class="text-xs text-muted-foreground">Browser extension</span>
              </button>

              <button
                z-button
                zType="outline"
                class="flex w-full items-center justify-between !px-4 !py-3"
                (click)="selectConnector('binance')"
                aria-label="Connect with Binance Wallet"
              >
                <span class="flex items-center gap-3">
                  <img
                    class="h-7 w-7"
                    src="images/wallets/binance.svg"
                    alt="Binance logo"
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="font-medium">Binance Wallet</span>
                </span>
                <span class="text-xs text-muted-foreground">Browser extension</span>
              </button>
            </div>
          }
        </z-card>
      </div>
    }
  `,
})
export class WalletModalComponent {
  readonly modalService = inject(WalletModalService);
  readonly wallet = inject(EvmWalletService);

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
    if (raw.includes('No injected EVM wallet detected'))
      return 'No wallet extension detected in this browser.';
    return raw;
  }

  connectorName(connector: WalletConnectorId): string {
    if (connector === 'metamask') return 'MetaMask';
    if (connector === 'trust') return 'Trust Wallet';
    if (connector === 'binance') return 'Binance Wallet';
    return 'WalletConnect';
  }

  connectorLogo(connector: WalletConnectorId): string {
    if (connector === 'metamask') return 'images/wallets/metamask.png';
    if (connector === 'trust') return 'images/wallets/trustwallet.png';
    if (connector === 'binance') return 'images/wallets/binance.svg';
    return 'images/wallets/walletconnect.svg';
  }

  connectorInstallUrl(connector: WalletConnectorId): string {
    if (connector === 'metamask') return 'https://metamask.io/download/';
    if (connector === 'trust') return 'https://trustwallet.com/download';
    if (connector === 'binance') return 'https://www.binance.com/en/web3wallet';
    return 'https://walletconnect.com/';
  }

  connectorConnectingHint(connector: WalletConnectorId): string {
    return `Open the ${this.connectorName(connector)} browser extension to connect your wallet.`;
  }
}

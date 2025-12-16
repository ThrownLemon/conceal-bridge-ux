import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { EvmChainMetadataService } from '../../core/evm-chain-metadata.service';
import { EvmWalletService, type WalletConnectorId } from '../../core/evm-wallet.service';
import { EVM_NETWORKS } from '../../core/evm-networks';

type Variant = 'header' | 'primary';

@Component({
  selector: 'app-wallet-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- eslint-disable @angular-eslint/template/click-events-have-key-events -->
    @if (!wallet.isConnected()) {
      <button type="button" [class]="buttonClass()" (click)="open()">Connect Wallet</button>
    } @else {
      @if (variant() === 'header') {
        <div class="relative flex items-center gap-2">
          @if (isNetworkMenuOpen() || isWalletMenuOpen()) {
            <button
              type="button"
              class="fixed inset-0 z-40 w-full h-full cursor-default"
              (click)="closeHeaderMenus()"
              tabindex="-1"
              aria-hidden="true"
            ></button>
          }

          <!-- Network pill -->
          <button
            type="button"
            class="relative z-50 inline-flex items-center gap-2 rounded-full border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-semibold text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40"
            (click)="toggleNetworkMenu()"
            aria-haspopup="menu"
            [attr.aria-expanded]="isNetworkMenuOpen()"
          >
            @if (currentNetworkLogo(); as logo) {
              <img
                class="h-5 w-5 rounded-full"
                [src]="logo"
                [alt]="currentNetworkName() + ' logo'"
                loading="lazy"
                decoding="async"
              />
            } @else {
              <span
                class="h-5 w-5 rounded-full bg-[var(--cb-color-border)]"
                aria-hidden="true"
              ></span>
            }
            <span class="hidden sm:inline">{{ currentNetworkName() }}</span>
            <span class="text-[var(--cb-color-text-secondary)]">▾</span>
          </button>

          @if (isNetworkMenuOpen()) {
            <div
              class="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-1 shadow-lg backdrop-blur"
              role="menu"
            >
              @for (opt of evmNetworkOptions(); track opt.key) {
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--cb-color-text)] hover:bg-[var(--cb-color-text)]/5"
                  role="menuitem"
                  (click)="switchNetwork(opt.key)"
                  [disabled]="isSwitchingNetwork()"
                >
                  <img
                    class="h-5 w-5 rounded-full"
                    [src]="opt.logo"
                    [alt]="opt.label + ' logo'"
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="flex-1">{{ opt.label }}</span>
                </button>
              }
              @if (networkStatus(); as s) {
                <div class="px-3 py-2 text-[11px] text-[var(--cb-color-muted)]" aria-live="polite">
                  {{ s }}
                </div>
              }
            </div>
          }

          <!-- Wallet pill -->
          <button
            type="button"
            class="relative z-50 inline-flex items-center gap-2 rounded-full border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-semibold text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40"
            (click)="toggleWalletMenu()"
            aria-haspopup="menu"
            [attr.aria-expanded]="isWalletMenuOpen()"
          >
            @if (currentWalletLogo(); as wlogo) {
              <img
                class="h-5 w-5 rounded-full bg-white"
                [src]="wlogo"
                alt="Wallet logo"
                loading="lazy"
                decoding="async"
              />
            } @else {
              <span
                class="h-5 w-5 rounded-full bg-[var(--cb-color-border)]"
                aria-hidden="true"
              ></span>
            }
            <span class="font-mono">{{ wallet.shortAddress() }}</span>
            <span class="text-[var(--cb-color-text-secondary)]">▾</span>
          </button>

          @if (isWalletMenuOpen()) {
            <div
              class="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-1 shadow-lg backdrop-blur"
              role="menu"
            >
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-xs text-[var(--cb-color-text)] hover:bg-[var(--cb-color-text)]/5"
                role="menuitem"
                (click)="copyAddressFromHeader()"
              >
                Copy address
              </button>
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-xs text-[var(--cb-color-text)] hover:bg-[var(--cb-color-text)]/5"
                role="menuitem"
                (click)="disconnectFromHeader()"
              >
                Disconnect
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- Non-header connected state (kept simple) -->
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] px-3 py-2 text-xs font-semibold text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40"
          (click)="toggleMenu()"
          aria-haspopup="menu"
          [attr.aria-expanded]="isMenuOpen()"
        >
          @if (connectedChain(); as chain) {
            @if (connectedChainLogo(); as logo) {
              <img
                class="h-5 w-5 rounded-full"
                [src]="logo"
                [alt]="chain.name + ' logo'"
                referrerpolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            } @else {
              <span
                class="h-5 w-5 rounded-full bg-[var(--cb-color-border)]"
                aria-hidden="true"
              ></span>
            }
            <span class="hidden sm:inline">{{ chain.name }}</span>
          }
          <span class="font-mono">{{ wallet.shortAddress() }}</span>
        </button>

        @if (isMenuOpen()) {
          <div class="relative">
            <div
              class="absolute right-0 mt-2 w-52 rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-1 shadow-lg backdrop-blur"
              role="menu"
            >
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-xs text-[var(--cb-color-text)] hover:bg-[var(--cb-color-text)]/5"
                role="menuitem"
                (click)="copyAddress()"
              >
                Copy address
              </button>
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-xs text-[var(--cb-color-text)] hover:bg-[var(--cb-color-text)]/5"
                role="menuitem"
                (click)="disconnect()"
              >
                Disconnect
              </button>
            </div>
          </div>
        }
      }
    }

    @if (isModalOpen()) {
      <button
        type="button"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        (click)="close()"
        (keyup.escape)="close()"
        (keyup.enter)="close()"
        title="Close"
      >
        <div
          class="w-full max-w-md rounded-2xl bg-[var(--cb-color-surface)] p-6 text-[var(--cb-color-text)] shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Connect wallet"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-2">
              @if (activeConnector()) {
                <button
                  type="button"
                  class="rounded-lg p-2 text-[var(--cb-color-muted)] hover:bg-[var(--cb-color-border)]/50 hover:text-[var(--cb-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40"
                  (click)="backToList()"
                  aria-label="Back"
                >
                  ←
                </button>
              }
              <h2 class="text-xl font-semibold">
                @if (activeConnector(); as c) {
                  {{ connectorName(c) }}
                } @else {
                  Connect Wallet
                }
              </h2>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-[var(--cb-color-muted)] hover:bg-[var(--cb-color-border)]/50 hover:text-[var(--cb-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40"
              (click)="close()"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          @if (activeConnector(); as c) {
            <div class="mt-6 grid place-items-center gap-4">
              <img
                class="h-16 w-16"
                [src]="connectorLogo(c)"
                [alt]="connectorName(c) + ' logo'"
                loading="lazy"
                decoding="async"
              />

              @if (needsInstall()) {
                <div class="text-center">
                  <div class="text-lg font-semibold">Install {{ connectorName(c) }}</div>
                  <div class="mt-2 text-sm text-slate-600">
                    To connect your {{ connectorName(c) }}, install the browser extension.
                  </div>
                </div>

                <a
                  class="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-bg)] px-4 py-3 text-sm font-semibold text-[var(--cb-color-text)] hover:bg-[var(--cb-color-border)]/30"
                  [href]="connectorInstallUrl(c)"
                  target="_blank"
                  rel="noopener"
                >
                  Install the Extension
                </a>
              } @else {
                <div class="text-center">
                  @if (isConnecting()) {
                    <div class="text-lg font-semibold">Requesting Connection</div>
                    <div class="mt-2 text-sm text-[var(--cb-color-muted)]">
                      {{ connectorConnectingHint(c) }}
                    </div>
                  } @else {
                    <div class="text-lg font-semibold">Connect {{ connectorName(c) }}</div>
                    <div class="mt-2 text-sm text-[var(--cb-color-muted)]">
                      Click below to connect your wallet.
                    </div>
                  }
                </div>

                @if (error(); as err) {
                  <div
                    class="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {{ err }}
                  </div>
                }

                <button
                  type="button"
                  class="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-[var(--cb-color-accent)] px-4 py-3 text-sm font-semibold text-black hover:bg-[var(--cb-color-accent)]/80 disabled:opacity-60"
                  [disabled]="isConnecting()"
                  (click)="connect(c)"
                >
                  @if (isConnecting()) {
                    Connecting…
                  } @else {
                    Connect
                  }
                </button>
              }
            </div>
          } @else {
            @if (error(); as err) {
              <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {{ err }}
              </div>
            }

            <div class="mt-5 grid gap-3">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-xl border border-[var(--cb-color-border)] px-4 py-3 text-left hover:bg-[var(--cb-color-border)]/20"
                (click)="selectConnector('metamask')"
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
                <span class="text-xs text-[var(--cb-color-muted)]">Browser extension</span>
              </button>

              <button
                type="button"
                class="flex w-full items-center justify-between rounded-xl border border-[var(--cb-color-border)] px-4 py-3 text-left hover:bg-[var(--cb-color-border)]/20"
                (click)="selectConnector('trust')"
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
                <span class="text-xs text-[var(--cb-color-muted)]">Browser extension</span>
              </button>

              <button
                type="button"
                class="flex w-full items-center justify-between rounded-xl border border-[var(--cb-color-border)] px-4 py-3 text-left hover:bg-[var(--cb-color-border)]/20"
                (click)="selectConnector('binance')"
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
                <span class="text-xs text-[var(--cb-color-muted)]">Browser extension</span>
              </button>
            </div>
          }
        </div>
      </button>
    }
  `,
})
export class WalletButtonComponent {
  readonly variant = input<Variant>('header');

  readonly wallet = inject(EvmWalletService);
  readonly #chains = inject(EvmChainMetadataService);

  readonly isModalOpen = signal(false);
  readonly isMenuOpen = signal(false);
  readonly error = signal<string | null>(null);

  // Header-only split menus
  readonly isNetworkMenuOpen = signal(false);
  readonly isWalletMenuOpen = signal(false);
  readonly isSwitchingNetwork = signal(false);
  readonly networkStatus = signal<string | null>(null);

  readonly activeConnector = signal<WalletConnectorId | null>(null);
  readonly isConnecting = signal(false);
  readonly needsInstall = signal(false);

  readonly connectedChain = computed(() => this.#chains.get(this.wallet.chainId()));

  readonly connectedChainLogo = computed(() => {
    const chainId = this.wallet.chainId();
    if (chainId === 1) return 'images/branding/eth.png';
    if (chainId === 56) return 'images/branding/bsc.png';
    if (chainId === 137) return 'images/branding/plg.png';
    return this.connectedChain()?.logoUri ?? null;
  });

  readonly currentNetworkName = computed(() => {
    const chainId = this.wallet.chainId();
    if (chainId === 1) return 'Ethereum';
    if (chainId === 56) return 'BNB Smart Chain';
    if (chainId === 137) return 'Polygon';
    return this.connectedChain()?.name ?? 'Network';
  });

  readonly currentNetworkLogo = computed(() => this.connectedChainLogo());

  readonly currentWalletLogo = computed(() => {
    const c = this.wallet.connector();
    return c ? this.connectorLogo(c) : null;
  });

  readonly evmNetworkOptions = computed(() => [
    {
      key: 'eth' as const,
      label: 'Ethereum',
      logo: 'images/branding/eth.png',
      chain: EVM_NETWORKS.eth.chain,
    },
    {
      key: 'bsc' as const,
      label: 'BNB Smart Chain',
      logo: 'images/branding/bsc.png',
      chain: EVM_NETWORKS.bsc.chain,
    },
    {
      key: 'plg' as const,
      label: 'Polygon',
      logo: 'images/branding/plg.png',
      chain: EVM_NETWORKS.plg.chain,
    },
  ]);

  readonly buttonClass = computed(() => {
    if (this.variant() === 'primary') {
      return 'inline-flex w-full items-center justify-center rounded-xl bg-[var(--cb-color-accent)] px-4 py-4 text-base font-semibold text-black hover:bg-[var(--cb-color-accent)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40';
    }
    return 'rounded-lg bg-[var(--cb-color-accent)] px-3 py-2 text-xs font-semibold text-black hover:bg-[var(--cb-color-accent)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40';
  });

  open(): void {
    this.error.set(null);
    this.activeConnector.set(null);
    this.isConnecting.set(false);
    this.needsInstall.set(false);
    this.isMenuOpen.set(false);
    this.closeHeaderMenus();
    this.isModalOpen.set(true);
  }

  close(): void {
    this.isModalOpen.set(false);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
  }

  closeHeaderMenus(): void {
    this.isNetworkMenuOpen.set(false);
    this.isWalletMenuOpen.set(false);
    this.networkStatus.set(null);
  }

  toggleNetworkMenu(): void {
    this.isNetworkMenuOpen.update((v) => !v);
    this.isWalletMenuOpen.set(false);
    this.networkStatus.set(null);
  }

  toggleWalletMenu(): void {
    this.isWalletMenuOpen.update((v) => !v);
    this.isNetworkMenuOpen.set(false);
    this.networkStatus.set(null);
  }

  async switchNetwork(key: 'eth' | 'bsc' | 'plg'): Promise<void> {
    this.networkStatus.set(null);
    this.isSwitchingNetwork.set(true);
    try {
      await this.wallet.ensureChain(EVM_NETWORKS[key].chain);
      this.networkStatus.set(
        `Switched to ${this.evmNetworkOptions().find((o) => o.key === key)?.label ?? 'network'}.`,
      );
      // close after a short moment so user sees status
      setTimeout(() => this.closeHeaderMenus(), 600);
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      if (code === 4001) this.networkStatus.set('Network switch cancelled in wallet.');
      else if (code === -32002)
        this.networkStatus.set('A wallet request is already pending. Open your wallet.');
      else this.networkStatus.set(e instanceof Error ? e.message : 'Failed to switch network.');
    } finally {
      this.isSwitchingNetwork.set(false);
    }
  }

  async copyAddressFromHeader(): Promise<void> {
    await this.copyAddress();
    this.closeHeaderMenus();
  }

  async disconnectFromHeader(): Promise<void> {
    await this.disconnect();
    this.closeHeaderMenus();
  }

  backToList(): void {
    this.error.set(null);
    this.activeConnector.set(null);
    this.isConnecting.set(false);
    this.needsInstall.set(false);
  }

  selectConnector(connector: WalletConnectorId): void {
    this.error.set(null);
    this.activeConnector.set(connector);

    const available = this.wallet.isConnectorAvailable(connector);
    this.needsInstall.set(!available);
    if (!available) return;

    void this.connect(connector);
  }

  async connect(connector: WalletConnectorId): Promise<void> {
    this.error.set(null);
    this.isConnecting.set(true);
    try {
      await this.wallet.connectWith(connector);
      await this.wallet.refreshChainId();
      this.isModalOpen.set(false);
    } catch (e: unknown) {
      this.error.set(this.friendlyError(e));
      // If we failed due to missing wallet, show install view.
      const maybeMissing = this.error()?.toLowerCase().includes('not detected') ?? false;
      if (maybeMissing) this.needsInstall.set(true);
    } finally {
      this.isConnecting.set(false);
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

  async disconnect(): Promise<void> {
    this.isMenuOpen.set(false);
    await this.wallet.disconnect();
  }

  async copyAddress(): Promise<void> {
    this.isMenuOpen.set(false);
    const addr = this.wallet.address();
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
    } catch {
      // ignore
    }
  }
}

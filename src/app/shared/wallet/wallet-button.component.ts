import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { EvmChainMetadataService } from '../../core/evm-chain-metadata.service';
import { EvmWalletService, type WalletConnectorId } from '../../core/evm-wallet.service';
import { WalletModalService } from '../../core/wallet-modal.service';
import { EVM_NETWORKS } from '../../core/evm-networks';

type Variant = 'header' | 'primary';

@Component({
  selector: 'app-wallet-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- eslint-disable @angular-eslint/template/click-events-have-key-events -->
    @if (!wallet.isConnected()) {
      <button type="button" [class]="buttonClass()" (click)="open()" aria-label="Connect Wallet">Connect Wallet</button>
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
            aria-label="Select Network"
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
            aria-label="Wallet Options"
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
          aria-label="Wallet Menu"
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

  `,
})
export class WalletButtonComponent {
  readonly variant = input<Variant>('header');

  readonly wallet = inject(EvmWalletService);
  readonly #chains = inject(EvmChainMetadataService);
  readonly #modalService = inject(WalletModalService);

  readonly isMenuOpen = signal(false);

  // Header-only split menus
  readonly isNetworkMenuOpen = signal(false);
  readonly isWalletMenuOpen = signal(false);
  readonly isSwitchingNetwork = signal(false);
  readonly networkStatus = signal<string | null>(null);

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
    this.isMenuOpen.set(false);
    this.closeHeaderMenus();
    this.#modalService.open();
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

  connectorLogo(connector: WalletConnectorId): string {
    if (connector === 'metamask') return 'images/wallets/metamask.png';
    if (connector === 'trust') return 'images/wallets/trustwallet.png';
    if (connector === 'binance') return 'images/wallets/binance.svg';
    return 'images/wallets/walletconnect.svg';
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

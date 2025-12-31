import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardDropdownImports } from '@/shared/components/dropdown/dropdown.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { EvmChainMetadataService } from '../../core/evm-chain-metadata.service';
import { EvmWalletService, type WalletConnectorId } from '../../core/evm-wallet.service';
import { WalletModalService } from '../../core/wallet-modal.service';
import { EVM_NETWORKS } from '../../core/evm-networks';

type Variant = 'header' | 'primary';

@Component({
  selector: 'app-wallet-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ZardButtonComponent,
    ZardDropdownImports,
    ZardDividerComponent,
    ZardAvatarComponent,
    ZardIconComponent,
  ],
  template: `
    @if (!wallet.isConnected()) {
      <button
        z-button
        [zType]="variant() === 'primary' ? 'default' : 'outline'"
        [zSize]="variant() === 'primary' ? 'lg' : 'sm'"
        [class]="variant() === 'primary' ? 'w-full' : ''"
        (click)="open()"
        aria-label="Connect Wallet"
      >
        Connect Wallet
      </button>
    } @else {
      @if (variant() === 'header') {
        <div class="relative flex items-center gap-2">
          <!-- Network dropdown -->
          <button
            z-button
            zType="outline"
            zSize="sm"
            z-dropdown
            [zDropdownMenu]="networkMenu"
            class="!rounded-full !px-3"
            aria-label="Select Network"
          >
            @if (currentNetworkLogo(); as logo) {
              <z-avatar class="h-5 w-5" [zSrc]="logo" [zAlt]="currentNetworkName() + ' logo'" />
            }
            <span class="hidden sm:inline">{{ currentNetworkName() }}</span>
          </button>

          <z-dropdown-menu-content #networkMenu="zDropdownMenuContent" class="w-56">
            @for (opt of evmNetworkOptions(); track opt.key) {
              <z-dropdown-menu-item
                (click)="switchNetwork(opt.key)"
                [disabled]="isSwitchingNetwork()"
              >
                <div class="flex items-center gap-2 w-full">
                  <z-avatar class="h-5 w-5" [zSrc]="opt.logo" [zAlt]="opt.label + ' logo'" />
                  <span class="flex-1">{{ opt.label }}</span>
                  @if (isCurrentNetwork(opt.chain.id)) {
                    <z-icon zType="check" class="h-4 w-4 text-primary" />
                  }
                </div>
              </z-dropdown-menu-item>
            }
            @if (networkStatus(); as s) {
              <z-divider zSpacing="sm" class="-mx-1" />
              <div class="px-3 py-2 text-[11px] text-muted-foreground" aria-live="polite">
                {{ s }}
              </div>
            }
          </z-dropdown-menu-content>

          <!-- Wallet dropdown -->
          <button
            z-button
            zType="outline"
            zSize="sm"
            z-dropdown
            [zDropdownMenu]="walletMenu"
            class="!rounded-full !px-3"
            aria-label="Wallet Options"
          >
            @if (currentWalletLogo(); as wlogo) {
              <z-avatar class="h-5 w-5 bg-white" [zSrc]="wlogo" zAlt="Wallet logo" />
            }
            <span class="font-mono">{{ wallet.shortAddress() }}</span>
          </button>

          <z-dropdown-menu-content #walletMenu="zDropdownMenuContent" class="w-56">
            <z-dropdown-menu-item (click)="copyAddressFromHeader()">
              {{ copyStatus() ?? 'Copy address' }}
            </z-dropdown-menu-item>
            <z-divider zSpacing="sm" class="-mx-1" />
            <z-dropdown-menu-item (click)="disconnectFromHeader()">
              Disconnect
            </z-dropdown-menu-item>
          </z-dropdown-menu-content>
        </div>
      } @else {
        <!-- Non-header connected state -->
        <button
          z-button
          zType="outline"
          zSize="sm"
          z-dropdown
          [zDropdownMenu]="simpleMenu"
          class="!rounded-full !px-3"
          aria-label="Wallet Menu"
        >
          @if (connectedChain(); as chain) {
            @if (connectedChainLogo(); as logo) {
              <z-avatar class="h-5 w-5" [zSrc]="logo" [zAlt]="chain.name + ' logo'" />
            }
            <span class="hidden sm:inline">{{ chain.name }}</span>
          }
          <span class="font-mono">{{ wallet.shortAddress() }}</span>
        </button>

        <z-dropdown-menu-content #simpleMenu="zDropdownMenuContent" class="w-52">
          <z-dropdown-menu-item (click)="copyAddress()">
            {{ copyStatus() ?? 'Copy address' }}
          </z-dropdown-menu-item>
          <z-divider zSpacing="sm" class="-mx-1" />
          <z-dropdown-menu-item (click)="disconnect()"> Disconnect </z-dropdown-menu-item>
        </z-dropdown-menu-content>
      }
    }
  `,
})
export class WalletButtonComponent {
  readonly variant = input<Variant>('header');

  readonly wallet = inject(EvmWalletService);
  readonly #chains = inject(EvmChainMetadataService);
  readonly #modalService = inject(WalletModalService);

  readonly isSwitchingNetwork = signal(false);
  readonly networkStatus = signal<string | null>(null);
  readonly copyStatus = signal<string | null>(null);

  readonly connectedChain = computed(() => this.#chains.get(this.wallet.chainId()));

  readonly connectedChainLogo = computed(() => {
    const chainId = this.wallet.chainId();
    const meta = this.#chains.get(chainId);

    // Prefer API logo, fallback to hardcoded logos
    if (meta?.logoUri) return meta.logoUri;

    if (chainId === 1) return 'images/branding/eth.png';
    if (chainId === 56) return 'images/branding/bsc.png';
    if (chainId === 137) return 'images/branding/plg.png';
    return null;
  });

  readonly currentNetworkName = computed(() => {
    const chainId = this.wallet.chainId();
    const meta = this.#chains.get(chainId);

    // Prefer API name, fallback to hardcoded names
    if (meta?.name) return meta.name;

    if (chainId === 1) return 'Ethereum';
    if (chainId === 56) return 'BNB Smart Chain';
    if (chainId === 137) return 'Polygon';
    return 'Network';
  });

  readonly currentNetworkLogo = computed(() => this.connectedChainLogo());

  readonly currentWalletLogo = computed(() => {
    const c = this.wallet.connector();
    return c ? this.connectorLogo(c) : null;
  });

  readonly evmNetworkOptions = computed(() => {
    // Touch chain metadata signal so labels/logos refresh when remote metadata loads
    this.#chains.byId();

    return [
      {
        key: 'eth' as const,
        label: this.#chains.get(1)?.name ?? 'Ethereum',
        logo: this.#chains.get(1)?.logoUri ?? 'images/branding/eth.png',
        chain: EVM_NETWORKS.eth.chain,
      },
      {
        key: 'bsc' as const,
        label: this.#chains.get(56)?.name ?? 'BNB Smart Chain',
        logo: this.#chains.get(56)?.logoUri ?? 'images/branding/bsc.png',
        chain: EVM_NETWORKS.bsc.chain,
      },
      {
        key: 'plg' as const,
        label: this.#chains.get(137)?.name ?? 'Polygon',
        logo: this.#chains.get(137)?.logoUri ?? 'images/branding/plg.png',
        chain: EVM_NETWORKS.plg.chain,
      },
    ];
  });

  isCurrentNetwork(chainId: number): boolean {
    return this.wallet.chainId() === chainId;
  }

  open(): void {
    this.#modalService.open();
  }

  async switchNetwork(key: 'eth' | 'bsc' | 'plg'): Promise<void> {
    this.networkStatus.set(null);
    this.isSwitchingNetwork.set(true);
    try {
      await this.wallet.ensureChain(EVM_NETWORKS[key].chain);
      this.networkStatus.set(
        `Switched to ${this.evmNetworkOptions().find((o) => o.key === key)?.label ?? 'network'}.`,
      );
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
    await this.handleCopy();
  }

  async disconnectFromHeader(): Promise<void> {
    await this.wallet.disconnect();
  }

  connectorLogo(connector: WalletConnectorId): string {
    if (connector === 'metamask') return 'images/wallets/metamask.png';
    if (connector === 'trust') return 'images/wallets/trustwallet.png';
    if (connector === 'binance') return 'images/wallets/binance.svg';
    return 'images/wallets/walletconnect.svg';
  }

  async disconnect(): Promise<void> {
    await this.wallet.disconnect();
  }

  async copyAddress(): Promise<void> {
    await this.handleCopy();
  }

  private async handleCopy(): Promise<void> {
    const addr = this.wallet.address();
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
      this.copyStatus.set('Copied!');
      setTimeout(() => {
        if (this.copyStatus() === 'Copied!') {
          this.copyStatus.set(null);
        }
      }, 1000);
    } catch {
      this.copyStatus.set('Copy failed - select manually');
      setTimeout(() => {
        if (this.copyStatus() === 'Copy failed - select manually') {
          this.copyStatus.set(null);
        }
      }, 3000);
    }
  }
}

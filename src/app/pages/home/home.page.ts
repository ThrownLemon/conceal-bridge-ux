import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';

import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardDropdownImports } from '@/shared/components/dropdown/dropdown.imports';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { EvmChainMetadataService } from '../../core/evm-chain-metadata.service';
import { EVM_NETWORKS } from '../../core/evm-networks';
import type { EvmNetworkKey, SwapDirection } from '../../core/bridge-types';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { WalletButtonComponent } from '../../shared/wallet/wallet-button.component';

type NetworkKey = 'ccx' | EvmNetworkKey;

const NETWORK_LOGOS: Record<NetworkKey, string> = {
  ccx: 'images/branding/ccx.png',
  eth: 'images/branding/eth.png',
  bsc: 'images/branding/bsc.png',
  plg: 'images/branding/plg.png',
};

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    WalletButtonComponent,
    ZardAvatarComponent,
    ZardButtonComponent,
    ZardCardComponent,
    ZardDropdownImports,
    ZardIconComponent,
  ],
  template: `
    <section class="mx-auto max-w-3xl">
      <h1 class="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        Conceal Bridge
      </h1>
      <p class="mt-3 text-pretty text-muted-foreground">
        Swap between Conceal (CCX) and wrapped CCX (wCCX) on Ethereum, BSC, or Polygon.
      </p>

      <z-card class="mt-8">
        <form class="grid gap-5" [formGroup]="form" (ngSubmit)="go()">
          <fieldset class="grid gap-3">
            <legend class="text-sm font-medium">Networks</legend>

            <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <!-- From network dropdown -->
              <div class="grid gap-2">
                <div class="text-sm font-medium text-muted-foreground">From</div>
                <button
                  z-button
                  zType="outline"
                  type="button"
                  z-dropdown
                  [zDropdownMenu]="fromMenu"
                  class="flex w-full items-center gap-3 !justify-start !px-3 !py-6"
                  aria-label="Select source network"
                >
                  @if (fromDisplay(); as n) {
                    <z-avatar class="h-7 w-7" [zSrc]="n.logoUri" [zAlt]="n.label + ' logo'" />
                    <div class="min-w-0 flex-1 text-left">
                      <div class="truncate text-sm font-semibold">{{ n.label }}</div>
                      <div class="truncate text-xs text-muted-foreground">{{ n.subtitle }}</div>
                    </div>
                  }
                </button>

                <z-dropdown-menu-content #fromMenu="zDropdownMenuContent" class="w-full">
                  @for (o of networkOptions(); track o.key) {
                    <z-dropdown-menu-item (click)="setFromNetwork(o.key)">
                      <div class="flex items-center gap-3">
                        <z-avatar class="h-6 w-6" [zSrc]="o.logoUri" [zAlt]="o.label + ' logo'" />
                        <span>{{ o.label }}</span>
                      </div>
                    </z-dropdown-menu-item>
                  }
                </z-dropdown-menu-content>
              </div>

              <!-- Swap button -->
              <div class="flex justify-center">
                <button
                  z-button
                  zType="outline"
                  zShape="circle"
                  type="button"
                  (click)="swapNetworks()"
                  aria-label="Swap networks"
                >
                  <z-icon zType="arrow-left-right" />
                </button>
              </div>

              <!-- To network dropdown -->
              <div class="grid gap-2">
                <div class="text-sm font-medium text-muted-foreground">To</div>
                <button
                  z-button
                  zType="outline"
                  type="button"
                  z-dropdown
                  [zDropdownMenu]="toMenu"
                  class="flex w-full items-center gap-3 !justify-start !px-3 !py-6"
                  aria-label="Select destination network"
                >
                  @if (toDisplay(); as n) {
                    <z-avatar class="h-7 w-7" [zSrc]="n.logoUri" [zAlt]="n.label + ' logo'" />
                    <div class="min-w-0 flex-1 text-left">
                      <div class="truncate text-sm font-semibold">{{ n.label }}</div>
                      <div class="truncate text-xs text-muted-foreground">{{ n.subtitle }}</div>
                    </div>
                  }
                </button>

                <z-dropdown-menu-content #toMenu="zDropdownMenuContent" class="w-full">
                  @for (o of networkOptions(); track o.key) {
                    <z-dropdown-menu-item (click)="setToNetwork(o.key)">
                      <div class="flex items-center gap-3">
                        <z-avatar class="h-6 w-6" [zSrc]="o.logoUri" [zAlt]="o.label + ' logo'" />
                        <span>{{ o.label }}</span>
                      </div>
                    </z-dropdown-menu-item>
                  }
                </z-dropdown-menu-content>
              </div>
            </div>

            <p class="text-xs text-muted-foreground">
              One side must be Conceal (CCX). Logos/names are loaded from a public chain metadata
              API.
            </p>
            @if (networkSwitchStatus(); as status) {
              <p class="text-xs text-amber-400" aria-live="polite">{{ status }}</p>
            }
          </fieldset>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs text-muted-foreground">
              By continuing, you agree to the bridge Terms &amp; Conditions.
            </div>

            @if (!wallet.isConnected()) {
              <app-wallet-button variant="primary" />
            } @else {
              <button z-button type="submit" aria-label="Continue to swap">Continue</button>
            }
          </div>
        </form>
      </z-card>

      <div class="mt-10 grid gap-3 text-sm sm:grid-cols-2">
        <z-card
          class="hover:border-primary/30 transition-colors"
          zTitle="User guide"
          zDescription="How the bridge works and how to complete swaps safely."
          zAction="Open"
          (zActionClick)="openUserGuide()"
        />

        <z-card
          class="hover:border-primary/30 transition-colors"
          zTitle="Get MetaMask"
          zDescription="You'll need an EVM wallet to send gas fees or wCCX."
          zAction="Download"
          (zActionClick)="openMetaMask()"
        />
      </div>
    </section>
  `,
})
export class HomePage {
  readonly #router = inject(Router);
  readonly #fb = inject(NonNullableFormBuilder);
  readonly #wallet = inject(EvmWalletService);
  readonly #chainMeta = inject(EvmChainMetadataService);

  readonly wallet = this.#wallet;

  readonly networks = Object.values(EVM_NETWORKS);

  readonly networkSwitchStatus = signal<string | null>(null);
  readonly isSwitchingNetwork = signal(false);

  readonly form = this.#fb.group({
    direction: this.#fb.control<SwapDirection>('ccx-to-evm'),
    fromNetwork: this.#fb.control<NetworkKey>('ccx'),
    toNetwork: this.#fb.control<NetworkKey>('bsc'),
  });

  readonly direction = toSignal(
    this.form.controls.direction.valueChanges.pipe(startWith(this.form.controls.direction.value)),
    { initialValue: this.form.controls.direction.value },
  );

  readonly fromKey = toSignal(
    this.form.controls.fromNetwork.valueChanges.pipe(
      startWith(this.form.controls.fromNetwork.value),
    ),
    { initialValue: this.form.controls.fromNetwork.value },
  );

  readonly toKey = toSignal(
    this.form.controls.toNetwork.valueChanges.pipe(startWith(this.form.controls.toNetwork.value)),
    { initialValue: this.form.controls.toNetwork.value },
  );

  readonly #lastEvm = signal<EvmNetworkKey>('bsc');

  readonly networkOptions = computed(() => {
    // Touch chain metadata signal so labels refresh when remote metadata loads.
    this.#chainMeta.byId();
    return [
      {
        key: 'ccx' as const,
        label: 'Conceal',
        subtitle: 'Native chain',
        logoUri: NETWORK_LOGOS.ccx,
      },
      ...this.networks.map((n) => ({
        key: n.key,
        label: this.networkLabel(n.key),
        subtitle: 'EVM network',
        logoUri: NETWORK_LOGOS[n.key],
      })),
    ];
  });

  readonly fromDisplay = computed(() => this.displayFor(this.fromKey()));

  readonly toDisplay = computed(() => this.displayFor(this.toKey()));

  swapNetworks(): void {
    const from = this.form.controls.fromNetwork.value;
    const to = this.form.controls.toNetwork.value;
    this.form.controls.fromNetwork.setValue(to);
    this.form.controls.toNetwork.setValue(from);
    this.normalizeNetworks();
    this.networkSwitchStatus.set(null);
  }

  networkLabel(key: EvmNetworkKey): string {
    const info = EVM_NETWORKS[key];
    const meta = this.#chainMeta.get(info.chain.id);
    return meta?.name ?? info.label;
  }

  displayFor(key: NetworkKey) {
    if (key === 'ccx') {
      return { label: 'Conceal', subtitle: 'Native chain', logoUri: NETWORK_LOGOS.ccx };
    }
    return { label: this.networkLabel(key), subtitle: 'EVM network', logoUri: NETWORK_LOGOS[key] };
  }

  openUserGuide(): void {
    window.open('https://concealnetwork.medium.com/conceal-bridge-user-guide-2ad03eee4963', '_blank');
  }

  openMetaMask(): void {
    window.open('https://metamask.io/download.html', '_blank');
  }

  setFromNetwork(next: NetworkKey): void {
    const otherBefore = this.form.controls.toNetwork.value;
    if (next === otherBefore) {
      this.networkSwitchStatus.set('From and To networks cannot be the same.');
      if (next === 'ccx') {
        this.form.controls.toNetwork.setValue(this.#lastEvm());
        this.form.controls.direction.setValue('ccx-to-evm');
        return;
      }
      this.form.controls.toNetwork.setValue('ccx');
      this.form.controls.direction.setValue('evm-to-ccx');
      return;
    }

    if (next === 'ccx') {
      this.form.controls.fromNetwork.setValue('ccx');
      const other = this.form.controls.toNetwork.value;
      if (other === 'ccx') this.form.controls.toNetwork.setValue(this.#lastEvm());
      this.form.controls.direction.setValue('ccx-to-evm');
    } else {
      this.#lastEvm.set(next);
      this.form.controls.fromNetwork.setValue(next);
      this.form.controls.toNetwork.setValue('ccx');
      this.form.controls.direction.setValue('evm-to-ccx');
    }

    this.networkSwitchStatus.set(null);
    this.normalizeNetworks();
  }

  setToNetwork(next: NetworkKey): void {
    const otherBefore = this.form.controls.fromNetwork.value;
    if (next === otherBefore) {
      this.networkSwitchStatus.set('From and To networks cannot be the same.');
      if (next === 'ccx') {
        this.form.controls.fromNetwork.setValue(this.#lastEvm());
        this.form.controls.direction.setValue('evm-to-ccx');
        return;
      }
      this.form.controls.fromNetwork.setValue('ccx');
      this.form.controls.direction.setValue('ccx-to-evm');
      return;
    }

    if (next === 'ccx') {
      this.form.controls.toNetwork.setValue('ccx');
      const other = this.form.controls.fromNetwork.value;
      if (other === 'ccx') this.form.controls.fromNetwork.setValue(this.#lastEvm());
      this.form.controls.direction.setValue('evm-to-ccx');
    } else {
      this.#lastEvm.set(next);
      this.form.controls.toNetwork.setValue(next);
      this.form.controls.fromNetwork.setValue('ccx');
      this.form.controls.direction.setValue('ccx-to-evm');
    }

    this.networkSwitchStatus.set(null);
    this.normalizeNetworks();
  }

  normalizeNetworks(): void {
    const from = this.form.controls.fromNetwork.value;
    const to = this.form.controls.toNetwork.value;

    // Always keep exactly one side as CCX (no EVM↔EVM and no CCX↔CCX).
    if (from === 'ccx' && to === 'ccx') {
      this.form.controls.toNetwork.setValue(this.#lastEvm());
      this.form.controls.direction.setValue('ccx-to-evm');
      return;
    }

    if (from !== 'ccx' && to !== 'ccx') {
      // Prefer "ccx-to-evm": set from to CCX, keep selected EVM on to.
      this.form.controls.fromNetwork.setValue('ccx');
      this.form.controls.toNetwork.setValue(this.#lastEvm());
      this.form.controls.direction.setValue('ccx-to-evm');
      return;
    }

    // Keep direction consistent with network sides.
    if (from === 'ccx') this.form.controls.direction.setValue('ccx-to-evm');
    else this.form.controls.direction.setValue('evm-to-ccx');
  }

  async switchWalletToSelectedNetwork(): Promise<void> {
    this.networkSwitchStatus.set(null);

    if (!this.#wallet.isInstalled()) {
      this.networkSwitchStatus.set('Install MetaMask to switch networks.');
      return;
    }

    const direction = this.form.controls.direction.value;
    const candidate =
      direction === 'ccx-to-evm'
        ? this.form.controls.toNetwork.value
        : this.form.controls.fromNetwork.value;
    if (candidate === 'ccx') {
      this.networkSwitchStatus.set('Select an EVM network to switch your wallet.');
      return;
    }
    const network: EvmNetworkKey = candidate;
    const { chain, label } = EVM_NETWORKS[network];

    this.isSwitchingNetwork.set(true);
    try {
      await this.#wallet.hydrate();
      if (this.#wallet.chainId() === chain.id) {
        this.networkSwitchStatus.set(`Wallet already on ${label}.`);
        return;
      }

      await this.#wallet.ensureChain(chain);
      this.networkSwitchStatus.set(`Switched wallet to ${label}.`);
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      if (code === 4001) {
        this.networkSwitchStatus.set('Network switch was cancelled in your wallet.');
      } else if (code === -32002) {
        this.networkSwitchStatus.set(
          'A wallet request is already pending. Please open your wallet.',
        );
      } else {
        this.networkSwitchStatus.set(e instanceof Error ? e.message : 'Network switch failed.');
      }
    } finally {
      this.isSwitchingNetwork.set(false);
    }
  }

  go(): void {
    const direction = this.form.controls.direction.value;
    const from = this.form.controls.fromNetwork.value;
    const to = this.form.controls.toNetwork.value;

    // Enforce constraints at submit time too.
    if (from === to) {
      this.networkSwitchStatus.set('Please choose different From and To networks.');
      return;
    }
    if (from !== 'ccx' && to !== 'ccx') {
      this.networkSwitchStatus.set(
        'Direct EVM-to-EVM swaps are not supported yet. Choose Conceal on one side.',
      );
      return;
    }
    if (from === 'ccx' && to === 'ccx') {
      this.networkSwitchStatus.set('Choose an EVM network on one side.');
      return;
    }

    const network: EvmNetworkKey = (direction === 'ccx-to-evm' ? to : from) as EvmNetworkKey;
    void this.#router.navigate(['/swap', direction, network]);
  }
}

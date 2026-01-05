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

import { EVM_NETWORKS } from '../../core/evm-networks';
import type { EvmNetworkKey, SwapDirection } from '../../core/bridge-types';
import { EvmWalletService } from '../../core/evm-wallet.service';
import { getWalletErrorMessage } from '../../core/utils/wallet-errors';
import { WalletButtonComponent } from '../../shared/wallet/wallet-button.component';

type NetworkKey = 'ccx' | EvmNetworkKey;

const NETWORK_LOGOS: Record<NetworkKey, string> = {
  ccx: 'images/branding/ccx.png',
  eth: EVM_NETWORKS.eth.logoUri,
  bsc: EVM_NETWORKS.bsc.logoUri,
  plg: EVM_NETWORKS.plg.logoUri,
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
      <h1 class="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Conceal Bridge</h1>
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

            @if (direction(); as dir) {
              <p class="text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                <span>You are swapping</span>
                @if (dir === 'ccx-to-evm') {
                  @if (fromDisplay(); as from) {
                    <span class="inline-flex items-center gap-1">
                      <z-avatar class="h-4 w-4" [zSrc]="from.logoUri" [zAlt]="from.label" />
                      <span class="font-semibold">{{ from.label }} (CCX)</span>
                    </span>
                  }
                  <span>to</span>
                  @if (toDisplay(); as to) {
                    <span class="inline-flex items-center gap-1">
                      <span class="font-semibold">Wrapped CCX (wCCX)</span>
                      <span>on</span>
                      <z-avatar class="h-4 w-4" [zSrc]="to.logoUri" [zAlt]="to.label" />
                      <span class="font-semibold">{{ to.label }}</span>
                    </span>
                  }
                } @else {
                  @if (fromDisplay(); as from) {
                    <span class="inline-flex items-center gap-1">
                      <span class="font-semibold">Wrapped CCX (wCCX)</span>
                      <span>on</span>
                      <z-avatar class="h-4 w-4" [zSrc]="from.logoUri" [zAlt]="from.label" />
                      <span class="font-semibold">{{ from.label }}</span>
                    </span>
                  }
                  <span>to</span>
                  @if (toDisplay(); as to) {
                    <span class="inline-flex items-center gap-1">
                      <z-avatar class="h-4 w-4" [zSrc]="to.logoUri" [zAlt]="to.label" />
                      <span class="font-semibold">{{ to.label }} (CCX)</span>
                    </span>
                  }
                }
              </p>
            }
            @if (networkSwitchStatus(); as status) {
              <p class="text-xs text-amber-400" aria-live="polite">{{ status }}</p>
            }
          </fieldset>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs text-muted-foreground">
              By continuing, you agree to the bridge
              <a
                (click)="openTerms()"
                class="cursor-pointer underline decoration-dotted hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                role="button"
                tabindex="0"
                aria-label="Open Terms and Conditions in new tab"
              >
                Terms &amp; Conditions </a
              >.
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

  readonly wallet = this.#wallet;

  readonly networks = Object.values(EVM_NETWORKS);

  readonly networkSwitchStatus = signal<string | null>(null);
  readonly isSwitchingNetwork = signal(false);

  readonly form = this.#fb.group({
    direction: this.#fb.control<SwapDirection>('ccx-to-evm'),
    fromNetwork: this.#fb.control<NetworkKey>('ccx'),
    toNetwork: this.#fb.control<NetworkKey>('eth'),
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
    return [
      {
        key: 'ccx' as const,
        label: 'Conceal',
        subtitle: 'Native chain',
        logoUri: NETWORK_LOGOS.ccx,
      },
      ...this.networks.map((n) => ({
        key: n.key,
        label: n.label,
        subtitle: 'EVM network',
        logoUri: n.logoUri,
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
    return EVM_NETWORKS[key].label;
  }

  displayFor(key: NetworkKey) {
    if (key === 'ccx') {
      return { label: 'Conceal', subtitle: 'Native chain', logoUri: NETWORK_LOGOS.ccx };
    }
    const info = EVM_NETWORKS[key];
    return {
      label: info.label,
      subtitle: 'EVM network',
      logoUri: info.logoUri,
    };
  }

  openUserGuide(): void {
    window.open(
      'https://concealnetwork.medium.com/conceal-bridge-user-guide-2ad03eee4963',
      '_blank',
    );
  }

  openMetaMask(): void {
    window.open('https://metamask.io/download.html', '_blank');
  }

  openTerms(): void {
    window.open(
      'https://concealnetwork.medium.com/conceal-bridge-user-guide-2ad03eee4963',
      '_blank',
    );
  }

  setFromNetwork(next: NetworkKey): void {
    const currentFrom = this.form.controls.fromNetwork.value;
    const currentTo = this.form.controls.toNetwork.value;

    // If user selects the same network that's in TO, swap them
    if (next === currentTo) {
      // Swap: TO gets old FROM value, FROM gets the selected value
      this.form.controls.toNetwork.setValue(currentFrom);
      this.form.controls.fromNetwork.setValue(next);
      // Update direction based on where CCX ended up
      if (next === 'ccx') {
        this.form.controls.direction.setValue('ccx-to-evm');
        if (currentFrom !== 'ccx') this.#lastEvm.set(currentFrom);
      } else {
        this.form.controls.direction.setValue('evm-to-ccx');
        this.#lastEvm.set(next);
      }
      this.networkSwitchStatus.set(null);
      this.normalizeNetworks();
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
    const currentFrom = this.form.controls.fromNetwork.value;
    const currentTo = this.form.controls.toNetwork.value;

    // If user selects the same network that's in FROM, swap them
    if (next === currentFrom) {
      // Swap: FROM gets old TO value, TO gets the selected value
      this.form.controls.fromNetwork.setValue(currentTo);
      this.form.controls.toNetwork.setValue(next);
      // Update direction based on where CCX ended up
      if (next === 'ccx') {
        this.form.controls.direction.setValue('evm-to-ccx');
        if (currentTo !== 'ccx') this.#lastEvm.set(currentTo);
      } else {
        this.form.controls.direction.setValue('ccx-to-evm');
        this.#lastEvm.set(next);
      }
      this.networkSwitchStatus.set(null);
      this.normalizeNetworks();
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
      this.networkSwitchStatus.set(getWalletErrorMessage(e, 'Network switch failed.'));
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

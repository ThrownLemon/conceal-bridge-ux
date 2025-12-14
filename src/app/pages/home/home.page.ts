import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';

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
  imports: [ReactiveFormsModule, WalletButtonComponent],
  template: `
    <section class="mx-auto max-w-3xl">
      <h1
        class="text-balance text-3xl font-semibold tracking-tight text-[var(--cb-color-text)] sm:text-4xl"
      >
        Conceal Bridge
      </h1>
      <p class="mt-3 text-pretty text-[var(--cb-color-muted)]">
        Swap between Conceal (CCX) and wrapped CCX (wCCX) on Ethereum, BSC, or Polygon.
      </p>

      <div
        class="mt-8 rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)]/50 p-5 shadow-sm backdrop-blur"
      >
        <form class="grid gap-5" [formGroup]="form" (ngSubmit)="go()">
          <fieldset class="grid gap-3">
            <legend class="text-sm font-medium text-[var(--cb-color-text)]">Networks</legend>

            @if (isFromMenuOpen() || isToMenuOpen()) {
              <div class="fixed inset-0 z-40" (click)="closeMenus()" aria-hidden="true"></div>
            }

            <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div class="grid gap-2">
                <div class="text-sm font-medium text-[var(--cb-color-text-secondary)]">From</div>
                <div class="relative">
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-3 text-left hover:border-[var(--cb-color-border)]/50"
                    (click)="toggleFromMenu()"
                    aria-haspopup="listbox"
                    [attr.aria-expanded]="isFromMenuOpen()"
                  >
                    @if (fromDisplay(); as n) {
                      <img
                        class="h-7 w-7 rounded-full"
                        [src]="n.logoUri"
                        [alt]="n.label + ' logo'"
                        loading="lazy"
                        decoding="async"
                      />
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-semibold text-[var(--cb-color-text)]">
                          {{ n.label }}
                        </div>
                        <div class="truncate text-xs text-[var(--cb-color-muted)]">
                          {{ n.subtitle }}
                        </div>
                      </div>
                    }
                    <span class="text-[var(--cb-color-text-secondary)]">▾</span>
                  </button>

                  @if (isFromMenuOpen()) {
                    <div
                      class="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] shadow-lg"
                      role="listbox"
                      aria-label="From network"
                    >
                      @for (o of networkOptions(); track o.key) {
                        <button
                          type="button"
                          class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--cb-color-text)] hover:bg-black/5 dark:hover:bg-white/5"
                          (click)="setFromNetwork(o.key)"
                          role="option"
                          [attr.aria-selected]="fromKey() === o.key"
                        >
                          <img
                            class="h-6 w-6 rounded-full"
                            [src]="o.logoUri"
                            [alt]="o.label + ' logo'"
                            loading="lazy"
                            decoding="async"
                          />
                          <span class="flex-1">{{ o.label }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="flex justify-center">
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] text-[var(--cb-color-text)] hover:border-[var(--cb-color-border)]/50"
                  (click)="swapNetworks()"
                  aria-label="Swap networks"
                >
                  ⇄
                </button>
              </div>

              <div class="grid gap-2">
                <div class="text-sm font-medium text-[var(--cb-color-text-secondary)]">To</div>
                <div class="relative">
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-3 text-left hover:border-[var(--cb-color-border)]/50"
                    (click)="toggleToMenu()"
                    aria-haspopup="listbox"
                    [attr.aria-expanded]="isToMenuOpen()"
                  >
                    @if (toDisplay(); as n) {
                      <img
                        class="h-7 w-7 rounded-full"
                        [src]="n.logoUri"
                        [alt]="n.label + ' logo'"
                        loading="lazy"
                        decoding="async"
                      />
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-semibold text-[var(--cb-color-text)]">
                          {{ n.label }}
                        </div>
                        <div class="truncate text-xs text-[var(--cb-color-muted)]">
                          {{ n.subtitle }}
                        </div>
                      </div>
                    }
                    <span class="text-[var(--cb-color-text-secondary)]">▾</span>
                  </button>

                  @if (isToMenuOpen()) {
                    <div
                      class="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] shadow-lg"
                      role="listbox"
                      aria-label="To network"
                    >
                      @for (o of networkOptions(); track o.key) {
                        <button
                          type="button"
                          class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--cb-color-text)] hover:bg-[var(--cb-color-text)]/5"
                          (click)="setToNetwork(o.key)"
                          role="option"
                          [attr.aria-selected]="toKey() === o.key"
                        >
                          <img
                            class="h-6 w-6 rounded-full"
                            [src]="o.logoUri"
                            [alt]="o.label + ' logo'"
                            loading="lazy"
                            decoding="async"
                          />
                          <span class="flex-1">{{ o.label }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>

            <p class="text-xs text-[var(--cb-color-muted)]">
              One side must be Conceal (CCX). Logos/names are loaded from a public chain metadata
              API.
            </p>
            @if (networkSwitchStatus(); as status) {
              <p class="text-xs text-amber-200" aria-live="polite">{{ status }}</p>
            }
          </fieldset>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs text-[var(--cb-color-muted)]">
              By continuing, you agree to the bridge Terms &amp; Conditions.
            </div>

            @if (!wallet.isConnected()) {
              <app-wallet-button variant="primary" />
            } @else {
              <button
                class="inline-flex items-center justify-center rounded-lg bg-[var(--cb-color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--cb-color-accent)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--cb-color-accent)]/40"
                type="submit"
              >
                Continue
              </button>
            }
          </div>
        </form>
      </div>

      <div class="mt-10 grid gap-3 text-sm text-[var(--cb-color-muted)] sm:grid-cols-2">
        <a
          class="rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-4 hover:border-[var(--cb-color-border)]/50"
          href="https://concealnetwork.medium.com/conceal-bridge-user-guide-2ad03eee4963"
          target="_blank"
          rel="noopener"
        >
          <div class="font-medium text-[var(--cb-color-text)]">User guide</div>
          <div class="mt-1 text-[var(--cb-color-muted)]">
            How the bridge works and how to complete swaps safely.
          </div>
        </a>

        <a
          class="rounded-xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-4 hover:border-[var(--cb-color-border)]/50"
          href="https://metamask.io/download.html"
          target="_blank"
          rel="noopener"
        >
          <div class="font-medium text-[var(--cb-color-text)]">Get MetaMask</div>
          <div class="mt-1 text-[var(--cb-color-muted)]">
            You’ll need an EVM wallet to send gas fees or wCCX.
          </div>
        </a>
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

  readonly isFromMenuOpen = signal(false);
  readonly isToMenuOpen = signal(false);

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

  toggleFromMenu(): void {
    this.isFromMenuOpen.update((v) => !v);
    this.isToMenuOpen.set(false);
  }

  toggleToMenu(): void {
    this.isToMenuOpen.update((v) => !v);
    this.isFromMenuOpen.set(false);
  }

  closeMenus(): void {
    this.isFromMenuOpen.set(false);
    this.isToMenuOpen.set(false);
  }

  setFromNetwork(next: NetworkKey): void {
    const otherBefore = this.form.controls.toNetwork.value;
    if (next === otherBefore) {
      this.networkSwitchStatus.set('From and To networks cannot be the same.');
      // Auto-fix by keeping the "one side is CCX" rule.
      if (next === 'ccx') {
        this.form.controls.toNetwork.setValue(this.#lastEvm());
        this.form.controls.direction.setValue('ccx-to-evm');
        this.closeMenus();
        return;
      }
      this.form.controls.toNetwork.setValue('ccx');
      this.form.controls.direction.setValue('evm-to-ccx');
      this.closeMenus();
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
    this.closeMenus();
    this.normalizeNetworks();
  }

  setToNetwork(next: NetworkKey): void {
    const otherBefore = this.form.controls.fromNetwork.value;
    if (next === otherBefore) {
      this.networkSwitchStatus.set('From and To networks cannot be the same.');
      // Auto-fix by keeping the "one side is CCX" rule.
      if (next === 'ccx') {
        this.form.controls.fromNetwork.setValue(this.#lastEvm());
        this.form.controls.direction.setValue('evm-to-ccx');
        this.closeMenus();
        return;
      }
      this.form.controls.fromNetwork.setValue('ccx');
      this.form.controls.direction.setValue('ccx-to-evm');
      this.closeMenus();
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
    this.closeMenus();
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

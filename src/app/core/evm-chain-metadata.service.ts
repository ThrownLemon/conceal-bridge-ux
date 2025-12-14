import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

export interface EvmChainMetadata {
  chainId: number;
  name: string;
  logoUri: string | null;
}

interface LifiChain {
  id: number;
  name: string;
  logoURI?: string;
  chainType?: string;
}

/**
 * Lightweight public chain metadata (name + logo).
 *
 * Source: LI.FI public API `https://li.quest/v1/chains`
 */
@Injectable({ providedIn: 'root' })
export class EvmChainMetadataService {
  readonly #http = inject(HttpClient);

  readonly #byId = signal<Map<number, EvmChainMetadata>>(new Map());
  readonly byId = this.#byId.asReadonly();

  readonly isLoaded = computed(() => this.#byId().size > 0);

  constructor() {
    this.#load();
  }

  get(chainId: number | null): EvmChainMetadata | null {
    if (!chainId) return null;
    return this.#byId().get(chainId) ?? null;
  }

  #load(): void {
    this.#http
      .get<{ chains: LifiChain[] }>('https://li.quest/v1/chains')
      .pipe(catchError(() => of({ chains: [] as LifiChain[] })))
      .subscribe(({ chains }) => {
        const next = new Map<number, EvmChainMetadata>();
        for (const c of chains) {
          // Only EVM chains are relevant for this app.
          if (c.chainType && c.chainType !== 'EVM') continue;
          if (!Number.isFinite(c.id)) continue;
          const name = (c.name ?? '').trim();
          if (!name) continue;
          next.set(c.id, {
            chainId: c.id,
            name,
            logoUri: c.logoURI?.trim() || null,
          });
        }
        this.#byId.set(next);
      });
  }
}

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
    const CACHE_KEY = 'evm-chain-metadata-v1';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { timestamp, data } = JSON.parse(raw) as {
          timestamp: number;
          data: EvmChainMetadata[];
        };
        if (Date.now() - timestamp < CACHE_TTL) {
          const next = new Map<number, EvmChainMetadata>();
          for (const item of data) {
            next.set(item.chainId, item);
          }
          this.#byId.set(next);
          return;
        }
      }
    } catch {
      // Ignore storage errors
    }

    this.#http
      .get<{ chains: LifiChain[] }>('https://li.quest/v1/chains')
      .pipe(catchError(() => of({ chains: [] as LifiChain[] })))
      .subscribe(({ chains }) => {
        const next = new Map<number, EvmChainMetadata>();
        const toCache: EvmChainMetadata[] = [];

        for (const c of chains) {
          // Only EVM chains are relevant for this app.
          if (c.chainType && c.chainType !== 'EVM') continue;
          if (!Number.isFinite(c.id)) continue;
          const name = (c.name ?? '').trim();
          if (!name) continue;

          const meta: EvmChainMetadata = {
            chainId: c.id,
            name,
            logoUri: c.logoURI?.trim() || null,
          };
          next.set(c.id, meta);
          toCache.push(meta);
        }
        this.#byId.set(next);

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: toCache }));
        } catch {
          // Ignore storage errors
        }
      });
  }
}

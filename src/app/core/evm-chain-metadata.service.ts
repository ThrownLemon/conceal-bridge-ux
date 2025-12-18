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

interface CachedChains {
  timestamp: number;
  chains: [number, EvmChainMetadata][];
}

const CACHE_KEY = 'conceal_bridge_chain_metadata';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
    // Try to load from cache first
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(CACHE_KEY);
        if (stored) {
          const cache = JSON.parse(stored) as CachedChains;
          if (
            Date.now() - cache.timestamp < CACHE_TTL &&
            Array.isArray(cache.chains) &&
            cache.chains.length > 0
          ) {
            this.#byId.set(new Map(cache.chains));
            return;
          }
        }
      } catch {
        // ignore cache errors
      }
    }

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

        // Cache the result
        if (typeof window !== 'undefined' && next.size > 0) {
          try {
            const cache: CachedChains = {
              timestamp: Date.now(),
              chains: Array.from(next.entries()),
            };
            window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
          } catch {
            // ignore storage errors
          }
        }
      });
  }
}

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

const CACHE_KEY = 'CONCEAL_BRIDGE_CHAIN_METADATA';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
  timestamp: number;
  data: EvmChainMetadata[];
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
    if (this.#loadFromCache()) {
      return;
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
        this.#saveToCache(toCache);
      });
  }

  #loadFromCache(): boolean {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return false;

      const parsed: CacheData = JSON.parse(stored);
      if (Date.now() - parsed.timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return false;
      }

      const next = new Map<number, EvmChainMetadata>();
      for (const item of parsed.data) {
        next.set(item.chainId, item);
      }
      this.#byId.set(next);
      return true;
    } catch {
      return false;
    }
  }

  #saveToCache(data: EvmChainMetadata[]): void {
    try {
      const cacheData: CacheData = {
        timestamp: Date.now(),
        data,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      // Ignore storage errors
    }
  }
}

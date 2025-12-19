import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { EvmChainMetadataService } from './evm-chain-metadata.service';

describe('EvmChainMetadataService', () => {
  let service: EvmChainMetadataService;
  let httpMock: HttpTestingController;

  const CACHE_KEY = 'CONCEAL_BRIDGE_CHAIN_METADATA';
  const mockChains = {
    chains: [
      { id: 1, name: 'Ethereum', chainType: 'EVM', logoURI: 'eth.png' },
      { id: 137, name: 'Polygon', chainType: 'EVM', logoURI: 'plg.png' },
    ],
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EvmChainMetadataService],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should fetch chains from API if cache is empty', () => {
    service = TestBed.inject(EvmChainMetadataService);

    const req = httpMock.expectOne('https://li.quest/v1/chains');
    expect(req.request.method).toBe('GET');
    req.flush(mockChains);

    expect(service.byId().size).toBe(2);
    expect(service.get(1)?.name).toBe('Ethereum');

    // Verify cache was set
    const cached = localStorage.getItem(CACHE_KEY);
    expect(cached).toBeTruthy();
    const parsed = JSON.parse(cached!);
    expect(parsed.data.length).toBe(2);
    expect(parsed.data[0].chainId).toBe(1);
  });

  it('should load from cache and NOT fetch from API', () => {
    const cachedData = {
      timestamp: Date.now(),
      data: [{ chainId: 1, name: 'Ethereum Cached', logoUri: 'eth.png' }],
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));

    service = TestBed.inject(EvmChainMetadataService);

    // Expect NO http request
    httpMock.expectNone('https://li.quest/v1/chains');

    expect(service.byId().size).toBe(1);
    expect(service.get(1)?.name).toBe('Ethereum Cached');
  });

  it('should fetch from API if cache is expired', () => {
    const expiredData = {
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      data: [{ chainId: 1, name: 'Ethereum Cached', logoUri: 'eth.png' }],
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(expiredData));

    service = TestBed.inject(EvmChainMetadataService);

    const req = httpMock.expectOne('https://li.quest/v1/chains');
    req.flush(mockChains);

    expect(service.get(1)?.name).toBe('Ethereum'); // New data
  });
});

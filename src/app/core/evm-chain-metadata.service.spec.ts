import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { EvmChainMetadataService } from './evm-chain-metadata.service';

describe('EvmChainMetadataService', () => {
  let service: EvmChainMetadataService;
  let httpMock: HttpTestingController;

  const mockChainsResponse = {
    chains: [
      { id: 1, name: 'Ethereum', logoURI: 'eth.png', chainType: 'EVM' },
      { id: 56, name: 'BSC', logoURI: 'bsc.png', chainType: 'EVM' },
      { id: 999, name: 'Solana', logoURI: 'sol.png', chainType: 'SOL' }, // Non-EVM
    ],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EvmChainMetadataService],
    });
    service = TestBed.inject(EvmChainMetadataService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  it('should fetch chains from API on first load', () => {
    setup();
    const req = httpMock.expectOne('https://li.quest/v1/chains');
    expect(req.request.method).toBe('GET');
    req.flush(mockChainsResponse);

    expect(service.isLoaded()).toBe(true);
    expect(service.get(1)?.name).toBe('Ethereum');
    expect(service.get(56)?.name).toBe('BSC');
    expect(service.get(999)).toBeNull(); // Filtered out
  });

  it('should save chains to localStorage', () => {
    setup();
    const req = httpMock.expectOne('https://li.quest/v1/chains');
    req.flush(mockChainsResponse);

    const stored = localStorage.getItem('conceal_bridge_chain_metadata');
    expect(stored).toBeTruthy();
    if (stored) {
      const data = JSON.parse(stored);
      // It should be serialized Map (array of entries)
      // data.chains should be [[key, value], [key, value]]
      expect(Array.isArray(data.chains)).toBe(true);
      expect(data.chains.length).toBe(2);
      expect(data.timestamp).toBeGreaterThan(0);
    }
  });

  it('should load chains from localStorage if available and valid', () => {
    // Seed localStorage
    const cache = {
      timestamp: Date.now(),
      chains: [[137, { chainId: 137, name: 'Polygon', logoUri: 'poly.png' }]],
    };
    localStorage.setItem('conceal_bridge_chain_metadata', JSON.stringify(cache));

    setup();

    // Should NOT make a request
    httpMock.expectNone('https://li.quest/v1/chains');

    expect(service.isLoaded()).toBe(true);
    expect(service.get(137)?.name).toBe('Polygon');
  });

  it('should fetch from API if localStorage is expired', () => {
    // Seed expired cache (older than 24h)
    const expiredTime = Date.now() - 25 * 60 * 60 * 1000;
    const cache = {
      timestamp: expiredTime,
      chains: [[137, { chainId: 137, name: 'Polygon', logoUri: 'poly.png' }]],
    };
    localStorage.setItem('conceal_bridge_chain_metadata', JSON.stringify(cache));

    setup();

    // Should make a request
    const req = httpMock.expectOne('https://li.quest/v1/chains');
    req.flush(mockChainsResponse);
  });
});

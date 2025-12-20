import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EvmChainMetadataService, EvmChainMetadata } from './evm-chain-metadata.service';

describe('EvmChainMetadataService', () => {
  let service: EvmChainMetadataService;
  let httpMock: HttpTestingController;

  const mockChainsResponse = {
    chains: [
      { id: 1, name: 'Ethereum', chainType: 'EVM', logoURI: 'eth.png' },
      { id: 56, name: 'BSC', chainType: 'EVM', logoURI: 'bsc.png' },
    ],
  };

  const mockCachedData: EvmChainMetadata[] = [
    { chainId: 1, name: 'Ethereum', logoUri: 'eth.png' },
    { chainId: 56, name: 'BSC', logoUri: 'bsc.png' },
  ];

  const CACHE_KEY = 'evm-chain-metadata-v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EvmChainMetadataService],
    });
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch from API if cache is empty', () => {
    service = TestBed.inject(EvmChainMetadataService);

    const req = httpMock.expectOne('https://li.quest/v1/chains');
    expect(req.request.method).toBe('GET');
    req.flush(mockChainsResponse);

    const stored = localStorage.getItem(CACHE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.data).toEqual(mockCachedData);
    expect(service.get(1)).toEqual(mockCachedData[0]);
  });

  it('should use cache if valid', () => {
    const cache = {
      timestamp: Date.now(),
      data: mockCachedData,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    service = TestBed.inject(EvmChainMetadataService);

    // No HTTP request expected
    httpMock.expectNone('https://li.quest/v1/chains');

    expect(service.get(1)).toEqual(mockCachedData[0]);
  });

  it('should fetch from API if cache is expired', () => {
    const cache = {
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      data: mockCachedData,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    service = TestBed.inject(EvmChainMetadataService);

    const req = httpMock.expectOne('https://li.quest/v1/chains');
    expect(req.request.method).toBe('GET');
    req.flush(mockChainsResponse);

    // Should update cache
    const stored = localStorage.getItem(CACHE_KEY);
    const parsed = JSON.parse(stored!);
    // Timestamp should be recent
    expect(Date.now() - parsed.timestamp).toBeLessThan(1000);
  });
});

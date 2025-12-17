import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BridgeApiService } from './bridge-api.service';
import { APP_CONFIG } from './app-config';
import { BridgeChainConfig } from './bridge-types';

describe('BridgeApiService', () => {
  let service: BridgeApiService;
  let httpMock: HttpTestingController;

  const mockConfig: BridgeChainConfig = {
    common: { maxSwapAmount: 1000, minSwapAmount: 10 },
    wccx: {
      accountAddress: '0x123',
      chainId: 1,
      confirmations: 2,
      contractAddress: '0xabc',
      units: 1000000,
    },
    ccx: { accountAddress: 'ccx123', units: 1000000 },
    tx: { gasMultiplier: 1.1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BridgeApiService,
        {
          provide: APP_CONFIG,
          useValue: { apiBaseUrl: 'https://api.example.com' },
        },
      ],
    });
    service = TestBed.inject(BridgeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch chain config', () => {
    service.getChainConfig('bsc').subscribe((config) => {
      expect(config).toEqual(mockConfig);
    });

    const req = httpMock.expectOne('https://api.example.com/bsc/config/chain');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
  });

  it('should cache chain config', () => {
    // First call
    service.getChainConfig('bsc').subscribe((config) => {
      expect(config).toEqual(mockConfig);
    });

    const req1 = httpMock.expectOne('https://api.example.com/bsc/config/chain');
    expect(req1.request.method).toBe('GET');
    req1.flush(mockConfig);

    // Second call - should return cached value and NOT make a request
    service.getChainConfig('bsc').subscribe((config) => {
      expect(config).toEqual(mockConfig);
    });

    httpMock.expectNone('https://api.example.com/bsc/config/chain');
  });

  it('should fetch new config for different network', () => {
    // Call for BSC
    service.getChainConfig('bsc').subscribe();
    httpMock.expectOne('https://api.example.com/bsc/config/chain').flush(mockConfig);

    // Call for ETH
    service.getChainConfig('eth').subscribe();
    httpMock.expectOne('https://api.example.com/eth/config/chain').flush(mockConfig);
  });
});

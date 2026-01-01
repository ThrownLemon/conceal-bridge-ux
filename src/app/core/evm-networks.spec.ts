import { describe, expect, it } from 'vitest';

import { bscMainnet, EVM_NETWORKS, polygonMainnet } from './evm-networks';

/**
 * These tests verify our chain overrides align with ethereum-lists/chains
 * canonical values to prevent MetaMask warnings.
 */
describe('EVM_NETWORKS', () => {
  describe('chain configuration structure', () => {
    it('should have all required network keys', () => {
      expect(EVM_NETWORKS.eth).toBeDefined();
      expect(EVM_NETWORKS.bsc).toBeDefined();
      expect(EVM_NETWORKS.plg).toBeDefined();
    });

    it('should have chain objects with required properties', () => {
      for (const key of ['eth', 'bsc', 'plg'] as const) {
        const network = EVM_NETWORKS[key];
        expect(network.key).toBe(key);
        expect(network.label).toBeDefined();
        expect(network.logoUri).toBeDefined();
        expect(network.chain).toBeDefined();
        expect(network.chain.id).toBeTypeOf('number');
        expect(network.chain.name).toBeTypeOf('string');
      }
    });
  });

  describe('production chain overrides', () => {
    it('should use ethereum-lists/chains canonical BSC name', () => {
      expect(bscMainnet.name).toBe('BNB Smart Chain Mainnet');
    });

    it('should use ethereum-lists/chains canonical Polygon name', () => {
      expect(polygonMainnet.name).toBe('Polygon Mainnet');
    });

    it('should provide multiple BSC RPC endpoints for resiliency', () => {
      const defaultRpcs = bscMainnet.rpcUrls.default.http;
      expect(defaultRpcs).toContain('https://bsc-dataseed1.bnbchain.org');
      expect(defaultRpcs).toContain('https://bsc-dataseed2.bnbchain.org');
      expect(defaultRpcs).toContain('https://bsc-dataseed3.bnbchain.org');
      expect(defaultRpcs.length).toBe(3);
    });

    it('should provide both default and public RPC URLs for BSC', () => {
      expect(bscMainnet.rpcUrls.default).toBeDefined();
      expect(bscMainnet.rpcUrls['public']).toBeDefined();
      expect(bscMainnet.rpcUrls['public'].http).toEqual(bscMainnet.rpcUrls.default.http);
    });
  });
});

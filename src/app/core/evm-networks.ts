import { bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia, type Chain } from 'viem/chains';

import { environment } from '../../environments/environment';
import type { EvmNetworkKey } from './bridge-types';

export interface EvmNetworkInfo {
  key: EvmNetworkKey;
  label: string;
  logoUri: string;
  chain: Chain;
}

// Use testnets in development, mainnets in production
const chains = environment.production
  ? {
      eth: mainnet,
      bsc: bsc,
      plg: polygon,
    }
  : {
      eth: sepolia,
      bsc: bscTestnet,
      plg: polygonAmoy,
    };

export const EVM_NETWORKS: Record<EvmNetworkKey, EvmNetworkInfo> = {
  eth: {
    key: 'eth',
    label: environment.production ? 'Ethereum Mainnet' : 'Sepolia Testnet',
    logoUri: 'images/branding/eth.png',
    chain: chains.eth,
  },
  bsc: {
    key: 'bsc',
    label: environment.production ? 'BNB Smart Chain Mainnet' : 'BNB Smart Chain Testnet',
    logoUri: 'images/branding/bsc.png',
    chain: chains.bsc,
  },
  plg: {
    key: 'plg',
    label: environment.production ? 'Polygon Mainnet' : 'Polygon Amoy Testnet',
    logoUri: 'images/branding/plg.png',
    chain: chains.plg,
  },
};

import { bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia, type Chain } from 'viem/chains';

import { environment } from '../../environments/environment';
import type { EvmNetworkKey } from './bridge-types';

export interface EvmNetworkInfo {
  key: EvmNetworkKey;
  label: string;
  logoUri: string;
  chain: Chain;
}

// Override chain names and RPC URLs to match ethereum-lists/chains canonical values.
// This prevents MetaMask warnings when adding the network.
// See: https://github.com/ethereum-lists/chains
const amoy: Chain = { ...polygonAmoy, name: 'Amoy' };

// Exported for testing - ensures our overrides match ethereum-lists/chains
export const bscMainnet: Chain = {
  ...bsc,
  name: 'BNB Smart Chain Mainnet',
  rpcUrls: {
    default: {
      http: [
        'https://bsc-dataseed1.bnbchain.org',
        'https://bsc-dataseed2.bnbchain.org',
        'https://bsc-dataseed3.bnbchain.org',
      ],
    },
    public: {
      http: [
        'https://bsc-dataseed1.bnbchain.org',
        'https://bsc-dataseed2.bnbchain.org',
        'https://bsc-dataseed3.bnbchain.org',
      ],
    },
  },
};

export const polygonMainnet: Chain = {
  ...polygon,
  name: 'Polygon Mainnet',
};

// Use testnets in development, mainnets in production
const chains = environment.production
  ? {
      eth: mainnet,
      bsc: bscMainnet,
      plg: polygonMainnet,
    }
  : {
      eth: sepolia,
      bsc: bscTestnet,
      plg: amoy,
    };

export const EVM_NETWORKS: Record<EvmNetworkKey, EvmNetworkInfo> = {
  eth: {
    key: 'eth',
    label: environment.production ? 'Ethereum Mainnet' : 'Sepolia Testnet',
    logoUri: 'images/networks/ethereum.svg',
    chain: chains.eth,
  },
  bsc: {
    key: 'bsc',
    label: environment.production ? 'BNB Smart Chain Mainnet' : 'BNB Smart Chain Testnet',
    logoUri: 'images/networks/bsc.svg',
    chain: chains.bsc,
  },
  plg: {
    key: 'plg',
    label: environment.production ? 'Polygon Mainnet' : 'Polygon Amoy Testnet',
    logoUri: 'images/networks/polygon.svg',
    chain: chains.plg,
  },
};

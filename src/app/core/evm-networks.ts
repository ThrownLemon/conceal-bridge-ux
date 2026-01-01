import { bsc, bscTestnet, mainnet, polygon, polygonAmoy, sepolia, type Chain } from 'viem/chains';

import { environment } from '../../environments/environment';
import type { EvmNetworkKey } from './bridge-types';

export interface EvmNetworkInfo {
  key: EvmNetworkKey;
  label: string;
  logoUri: string;
  chain: Chain;
}

// Override Polygon Amoy name to match ethereum-lists/chains canonical name
// This prevents MetaMask warnings when adding the network
const amoy: Chain = { ...polygonAmoy, name: 'Amoy' };

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

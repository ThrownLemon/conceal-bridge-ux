import { bsc, mainnet, polygon, type Chain } from 'viem/chains';

import type { EvmNetworkKey } from './bridge-types';

export interface EvmNetworkInfo {
  key: EvmNetworkKey;
  label: string;
  chain: Chain;
}

export const EVM_NETWORKS: Record<EvmNetworkKey, EvmNetworkInfo> = {
  eth: { key: 'eth', label: 'Ethereum Mainnet', chain: mainnet },
  bsc: { key: 'bsc', label: 'BNB Smart Chain Mainnet', chain: bsc },
  plg: { key: 'plg', label: 'Polygon Mainnet', chain: polygon },
};

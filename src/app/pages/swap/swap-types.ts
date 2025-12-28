import type { BridgeChainConfig, EvmNetworkKey, SwapDirection } from '../../core/bridge-types';
import type { EvmNetworkInfo } from '../../core/evm-networks';

export interface SwapContext {
  direction: SwapDirection;
  networkKey: EvmNetworkKey;
  networkInfo: EvmNetworkInfo;
  config: BridgeChainConfig;
}

export const CCX_ADDRESS_RE = /^[Cc][Cc][Xx][a-zA-Z0-9]{95}$/;
export const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function inferDecimalsFromUnits(units: number): number | null {
  if (!Number.isFinite(units) || units <= 0) return null;
  const decimals = Math.round(Math.log10(units));
  if (decimals < 0 || decimals > 18) return null;
  if (10 ** decimals !== units) return null;
  return decimals;
}

export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

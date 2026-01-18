import { formatUnits } from 'viem';

/**
 * Formats a BigInt amount to a human-readable string with specified decimals.
 * Handles edge cases like zero and very small amounts.
 *
 * @param amount - The amount as BigInt (in smallest units)
 * @param decimals - The number of decimal places in the token
 * @param maxDisplayDecimals - Maximum decimals to show (default: 6)
 * @returns Formatted string with locale-aware number formatting
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxDisplayDecimals = 6,
): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return '0';
  if (num > 0 && num < 0.000001) return '<0.000001';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDisplayDecimals,
  });
}

/**
 * Formats a native token amount (ETH/BNB/MATIC) with its symbol.
 * Native tokens use 18 decimals.
 *
 * @param amount - The amount in wei (BigInt)
 * @param symbol - The token symbol (e.g., 'ETH', 'BNB', 'MATIC')
 * @returns Formatted string like "0.5 ETH"
 */
export function formatNativeAmount(amount: bigint, symbol: string): string {
  return `${formatTokenAmount(amount, 18, 6)} ${symbol}`;
}

/**
 * Formats CCX/wCCX amounts (6 decimals).
 *
 * @param amount - The amount in atomic units (BigInt)
 * @returns Formatted string
 */
export function formatCcxAmount(amount: bigint): string {
  return formatTokenAmount(amount, 6, 6);
}

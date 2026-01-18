import { describe, expect, it } from 'vitest';

import { formatCcxAmount, formatNativeAmount, formatTokenAmount } from './format.utils';

describe('formatTokenAmount', () => {
  it('should format zero as "0"', () => {
    expect(formatTokenAmount(0n, 6)).toBe('0');
    expect(formatTokenAmount(0n, 18)).toBe('0');
  });

  it('should format whole numbers correctly', () => {
    // 1 token with 6 decimals = 1000000 smallest units
    expect(formatTokenAmount(1000000n, 6)).toBe('1');
    // 100 tokens
    expect(formatTokenAmount(100000000n, 6)).toBe('100');
  });

  it('should format fractional amounts correctly', () => {
    // 0.5 tokens with 6 decimals
    expect(formatTokenAmount(500000n, 6)).toBe('0.5');
    // 1.234567 tokens
    expect(formatTokenAmount(1234567n, 6)).toBe('1.234567');
  });

  it('should display "<0.000001" for very small amounts', () => {
    // 0.0000001 (below threshold)
    expect(formatTokenAmount(100n, 18)).toBe('<0.000001');
    // Just under threshold
    expect(formatTokenAmount(999n, 18)).toBe('<0.000001');
  });

  it('should use locale formatting for large numbers', () => {
    // 1,000,000 tokens
    expect(formatTokenAmount(1000000000000n, 6)).toBe('1,000,000');
    // 1,234,567.89 tokens
    expect(formatTokenAmount(1234567890000n, 6)).toBe('1,234,567.89');
  });

  it('should respect maxDisplayDecimals parameter', () => {
    // 1.123456789 tokens with max 2 decimals
    expect(formatTokenAmount(1123456789n, 9, 2)).toBe('1.12');
    // Same with max 4 decimals
    expect(formatTokenAmount(1123456789n, 9, 4)).toBe('1.1235');
  });

  it('should handle 18 decimal tokens (ETH-like)', () => {
    // 1 ETH = 1e18 wei
    expect(formatTokenAmount(1000000000000000000n, 18)).toBe('1');
    // 0.001 ETH
    expect(formatTokenAmount(1000000000000000n, 18)).toBe('0.001');
    // 123.456789 ETH
    expect(formatTokenAmount(123456789000000000000n, 18)).toBe('123.456789');
  });
});

describe('formatNativeAmount', () => {
  it('should format ETH amounts with symbol', () => {
    // 1 ETH
    expect(formatNativeAmount(1000000000000000000n, 'ETH')).toBe('1 ETH');
    // 0.5 ETH
    expect(formatNativeAmount(500000000000000000n, 'ETH')).toBe('0.5 ETH');
  });

  it('should format BNB amounts with symbol', () => {
    // 0.001 BNB
    expect(formatNativeAmount(1000000000000000n, 'BNB')).toBe('0.001 BNB');
  });

  it('should format MATIC amounts with symbol', () => {
    // 10 MATIC
    expect(formatNativeAmount(10000000000000000000n, 'MATIC')).toBe('10 MATIC');
  });

  it('should handle zero gas', () => {
    expect(formatNativeAmount(0n, 'ETH')).toBe('0 ETH');
  });
});

describe('formatCcxAmount', () => {
  it('should format CCX amounts (6 decimals)', () => {
    // 1 CCX
    expect(formatCcxAmount(1000000n)).toBe('1');
    // 100 CCX
    expect(formatCcxAmount(100000000n)).toBe('100');
    // 0.5 CCX
    expect(formatCcxAmount(500000n)).toBe('0.5');
  });

  it('should handle large CCX amounts', () => {
    // 1,000,000 CCX
    expect(formatCcxAmount(1000000000000n)).toBe('1,000,000');
  });

  it('should handle very small CCX amounts', () => {
    // 0.000001 CCX (minimum unit)
    expect(formatCcxAmount(1n)).toBe('0.000001');
  });
});

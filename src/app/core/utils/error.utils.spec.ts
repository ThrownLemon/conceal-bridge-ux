import { describe, expect, it } from 'vitest';

import { getErrorMessage, isWalletError, WALLET_ERROR_CODES } from './error.utils';

describe('getErrorMessage', () => {
  it('should extract message from Error instance', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('should return string errors directly', () => {
    expect(getErrorMessage('Network timeout')).toBe('Network timeout');
  });

  it('should return fallback for null', () => {
    expect(getErrorMessage(null)).toBe('An error occurred');
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });

  it('should return fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An error occurred');
  });

  it('should return fallback for objects without message', () => {
    expect(getErrorMessage({ code: 4001 })).toBe('An error occurred');
  });

  it('should return fallback for numbers', () => {
    expect(getErrorMessage(404)).toBe('An error occurred');
  });

  it('should return custom fallback when provided', () => {
    expect(getErrorMessage({}, 'Operation failed')).toBe('Operation failed');
  });

  it('should handle empty string errors', () => {
    expect(getErrorMessage('')).toBe('');
  });
});

describe('isWalletError', () => {
  it('should return true for objects with numeric code', () => {
    expect(isWalletError({ code: 4001 })).toBe(true);
    expect(isWalletError({ code: -32603 })).toBe(true);
    expect(isWalletError({ code: 0 })).toBe(true);
  });

  it('should return true for Error with code property', () => {
    const error = new Error('User rejected') as Error & { code: number };
    error.code = 4001;
    expect(isWalletError(error)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isWalletError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isWalletError(undefined)).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(isWalletError('error')).toBe(false);
    expect(isWalletError(123)).toBe(false);
    expect(isWalletError(true)).toBe(false);
  });

  it('should return false for objects without code', () => {
    expect(isWalletError({})).toBe(false);
    expect(isWalletError({ message: 'error' })).toBe(false);
  });

  it('should return false for objects with non-numeric code', () => {
    expect(isWalletError({ code: '4001' })).toBe(false);
    expect(isWalletError({ code: null })).toBe(false);
    expect(isWalletError({ code: undefined })).toBe(false);
  });
});

describe('WALLET_ERROR_CODES', () => {
  it('should have USER_REJECTED code as 4001', () => {
    expect(WALLET_ERROR_CODES.USER_REJECTED).toBe(4001);
  });

  it('should have UNSUPPORTED code as -32603', () => {
    expect(WALLET_ERROR_CODES.UNSUPPORTED).toBe(-32603);
  });

  it('should be usable in switch statements', () => {
    const error = { code: 4001 };
    let result = '';

    if (isWalletError(error)) {
      switch (error.code) {
        case WALLET_ERROR_CODES.USER_REJECTED:
          result = 'rejected';
          break;
        case WALLET_ERROR_CODES.UNSUPPORTED:
          result = 'unsupported';
          break;
      }
    }

    expect(result).toBe('rejected');
  });
});

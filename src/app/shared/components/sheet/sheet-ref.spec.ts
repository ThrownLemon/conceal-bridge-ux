import { ZardSheetRef } from './sheet-ref';
import { ZardSheetOptions } from './sheet.component';

describe('ZardSheetRef (SSR)', () => {
  it('should not throw when constructed without overlay/container', () => {
    const serverPlatformId = 'server' as unknown as object;
    expect(
      () => new ZardSheetRef(null, new ZardSheetOptions(), null, serverPlatformId),
    ).not.toThrow();
  });

  it('close() should be a no-op when container is missing', () => {
    const serverPlatformId = 'server' as unknown as object;
    const ref = new ZardSheetRef(null, new ZardSheetOptions(), null, serverPlatformId);
    expect(() => ref.close()).not.toThrow();
  });
});

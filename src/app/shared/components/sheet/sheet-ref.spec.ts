import { PLATFORM_SERVER_ID } from '@angular/common';

import { ZardSheetRef } from './sheet-ref';
import { ZardSheetOptions } from './sheet.component';

describe('ZardSheetRef (SSR)', () => {
  it('should not throw when constructed without overlay/container', () => {
    expect(() => new ZardSheetRef(null, new ZardSheetOptions(), null, PLATFORM_SERVER_ID)).not.toThrow();
  });

  it('close() should be a no-op when container is missing', () => {
    const ref = new ZardSheetRef(null, new ZardSheetOptions(), null, PLATFORM_SERVER_ID);
    expect(() => ref.close()).not.toThrow();
  });
});


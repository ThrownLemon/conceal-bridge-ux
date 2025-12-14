import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { QrCode } from './qr-code.utils';

@Component({
  selector: 'app-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid place-items-center gap-2">
      @if (qrData(); as qr) {
        <svg
          class="block rounded-lg bg-white p-2 shadow-sm"
          [attr.width]="size()"
          [attr.height]="size()"
          [attr.viewBox]="qr.viewBox"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path [attr.d]="qr.path" fill="#0f172a" />
        </svg>
      } @else {
        <div class="text-sm text-[var(--cb-color-muted)]">No QR data.</div>
      }
    </div>
  `,
})
export class QrCodeComponent {
  readonly data = input<string>('');
  readonly size = input<number>(260);
  readonly alt = input<string>('QR code');

  readonly qrData = computed(() => {
    const text = this.data().trim();
    if (!text) return null;

    try {
      const qr = QrCode.encodeText(text, QrCode.Ecc.MEDIUM);
      const size = qr.size;
      const modules = [];

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (qr.getModule(x, y)) {
            // Simple 1x1 rect path
            modules.push(`M${x},${y}h1v1h-1z`);
          }
        }
      }

      return {
        viewBox: `0 0 ${size} ${size}`,
        path: modules.join(''),
      };
    } catch (e) {
      console.error('QR Gen Error:', e);
      return null;
    }
  });
}

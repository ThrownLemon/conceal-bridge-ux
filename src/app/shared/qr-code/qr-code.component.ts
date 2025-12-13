import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid place-items-center gap-2">
      @if (dataUrl(); as url) {
        <img
          class="h-auto rounded-lg bg-white p-2 shadow-sm"
          [attr.alt]="alt()"
          [attr.width]="size()"
          [attr.height]="size()"
          [src]="url"
        />
      } @else if (isLoading()) {
        <div class="text-sm text-[var(--cb-color-muted)]">Generating QR…</div>
      } @else if (error(); as err) {
        <div class="text-sm text-red-300">{{ err }}</div>
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

  readonly dataUrl = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    let generation = 0;

    effect(() => {
      const value = this.data().trim();
      const size = this.size();

      generation += 1;
      const current = generation;

      if (!value) {
        this.dataUrl.set(null);
        this.error.set(null);
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      this.error.set(null);

      void QRCode.toDataURL(value, {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url: string) => {
          if (current !== generation) return;
          this.dataUrl.set(url);
        })
        .catch((e: unknown) => {
          if (current !== generation) return;
          const msg = e instanceof Error ? e.message : 'Failed to generate QR code.';
          this.error.set(msg);
          this.dataUrl.set(null);
        })
        .finally(() => {
          if (current !== generation) return;
          this.isLoading.set(false);
        });
    });
  }
}



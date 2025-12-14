import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div
      class="mx-auto max-w-2xl rounded-2xl border border-[var(--cb-color-border)] bg-[var(--cb-color-surface)] p-6"
    >
      <h1 class="text-xl font-semibold text-[var(--cb-color-text)]">Page not found</h1>
      <p class="mt-2 text-sm text-[var(--cb-color-muted)]">
        The page you’re looking for doesn’t exist.
      </p>
      <a
        routerLink="/"
        class="mt-5 inline-flex items-center justify-center rounded-lg bg-[var(--cb-color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--cb-color-accent)]/80"
      >
        Go home
      </a>
    </div>
  `,
})
export class NotFoundPage {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 class="text-xl font-semibold text-slate-50">Page not found</h1>
      <p class="mt-2 text-sm text-slate-300">
        The page you’re looking for doesn’t exist.
      </p>
      <a
        routerLink="/"
        class="mt-5 inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
      >
        Go home
      </a>
    </div>
  `,
})
export class NotFoundPage {}



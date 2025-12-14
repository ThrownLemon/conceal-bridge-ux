import { Injectable, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly #document = inject(DOCUMENT);
  readonly #storageKey = 'conceal_bridge_theme';

  // Default to 'dark' if no preference is saved.
  readonly theme = signal<Theme>(this.#readTheme() ?? 'dark');

  constructor() {
    effect(() => {
      const current = this.theme();
      this.#applyTheme(current);
      this.#saveTheme(current);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  #readTheme(): Theme | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.#storageKey) as Theme | null;
  }

  #saveTheme(t: Theme): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.#storageKey, t);
  }

  #applyTheme(t: Theme): void {
    const html = this.#document.documentElement;
    if (t === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }
}

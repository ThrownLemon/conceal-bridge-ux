import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ZardCardComponent, ZardButtonComponent],
  template: `
    <z-card class="mx-auto max-w-2xl" zTitle="Page not found">
      <p class="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      <div card-footer>
        <a z-button routerLink="/">Go home</a>
      </div>
    </z-card>
  `,
})
export class NotFoundPage {}

import { Component, input } from '@angular/core';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-swap-step-header',
  imports: [ZardIconComponent],
  templateUrl: './swap-step-header.html',
  styleUrl: './swap-step-header.css',
})
export class SwapStepHeader {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly showSpinner = input(false);
}

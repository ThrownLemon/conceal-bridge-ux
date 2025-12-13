import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { WalletButtonComponent } from './shared/wallet/wallet-button.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, WalletButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly year = new Date().getFullYear();
}

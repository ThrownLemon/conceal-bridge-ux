import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ThemeService } from './core/theme.service';
import { TransactionHistoryService } from './core/transaction-history.service';
import { TransactionHistoryComponent } from './shared/transaction-history/transaction-history.component';
import { WalletButtonComponent } from './shared/wallet/wallet-button.component';
import { WalletModalComponent } from './shared/wallet/wallet-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, WalletButtonComponent, TransactionHistoryComponent, WalletModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly themeService = inject(ThemeService);
  protected readonly historyService = inject(TransactionHistoryService);
  protected readonly year = new Date().getFullYear();
}

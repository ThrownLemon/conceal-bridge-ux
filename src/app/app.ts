import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ErrorBoundaryComponent } from '@/shared/components/error-boundary/error-boundary.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { TransactionHistoryService } from './core/transaction-history.service';
import { ZardDarkMode, EDarkModes } from './shared/services/dark-mode';
import { TransactionHistoryComponent } from './shared/transaction-history/transaction-history.component';
import { WalletButtonComponent } from './shared/wallet/wallet-button.component';
import { WalletModalComponent } from './shared/wallet/wallet-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterLink,
    RouterOutlet,
    ErrorBoundaryComponent,
    WalletButtonComponent,
    TransactionHistoryComponent,
    WalletModalComponent,
    ZardButtonComponent,
    ZardIconComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly darkMode = inject(ZardDarkMode);
  protected readonly historyService = inject(TransactionHistoryService);
  protected readonly year = new Date().getFullYear();
  protected readonly EDarkModes = EDarkModes;
}

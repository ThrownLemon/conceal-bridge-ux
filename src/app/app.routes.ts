import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
    title: 'Conceal Bridge',
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'swap/:direction/:network',
    loadComponent: () => import('./pages/swap/swap.page').then((m) => m.SwapPage),
    title: 'Swap',
  },

  // Legacy compatibility (old Angular app used /eth, /bsc, /plg, /ccx)
  { path: 'eth', redirectTo: 'swap/ccx-to-evm/eth', pathMatch: 'full' },
  { path: 'bsc', redirectTo: 'swap/ccx-to-evm/bsc', pathMatch: 'full' },
  { path: 'plg', redirectTo: 'swap/ccx-to-evm/plg', pathMatch: 'full' },
  { path: 'ccx', redirectTo: '', pathMatch: 'full' },

  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
    title: 'Not found',
  },
];

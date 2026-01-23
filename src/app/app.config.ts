import { ApplicationConfig, APP_INITIALIZER, ErrorHandler, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { provideZard } from '@/shared/core/provider/providezard';
import { GlobalErrorHandler } from './core/global-error-handler.service';
import { PwaUpdateService } from './core/pwa-update.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideZard(),
    { provide: ErrorHandler, useExisting: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: (pwaUpdate: PwaUpdateService) => () => pwaUpdate,
      deps: [PwaUpdateService],
      multi: true,
    },
  ],
};

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { httpErrorInterceptor } from './core/auth/interceptors/http-error.interceptor';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideSpartanHlm(),
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
  ],
};

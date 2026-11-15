import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { registerLocaleData } from "@angular/common";
import localeEsCo from "@angular/common/locales/es-CO";
import { ApplicationConfig, DEFAULT_CURRENCY_CODE, LOCALE_ID } from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter, withEnabledBlockingInitialNavigation, withHashLocation, withInMemoryScrolling, withRouterConfig, withViewTransitions } from "@angular/router";
import { routes } from './app-routing.module';
import { sesionInterceptor } from "./interceptors/sesion.interceptor";

// Formatos de Colombia para números, moneda y fechas ($ 65.000,50).
registerLocaleData(localeEsCo, 'es-CO');

export const appConfig: ApplicationConfig = {
    providers: [
      provideRouter(routes,
        withRouterConfig({
          onSameUrlNavigation: 'reload'
        }),
        withInMemoryScrolling({
          scrollPositionRestoration: 'top',
          anchorScrolling: 'enabled'
        }),
        withEnabledBlockingInitialNavigation(),
        withViewTransitions(),
        withHashLocation()
      ),
      provideHttpClient(withInterceptors([sesionInterceptor])),
      provideAnimations(),
      { provide: LOCALE_ID, useValue: 'es-CO' },
      { provide: DEFAULT_CURRENCY_CODE, useValue: 'COP' }
    ]
  };

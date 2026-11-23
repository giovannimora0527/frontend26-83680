import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { ApplicationConfig, LOCALE_ID } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import localeEs from "@angular/common/locales/es";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter, withEnabledBlockingInitialNavigation, withHashLocation, withInMemoryScrolling, withRouterConfig, withViewTransitions } from "@angular/router";
import { routes } from './app-routing.module';
import { HeadersInterceptor } from "./interceptors/headers.interceptor";

// Fechas y meses en espanol (ej: 16 oct 2026)
registerLocaleData(localeEs);

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
      // withInterceptorsFromDi: necesario para que se ejecute HeadersInterceptor (registrado abajo)
      provideHttpClient(withInterceptorsFromDi()),
      provideAnimations(),
      { provide: LOCALE_ID, useValue: 'es' },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: HeadersInterceptor,
        multi: true, // Permite múltiples interceptores
      }
    ]
  };
import { Observable, catchError, throwError } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * Agrega el Content-Type y, si el backend responde 401 (sesion vencida),
 * limpia la sesion y manda al login.
 */
@Injectable()
export class HeadersInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Los archivos (FormData) llevan su propio Content-Type
    const peticion = req.body instanceof FormData || req.headers.has('Content-Type')
      ? req
      : req.clone({ setHeaders: { 'Content-Type': 'application/json' } });

    return next.handle(peticion).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('sesion');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}

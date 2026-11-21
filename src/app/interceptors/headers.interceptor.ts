import { Observable, catchError, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


@Injectable()
export class HeadersInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const clonedRequest = req.body instanceof FormData
      ? req
      : req.clone({ setHeaders: { 'Content-Type': 'application/json' } });
    return next.handle(clonedRequest).pipe(catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && req.url.endsWith('/auth/login') === false) {
        this.authService.logout();
        void this.router.navigate(['/login']);
      }
      return throwError(() => error);
    }));
  }

  addHeaders(request: HttpRequest<unknown>): HttpRequest<any> {
    return (request = request.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    }));
  }
}
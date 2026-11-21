import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Agrega el token Bearer y, si el backend responde 401, cierra la sesión y avisa en el login. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(peticion).pipe(catchError((err: HttpErrorResponse) => {
    if (err.status === 401 && !req.url.endsWith('/auth/login')) {
      // Había token: la sesión venció, se cerró en otro lado o el usuario fue inactivado.
      auth.logout(false, !!token);
    }
    return throwError(() => err);
  }));
};

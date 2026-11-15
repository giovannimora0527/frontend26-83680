import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from 'src/app/services/auth.service';

/**
 * Si el backend responde 401 (sesión vencida o usuario inactivado), borra la
 * sesión y envía al login. Las credenciales incorrectas del propio login se
 * dejan pasar para mostrarlas en su formulario.
 *
 * @param peticion petición en curso.
 * @param siguiente siguiente paso de la cadena.
 * @returns respuesta de la petición.
 */
export const sesionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return siguiente(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !peticion.url.endsWith('/auth/login')) {
        auth.cerrarSesion();
        router.navigate(['/login'], { queryParams: { expirada: 1 } });
      }
      return throwError(() => error);
    })
  );
};

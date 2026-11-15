import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { AuthService } from 'src/app/services/auth.service';

/** Exige una sesión iniciada; sin ella envía a la pantalla de login. */
export const sesionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.verificarSesion().pipe(map((activa) => activa || router.parseUrl('/login')));
};

/**
 * Permite abrir una pantalla solo si está entre los menús del perfil; en
 * caso contrario devuelve al inicio.
 *
 * @param _ruta ruta que se intenta abrir.
 * @param estado estado del enrutador, con la dirección solicitada.
 * @returns true o la redirección al inicio.
 */
export const menuGuard: CanActivateChildFn = (_ruta, estado) => {
  const url = estado.url.split('?')[0];
  return inject(AuthService).tieneMenu(url) || inject(Router).parseUrl('/inicio');
};

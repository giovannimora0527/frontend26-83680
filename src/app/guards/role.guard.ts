import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { getJwtPayload } from '../utils/jwt.util';
import { rolPuedeAcceder } from '../constants/role-permissions';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);

  const payload = getJwtPayload();
  if (!payload) {
    return router.createUrlTree(['/login']);
  }

  // El path del segmento actual (ej: 'usuarios', 'citas', etc.)
  const path = route.routeConfig?.path ?? '';
  if (rolPuedeAcceder(payload.rol, path)) {
    return true;
  }

  // Sin permiso → redirige a la primera ruta permitida o al login
  return router.createUrlTree(['/inicio/citas']);
};

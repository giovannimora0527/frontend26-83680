import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Deja entrar solo si hay sesion. Si la ruta tiene data.menu, ademas revisa que
 * el perfil tenga ese menu (el backend tambien valida los permisos).
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }
  const menu = route.data?.['menu'] as string | undefined;
  if (menu && !auth.tieneMenu(menu)) {
    return router.createUrlTree(['/inicio']);
  }
  return true;
};

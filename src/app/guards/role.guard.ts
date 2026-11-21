import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  const rol = authService.role();
  const rolesPermitidos = route.data['roles'] as string[] | undefined;
  if (!rolesPermitidos || rolesPermitidos.includes(rol)) {
    return true;
  }
  return router.parseUrl(authService.homeRoute());
};

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { Mensajes } from './mensajes';

/** Exige sesión activa y, la primera vez que se abre la aplicación, la confirma con el backend. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.estaAutenticado()) {
    auth.logout(false);
    return false;
  }
  return auth.verificarSesion().pipe(map(ok => {
    if (!ok) { auth.logout(false, true); }
    return ok;
  }));
};

/**
 * Deja entrar solo a las rutas que están entre los menús del perfil (los define el administrador
 * en "Perfiles y permisos"). Una ruta que no es menú, como la atención de una cita, declara en
 * data.menu el menú del que depende. Los servicios del backend validan el perfil por su cuenta.
 */
export const menuGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (route.data?.['libre']) { return true; }
  const menu: string | undefined = route.data?.['menu'];
  if (auth.tieneMenu(menu ?? state.url)) { return true; }
  Mensajes.aviso('Acceso restringido', 'Su perfil no tiene asignado este módulo.');
  return router.createUrlTree(['/inicio']);
};

/** Si ya hay sesión, el login redirige al inicio. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaAutenticado() ? inject(Router).createUrlTree(['/inicio']) : true;
};

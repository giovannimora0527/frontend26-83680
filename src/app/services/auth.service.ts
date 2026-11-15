import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { LoginRq, LoginRs, Perfil, Rol } from 'src/app/models/auth';
import { NavigationItem } from 'src/app/theme/layout/admin/navigation/navigation';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Clave del token en el almacenamiento local (la misma que usa BackendService). */
const CLAVE_TOKEN = 'token';
/** Clave del perfil en el almacenamiento local. */
const CLAVE_PERFIL = 'perfil';

/**
 * Maneja la sesión del usuario: inicio y cierre de sesión, perfil y roles.
 * Saber el rol aquí solo sirve para adaptar la interfaz; quien autoriza cada
 * operación es el backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Recurso del backend para la autenticación. */
  private readonly api = 'auth';
  /** Indica si el perfil ya se confirmó con el backend desde que se abrió la aplicación. */
  private perfilVerificado = false;

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /** Perfil del usuario autenticado (null si no hay sesión). */
  get perfil(): Perfil | null {
    const guardado = localStorage.getItem(CLAVE_PERFIL);
    return guardado ? (JSON.parse(guardado) as Perfil) : null;
  }

  /** Indica si hay una sesión iniciada. */
  get autenticado(): boolean {
    return !!localStorage.getItem(CLAVE_TOKEN) && !!this.perfil;
  }

  /**
   * Inicia sesión y guarda el token y el perfil.
   *
   * @param credenciales usuario y contraseña.
   * @returns respuesta del backend.
   */
  iniciarSesion(credenciales: LoginRq): Observable<LoginRs> {
    this.cerrarSesion();
    return this.backendService.post<LoginRs>(environment.apiUrlAuth, this.api, 'login', credenciales).pipe(
      tap((respuesta) => {
        localStorage.setItem(CLAVE_TOKEN, respuesta.token);
        localStorage.setItem(CLAVE_PERFIL, JSON.stringify(respuesta.perfil));
        this.perfilVerificado = true;
      })
    );
  }

  /** Borra los datos de la sesión del navegador. */
  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_PERFIL);
    this.perfilVerificado = false;
  }

  /**
   * Indica si el usuario tiene alguno de los roles.
   *
   * @param roles roles aceptados.
   * @returns true si su rol está en la lista.
   */
  tieneRol(...roles: Rol[]): boolean {
    const rol = this.perfil?.rol;
    return !!rol && roles.includes(rol);
  }

  /**
   * Indica si una pantalla está entre los menús del perfil.
   *
   * @param url dirección de la pantalla.
   * @returns true si el perfil la tiene asignada.
   */
  tieneMenu(url: string): boolean {
    return this.perfil?.menus?.some((menu) => menu.url === url) ?? false;
  }

  /**
   * Construye la navegación lateral con los menús del perfil.
   *
   * @returns grupo de navegación con las opciones del usuario.
   */
  navegacion(): NavigationItem[] {
    return [{
      id: 'navigation',
      title: 'Inicio',
      type: 'group',
      icon: 'icon-navigation',
      children: (this.perfil?.menus ?? []).map((menu) => ({
        id: menu.code,
        title: menu.title,
        type: 'item',
        url: menu.url,
        icon: menu.icon,
        classes: 'nav-item'
      }))
    }];
  }

  /**
   * Actualiza el perfil con el backend una vez por cada apertura de la
   * aplicación, por si cambió su rol. Si el backend no responde se mantiene
   * el perfil guardado; una sesión vencida la resuelve el interceptor (401).
   *
   * @returns true si sigue habiendo sesión.
   */
  verificarSesion(): Observable<boolean> {
    if (!this.autenticado) {
      return of(false);
    }
    if (this.perfilVerificado) {
      return of(true);
    }
    return this.backendService.get<Perfil>(environment.apiUrlAuth, this.api, 'perfil').pipe(
      tap((perfil) => {
        localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
        this.perfilVerificado = true;
      }),
      map(() => true),
      catchError(() => of(this.autenticado))
    );
  }
}

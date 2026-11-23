import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MenuItem, PERFIL, Sesion } from '../models/sesion';

/**
 * Maneja el inicio y cierre de sesion. Guarda el token en localStorage
 * (BackendService lo envia en cada peticion).
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Llave del token en localStorage. */
  private readonly LLAVE_TOKEN = 'token';
  /** Llave de los datos de la sesion. */
  private readonly LLAVE_SESION = 'sesion';

  constructor(private readonly http: HttpClient, private readonly router: Router) { }

  /**
   * Inicia sesion contra el backend.
   * @param username usuario.
   * @param password contrasena.
   * @returns datos de la sesion.
   */
  login(username: string, password: string): Observable<Sesion> {
    return this.http.post<Sesion>(`${environment.apiUrlAuth}/auth/login`, { username, password }).pipe(
      tap((sesion) => {
        localStorage.setItem(this.LLAVE_TOKEN, sesion.token ?? '');
        localStorage.setItem(this.LLAVE_SESION, JSON.stringify(sesion));
      })
    );
  }

  /** Cierra la sesion en el backend y en el navegador. */
  logout() {
    const token = localStorage.getItem(this.LLAVE_TOKEN);
    if (token) {
      this.http.post(`${environment.apiUrlAuth}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } })
        .subscribe({ error: () => undefined });
    }
    this.limpiar();
    this.router.navigate(['/login']);
  }

  /** Borra los datos locales de la sesion. */
  limpiar() {
    localStorage.removeItem(this.LLAVE_TOKEN);
    localStorage.removeItem(this.LLAVE_SESION);
  }

  /** @returns true si hay una sesion guardada. */
  estaAutenticado(): boolean {
    return !!localStorage.getItem(this.LLAVE_TOKEN) && !!this.sesion();
  }

  /** @returns la sesion actual o null. */
  sesion(): Sesion | null {
    try {
      const texto = localStorage.getItem(this.LLAVE_SESION);
      return texto ? (JSON.parse(texto) as Sesion) : null;
    } catch {
      return null;
    }
  }

  /** @returns menus del perfil. */
  menus(): MenuItem[] {
    return this.sesion()?.menus ?? [];
  }

  /**
   * Indica si el perfil tiene un menu (se usa para proteger rutas).
   * @param code codigo del menu.
   * @returns true si lo tiene.
   */
  tieneMenu(code: string): boolean {
    return this.menus().some((m) => m.code === code);
  }

  /** @returns true si es administrador. */
  esAdministrador(): boolean {
    return this.sesion()?.perfilId === PERFIL.ADMINISTRADOR;
  }

  /** @returns true si es medico. */
  esMedico(): boolean {
    return this.sesion()?.perfilId === PERFIL.MEDICO;
  }

  /** @returns true si es despacho medico. */
  esDespacho(): boolean {
    return this.sesion()?.perfilId === PERFIL.DESPACHO_MEDICO;
  }
}

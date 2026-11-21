import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from './api.service';
import { Menu, Sesion, Usuario } from './models';

const CLAVE = 'clinica.sesion';

/** Sesión del usuario (token Bearer + perfil + menús). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private sesion = signal<Sesion | null>(this.leer());

  usuario = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);
  menus = computed<Menu[]>(() => this.sesion()?.menus ?? []);
  perfil = computed<string>(() => this.sesion()?.usuario.perfilCodigo ?? '');

  get token(): string | null {
    return this.sesion()?.token ?? null;
  }

  estaAutenticado(): boolean {
    const s = this.sesion();
    return !!s && new Date(s.expiracion).getTime() > Date.now();
  }

  tienePerfil(...perfiles: string[]): boolean {
    return perfiles.includes(this.perfil());
  }

  /** La ruta está permitida si coincide con un menú asignado al perfil (o cuelga de él). */
  tieneMenu(url: string): boolean {
    const limpia = url.split(/[?#]/)[0].replace(/\/+$/, '');
    return this.menus().some(m => limpia === m.url || limpia.startsWith(m.url + '/'));
  }

  private verificada = false;

  /**
   * Consulta /auth/sesion una vez por carga de la aplicación para traer el perfil y los menús vigentes.
   * Si el administrador cambió los permisos o inactivó al usuario, se refleja sin esperar a que venza el token.
   * Un 401 lo resuelve el interceptor (cierra la sesión); sin conexión se sigue con lo guardado.
   */
  verificarSesion(): Observable<boolean> {
    if (this.verificada) { return of(true); }
    return this.api.get<Sesion>('/auth/sesion').pipe(
      map(r => {
        const actual = this.sesion();
        if (!actual) { return false; }
        this.guardar({ ...actual, usuario: r.usuario, menus: r.menus });
        this.verificada = true;
        return true;
      }),
      catchError((e: HttpErrorResponse) => of(e.status !== 401 && e.status !== 403))
    );
  }

  login(username: string, password: string): Observable<Sesion> {
    return this.api.post<Sesion>('/auth/login', { username, password }).pipe(tap(s => {
      this.guardar(s);
      this.verificada = true;
    }));
  }

  /** @param expirada muestra en el login el aviso de sesión vencida o revocada. */
  logout(llamarBackend = true, expirada = false): void {
    if (llamarBackend && this.token) {
      this.api.post('/auth/logout').subscribe({ error: () => undefined });
    }
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    this.sesion.set(null);
    this.verificada = false;
    this.router.navigate(['/login'], expirada ? { queryParams: { expirada: 1 } } : {});
  }

  /** Vuelve a pedir el perfil y los menús (tras cambiar permisos del propio perfil). */
  recargarMenus(): void {
    this.verificada = false;
    this.verificarSesion().subscribe();
  }

  private guardar(s: Sesion): void {
    try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* almacenamiento no disponible */ }
    this.sesion.set(s);
  }

  private leer(): Sesion | null {
    try {
      const t = localStorage.getItem(CLAVE);
      return t ? JSON.parse(t) as Sesion : null;
    } catch {
      return null;
    }
  }
}

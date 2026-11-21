import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from 'src/app/models/login';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionKey = 'clinica_session';

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrlAuth}/auth/login`, credentials)
      .pipe(tap((response) => {
        localStorage.setItem(this.sessionKey, JSON.stringify(response));
        localStorage.setItem('token', response.token);
        localStorage.setItem('rol', response.usuario.rol ?? '');
      }));
  }

  isAuthenticated(): boolean {
    return this.session() !== null;
  }

  session(): LoginResponse | null {
    const raw = localStorage.getItem(this.sessionKey);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as LoginResponse;
      if (!session.token || !session.usuario?.rol || session.expiresAt <= Date.now()) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      this.logout();
      return null;
    }
  }

  role(): string {
    return (this.session()?.usuario.rol ?? '').toUpperCase();
  }

  homeRoute(): string {
    switch (this.role()) {
      case 'CLIENTE': return '/inicio/mis-mascotas';
      case 'DESPACHO_MEDICO': return '/inicio/formulas-medicas';
      default: return '/inicio/mascotas';
    }
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('rol_activo_clinica');
  }
}

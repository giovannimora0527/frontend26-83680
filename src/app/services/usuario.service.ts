import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Usuario } from 'src/app/models/usuario';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private api = 'usuario';

  constructor(
    private readonly backendService: BackendService
  ) {}


  // ==========================================
  // LISTAR
  // ==========================================

  listar(): Observable<Usuario[]> {

    return this.backendService.get<Usuario[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }


  // ==========================================
  // CREAR
  // ==========================================

  crear(usuario: Usuario): Observable<Usuario> {

    return this.backendService.post<Usuario>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      usuario
    );
  }


  // ==========================================
  // ACTUALIZAR
  // ==========================================

  actualizar(
    id: number,
    usuario: Usuario
  ): Observable<Usuario> {

    return this.backendService.put<Usuario>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      usuario
    );
  }


  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  cambiarEstado(
    id: number,
    activo: boolean
  ): Observable<Usuario> {

    return this.backendService.put<Usuario>(
      environment.apiUrlAuth,
      this.api,
      `estado/${id}`,
      activo
    );
  }
}
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Usuario, UsuarioRq } from 'src/app/models/usuario';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST de usuarios del sistema. */
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  /** Recurso del backend para los usuarios. */
  private readonly api = 'usuario';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todos los usuarios.
   *
   * @returns lista de usuarios.
   */
  listar(): Observable<Usuario[]> {
    return this.backendService.get<Usuario[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta un usuario.
   *
   * @param id identificador del usuario.
   * @returns el usuario encontrado.
   */
  consultar(id: number): Observable<Usuario> {
    return this.backendService.get<Usuario>(environment.apiUrlAuth, this.api, String(id));
  }

  /**
   * Registra un usuario nuevo.
   *
   * @param usuarioRq datos del usuario (con contraseña).
   * @returns mensaje de éxito.
   */
  guardar(usuarioRq: UsuarioRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', usuarioRq);
  }

  /**
   * Modifica un usuario (PUT). Si no se envía contraseña, se conserva la actual.
   *
   * @param id identificador del usuario.
   * @param usuarioRq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(id: number, usuarioRq: UsuarioRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(id), usuarioRq);
  }

  /**
   * Activa o inactiva un usuario. No se elimina para conservar la trazabilidad
   * de lo que registró en el sistema.
   *
   * @param id identificador del usuario.
   * @param activar true para activar, false para inactivar.
   * @returns mensaje de éxito.
   */
  cambiarEstado(id: number, activar: boolean): Observable<RespuestaApi> {
    const accion = activar ? 'activar' : 'inactivar';
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${id}/${accion}`, {});
  }
}

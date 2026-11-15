import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MenuOpcion } from 'src/app/models/auth';
import { PerfilAcceso } from 'src/app/models/perfil';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API de administración de perfiles y menús. */
@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  /** Recurso del backend para los perfiles. */
  private readonly api = 'perfil';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista los perfiles con sus opciones asignadas.
   *
   * @returns perfiles.
   */
  listar(): Observable<PerfilAcceso[]> {
    return this.backendService.get<PerfilAcceso[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Lista todas las opciones de menú.
   *
   * @returns opciones de menú.
   */
  listarMenus(): Observable<MenuOpcion[]> {
    return this.backendService.get<MenuOpcion[]>(environment.apiUrlAuth, this.api, 'menus');
  }

  /**
   * Define las opciones de menú de un perfil.
   *
   * @param perfilId identificador del perfil.
   * @param menuIds opciones que tendrá.
   * @returns mensaje de éxito.
   */
  actualizarMenus(perfilId: number, menuIds: number[]): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${perfilId}/menus`, { menuIds });
  }

  /**
   * Activa o inactiva un perfil.
   *
   * @param perfilId identificador del perfil.
   * @param activar true para activar, false para inactivar.
   * @returns mensaje de éxito.
   */
  cambiarEstadoPerfil(perfilId: number, activar: boolean): Observable<RespuestaApi> {
    const accion = activar ? 'activar' : 'inactivar';
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${perfilId}/${accion}`, {});
  }

  /**
   * Activa o inactiva una opción de menú.
   *
   * @param menuId identificador de la opción.
   * @param activar true para activar, false para inactivar.
   * @returns mensaje de éxito.
   */
  cambiarEstadoMenu(menuId: number, activar: boolean): Observable<RespuestaApi> {
    const accion = activar ? 'activar' : 'inactivar';
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `menu/${menuId}/${accion}`, {});
  }
}

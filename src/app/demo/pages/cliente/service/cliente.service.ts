import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente, ClienteRq } from 'src/app/models/cliente';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST de clientes. */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  /** Recurso del backend para los clientes. */
  private readonly api = 'cliente';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todos los clientes (activos e inactivos).
   *
   * @returns lista de clientes.
   */
  listar(): Observable<Cliente[]> {
    return this.backendService.get<Cliente[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta un cliente.
   *
   * @param clienteId identificador del cliente.
   * @returns el cliente encontrado.
   */
  consultar(clienteId: number): Observable<Cliente> {
    return this.backendService.get<Cliente>(environment.apiUrlAuth, this.api, String(clienteId));
  }

  /**
   * Registra un cliente nuevo.
   *
   * @param clienteRq datos del cliente.
   * @returns mensaje de éxito.
   */
  guardar(clienteRq: ClienteRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', clienteRq);
  }

  /**
   * Modifica un cliente (PUT).
   *
   * @param clienteId identificador del cliente.
   * @param clienteRq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(clienteId: number, clienteRq: ClienteRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(clienteId), clienteRq);
  }

  /**
   * Activa o inactiva un cliente. No se elimina porque tiene mascotas, citas
   * e historias asociadas que quedarían huérfanas.
   *
   * @param clienteId identificador del cliente.
   * @param activar true para activar, false para inactivar.
   * @returns mensaje de éxito.
   */
  cambiarEstado(clienteId: number, activar: boolean): Observable<RespuestaApi> {
    const accion = activar ? 'activar' : 'inactivar';
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${clienteId}/${accion}`, {});
  }
}

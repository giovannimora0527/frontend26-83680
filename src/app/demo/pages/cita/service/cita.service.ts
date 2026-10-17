import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cita, CitaRq, FiltroCitas } from 'src/app/models/cita';
import { Pagina } from 'src/app/models/pagina';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { aParametros } from 'src/app/utils/parametros';
import { environment } from 'src/environments/environment';

/**
 * Servicio de Angular que consume la API REST de citas. Los catálogos del
 * formulario (clientes, mascotas, veterinarios) están en CatalogoService.
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {
  /** Recurso del backend para las citas. */
  private readonly api = 'cita';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Consulta una página de citas aplicando orden y filtros en el backend.
   *
   * @param filtro página, orden y filtros elegidos por el usuario.
   * @returns página de citas.
   */
  listar(filtro: FiltroCitas): Observable<Pagina<Cita>> {
    return this.backendService.get<Pagina<Cita>>(environment.apiUrlAuth, this.api, 'listar', aParametros(filtro));
  }

  /**
   * Consulta el detalle de una cita.
   *
   * @param citaId identificador de la cita.
   * @returns la cita encontrada.
   */
  consultar(citaId: number): Observable<Cita> {
    return this.backendService.get<Cita>(environment.apiUrlAuth, this.api, String(citaId));
  }

  /**
   * Registra una cita nueva.
   *
   * @param citaRq datos de la cita.
   * @returns mensaje de éxito.
   */
  guardar(citaRq: CitaRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', citaRq);
  }

  /**
   * Modifica una cita existente (PUT).
   *
   * @param citaId identificador de la cita.
   * @param citaRq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(citaId: number, citaRq: CitaRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(citaId), citaRq);
  }

  /**
   * Reactiva una cita cancelada (operación explícita).
   *
   * @param citaId identificador de la cita cancelada.
   * @returns mensaje de éxito.
   */
  reactivar(citaId: number): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${citaId}/reactivar`, {});
  }
}
